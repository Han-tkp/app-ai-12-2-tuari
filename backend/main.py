import cv2
import asyncio
import base64
import numpy as np
import onnxruntime as ort
import supervision as sv
import psutil
import json
import os
import pandas as pd
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = logging.getLogger("dropdetect")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Single-threaded executor: ONNX inference runs here, off the event loop
_inference_executor = ThreadPoolExecutor(max_workers=1)

# Profile parameters — resolution stays 640×640 on every profile
PROFILE_SKIP = {"low": 3, "mid": 2, "high": 1}
PROFILE_QUEUE_SIZE = {"low": 2, "mid": 4, "high": 8}
# track_buffer scaled so all profiles retain ~3 s of track history at 30 FPS camera
PROFILE_TRACK_BUFFER = {"low": 90, "mid": 60, "high": 30}

# Letterbox constant: 640×480 camera → 640×640 model input (80px top+bottom padding)
PAD_TOP = 80


def open_camera(idx: int) -> cv2.VideoCapture:
    cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    actual_fps = cap.get(cv2.CAP_PROP_FPS)
    logger.info("Camera %d opened: %dx%d @ %.0f FPS", idx, actual_w, actual_h, actual_fps)
    return cap


def detect_profile() -> str:
    ram_gb = psutil.virtual_memory().total / (1024 ** 3)
    if ram_gb < 6:
        return "low"
    elif ram_gb < 12:
        return "mid"
    else:
        return "high"


# --- Pydantic Models ---
class SlideData(BaseModel):
    id: str
    name: str
    droplets: list[float]

class SaveProjectRequest(BaseModel):
    project_name: str
    target_size: int
    save_directory: str
    slides: list[SlideData]

class ManualDataRequest(BaseModel):
    data: list[float] = []

class DropletSystem:
    def __init__(self):
        self.lens = "10x"
        self.session = None
        self.calibration_value = 2.7926330340561596e-07
        self.conf_threshold = 0.25
        self.profile = detect_profile()
        self.tracker = sv.ByteTrack(track_buffer=PROFILE_TRACK_BUFFER[self.profile])
        self.counted_ids = set()
        self.droplet_data = {}
        self.pending_snapshot = False
        self.is_ai_active = False
        self.inference_skip = PROFILE_SKIP[self.profile]
        self.frame_counter = 0
        self.load_resources("10x")
        logger.info("DropletSystem init — profile=%s  RAM=%.1f GB  skip=1/%d",
                    self.profile,
                    psutil.virtual_memory().total / (1024 ** 3),
                    self.inference_skip)

    def set_profile(self, profile: str):
        if profile in PROFILE_SKIP:
            self.profile = profile
            self.inference_skip = PROFILE_SKIP[profile]
            self.tracker = sv.ByteTrack(track_buffer=PROFILE_TRACK_BUFFER[profile])
            logger.info("Profile overridden to %s (skip=1/%d, track_buffer=%d)", profile, self.inference_skip, PROFILE_TRACK_BUFFER[profile])

    def load_resources(self, lens: str):
        self.lens = lens
        model_path = os.path.join(BASE_DIR, "fileonnx", f"yolov8n_{lens}.onnx")
        json_path = os.path.join(BASE_DIR, "resources", f"{lens}.json")
        if os.path.exists(model_path):
            self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
            self.input_name = self.session.get_inputs()[0].name
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                data = json.load(f)
                for cal in data['calibrations']:
                    if cal['name'].lower() == lens.lower():
                        self.calibration_value = cal['value']
        self.reset_stats()

    def reset_stats(self):
        self.tracker = sv.ByteTrack(track_buffer=PROFILE_TRACK_BUFFER[self.profile])
        self.counted_ids = set()
        self.droplet_data = {}

    def calculate_stats(self):
        if not self.droplet_data: return 0.0, 0.0, 0, [0,0,0], 0
        diams = sorted(self.droplet_data.values())
        vols = [(np.pi / 6) * (float(d)**3) for d in diams]
        total_vol = sum(vols)
        out_of_bounds = sum(1 for d in diams if d < 10.0 or d > 30.0)
        out_of_bounds_pct = (out_of_bounds / len(diams)) * 100 if len(diams) > 0 else 0
        if total_vol == 0: return 0.0, 0.0, len(diams), [0,0,0], round(out_of_bounds_pct, 1)
        cum_vol = np.cumsum(vols) / total_vol
        dv10 = float(diams[np.searchsorted(cum_vol, 0.1)])
        dv50 = float(diams[np.searchsorted(cum_vol, 0.5)])
        dv90 = float(diams[np.searchsorted(cum_vol, 0.9)])
        span = float((dv90 - dv10) / dv50) if dv50 > 0 else 0.0
        return dv50, span, len(diams), [dv10, dv50, dv90], round(out_of_bounds_pct, 1)

    def update_manual_data(self, manual_list):
        # Negative IDs represent manual annotations to avoid collision with tracker IDs
        self.droplet_data = {k: v for k, v in self.droplet_data.items() if k >= 0}
        for i, d in enumerate(manual_list):
            self.droplet_data[-(i+1000)] = float(d)

system = DropletSystem()

@app.post("/api/save-project")
async def save_project(req: SaveProjectRequest):
    project_base = os.path.join(req.save_directory, req.project_name)
    excel_path = f"{project_base}_Report.xlsx"
    drop_path = f"{project_base}.drop"
    all_droplets = []
    summary_data = []
    for slide in req.slides:
        if slide.droplets:
            diams = sorted(slide.droplets)
            vols = [(np.pi/6)*(d**3) for d in diams]
            total_vol = sum(vols)
            cum_vol = np.cumsum(vols)/total_vol
            dv10 = diams[np.searchsorted(cum_vol, 0.1)]
            dv50 = diams[np.searchsorted(cum_vol, 0.5)]
            dv90 = diams[np.searchsorted(cum_vol, 0.9)]
            span = (dv90-dv10)/dv50 if dv50 > 0 else 0
            summary_data.append({"Slide Name": slide.name, "VMD (µm)": round(dv50, 2), "SPAN": round(span, 2), "Droplets": len(diams)})
            for d in diams:
                all_droplets.append({"Slide": slide.name, "Size (µm)": d})

    os.makedirs(req.save_directory, exist_ok=True)
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        pd.DataFrame(summary_data).to_excel(writer, sheet_name="Summary", index=False)
        pd.DataFrame(all_droplets).to_excel(writer, sheet_name="Raw Data", index=False)
    with zipfile.ZipFile(drop_path, 'w') as zipf:
        zipf.writestr("project.json", req.model_dump_json(indent=4))
        zipf.write(excel_path, arcname=os.path.basename(excel_path))
    return {"status": "success", "excel_file": excel_path, "drop_file": drop_path}

@app.get("/api/load-project")
async def load_project(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with zipfile.ZipFile(path, 'r') as zipf:
            with zipf.open("project.json") as f:
                return json.loads(f.read().decode('utf-8'))
    except Exception as e:
        logger.error("Failed to load project %s: %s", path, e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/session-data")
async def get_session_data():
    # Convert numpy types to native python floats for JSON serialization
    return {"data": [float(v) for v in system.droplet_data.values()]}

@app.post("/api/update-manual-data")
async def update_manual_data(req: ManualDataRequest):
    system.update_manual_data(req.data)
    return {"status": "success", "count": len(req.data)}

@app.post("/api/reset-stats")
async def reset_stats():
    system.reset_stats()
    return {"status": "success"}

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Announce hardware info immediately on connect
    ram_gb = psutil.virtual_memory().total / (1024 ** 3)
    cpu_cores = psutil.cpu_count(logical=False) or 1
    await websocket.send_json({
        "type": "hardware_info",
        "profile": system.profile,
        "ram_gb": round(ram_gb, 1),
        "cpu_cores": int(cpu_cores),
        "inference_skip": system.inference_skip
    })

    camera_idx = 0
    cap = open_camera(camera_idx)
    box_annotator = sv.BoxAnnotator(color=sv.ColorPalette.from_hex(["#0a84ff", "#ff3b30"]), thickness=2)
    label_annotator = sv.LabelAnnotator(color=sv.ColorPalette.from_hex(["#0a84ff", "#ff3b30"]), text_padding=4, text_scale=0.5)
    loop = asyncio.get_running_loop()

    async def handle_commands():
        nonlocal camera_idx, cap
        try:
            while True:
                msg = await websocket.receive_json()
                action = msg.get("action")
                if action == "set_camera":
                    idx = int(msg.get("index", 0))
                    if idx != camera_idx:
                        camera_idx = idx
                        cap.release()
                        cap = open_camera(camera_idx)
                elif action == "set_lens":
                    system.load_resources(msg.get("lens"))
                elif action == "update_settings":
                    system.conf_threshold = float(msg.get("conf", 0.25))
                elif action == "reset_stats":
                    system.reset_stats()
                elif action == "take_snapshot":
                    system.pending_snapshot = True
                elif action == "set_ai_active":
                    system.is_ai_active = bool(msg.get("active", False))
                elif action == "set_profile":
                    profile = msg.get("profile", "auto")
                    if profile == "auto":
                        profile = detect_profile()
                    system.set_profile(profile)
                    # Notify frontend of the new active profile
                    await websocket.send_json({
                        "type": "hardware_info",
                        "profile": system.profile,
                        "ram_gb": round(ram_gb, 1),
                        "cpu_cores": int(cpu_cores),
                        "inference_skip": system.inference_skip
                    })
                elif action == "remove_droplet":
                    droplet_id = int(msg.get("id", 0))
                    system.droplet_data.pop(droplet_id, None)
                    system.counted_ids.discard(droplet_id)
        except WebSocketDisconnect:
            pass  # Client disconnected cleanly from command handler
        except Exception as e:
            logger.error("WebSocket command handler error: %s", e)

    asyncio.create_task(handle_commands())

    try:
        while True:
            success, frame = cap.read()
            if success:
                system.frame_counter += 1
                should_infer = (system.frame_counter % system.inference_skip == 0)

                # Run AI inference — only on selected frames, always off the event loop
                if (system.is_ai_active or system.pending_snapshot) and system.session and should_infer:
                    # Letterbox: pad 640×480 → 640×640 (80px top+bottom, no horizontal pad)
                    pad = np.zeros((640, 640, 3), dtype=np.uint8)
                    pad[PAD_TOP:PAD_TOP + 480, :] = frame
                    img = pad.astype(np.float32) / 255.0
                    img = np.expand_dims(np.transpose(img, (2, 0, 1)), axis=0)

                    # run_in_executor keeps the event loop unblocked during 20–80ms inference
                    _img = img  # explicit capture for lambda closure
                    outputs = await loop.run_in_executor(
                        _inference_executor,
                        lambda: system.session.run(None, {system.input_name: _img})
                    )

                    preds = np.squeeze(outputs[0]).T
                    conf_mask = preds[:, 4] > system.conf_threshold
                    valid = preds[conf_mask]
                    if len(valid) > 0:
                        # scale=1.0 (no resize), undo only PAD_TOP offset
                        xyxy = np.zeros((len(valid), 4), dtype=np.float32)
                        xyxy[:, 0] = valid[:, 0] - valid[:, 2] / 2
                        xyxy[:, 1] = valid[:, 1] - valid[:, 3] / 2 - PAD_TOP
                        xyxy[:, 2] = valid[:, 0] + valid[:, 2] / 2
                        xyxy[:, 3] = valid[:, 1] + valid[:, 3] / 2 - PAD_TOP
                        detections = sv.Detections(xyxy=xyxy, confidence=valid[:, 4], class_id=np.zeros(len(valid), dtype=int))
                        detections = detections.with_nms(threshold=0.5)
                        detections = system.tracker.update_with_detections(detections)
                        if detections.tracker_id is not None:
                            labels = []
                            class_ids = []
                            for i, tid in enumerate(detections.tracker_id):
                                box = detections.xyxy[i]
                                px_avg = ((box[2]-box[0]) + (box[3]-box[1])) / 2
                                crater_um = px_avg * system.calibration_value * 1e6
                                sf = 0.86 if crater_um > 20 else 0.80 if crater_um >= 15 else 0.75 if crater_um >= 10 else 0.70
                                true_diam = crater_um * sf
                                is_standard = 10.0 <= true_diam <= 30.0
                                cid = 0 if is_standard else 1
                                class_ids.append(cid)
                                if tid not in system.counted_ids:
                                    system.droplet_data[tid] = true_diam
                                    system.counted_ids.add(tid)
                                labels.append(f"#{tid} {true_diam:.1f}um")
                            detections.class_id = np.array(class_ids)
                            frame = box_annotator.annotate(scene=frame, detections=detections)
                            frame = label_annotator.annotate(scene=frame, detections=detections, labels=labels)

                # Prepare unified droplet list for the frontend table
                unified_list = []
                for tid, diam in system.droplet_data.items():
                    unified_list.append({
                        "id": int(tid),
                        "diameter": float(diam),
                        "source": "Manual" if tid < 0 else "AI"
                    })
                # Sort by absolute ID to maintain a consistent order (Manual IDs are negative)
                unified_list.sort(key=lambda x: abs(x["id"]))

                vmd, span, count, _, out_pct = system.calculate_stats()
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                payload = {
                    "image": base64.b64encode(buffer).decode('utf-8'),
                    "vmd": float(vmd), "span": float(span), "count": int(count),
                    "out_of_bounds": float(out_pct), "ram": str(psutil.virtual_memory().percent) + "%",
                    "current_idx": int(camera_idx),
                    "session_droplets": unified_list
                }
                if system.pending_snapshot:
                    payload["is_snapshot"] = True
                    system.pending_snapshot = False
                await websocket.send_json(payload)
            await asyncio.sleep(0.01)
    except WebSocketDisconnect:
        cap.release()
    finally:
        cap.release()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
