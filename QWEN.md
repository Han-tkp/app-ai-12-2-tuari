# QWEN.md - Project Context Guide

## Project Overview

**DropDetect AI** is a professional desktop application for real-time chemical spray droplet analysis following WHO standards. It uses a hybrid architecture:

- **Frontend**: React 19 + TypeScript + Vite, wrapped in Tauri v2 (Rust) for desktop capabilities
- **Backend**: Python/FastAPI server handling AI inference via ONNX runtime
- **Communication**: WebSocket for real-time frame streaming, REST for project operations

The application captures microscope camera feeds, detects droplets using YOLOv8 ONNX models, tracks them with ByteTrack, and generates statistical reports (Dv10, Dv50/VMD, Dv90, SPAN) compliant with WHO chemical spray testing standards.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri v2 (Rust) |
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 (CSS variables) |
| State Management | Zustand |
| Canvas Rendering | React-Konva + Konva |
| Icons | Lucide React |
| Backend Framework | FastAPI (Python) |
| AI Runtime | ONNX Runtime |
| Object Tracking | supervision (ByteTrack) |
| Image Processing | OpenCV |
| Report Generation | openpyxl (Excel) |

---

## Project Structure

```
webappsdesktop/
├── src/                          # React frontend source
│   ├── components/
│   │   ├── dashboard/            # TopDashboard.tsx (metrics strip)
│   │   ├── sidebar/              # Sidebar.tsx (controls, Analyze/Report tabs)
│   │   ├── workspace/            # Workspace.tsx, AnnotationLayer.tsx, ManualEditTable.tsx
│   │   └── SettingsWindow.tsx
│   ├── layouts/
│   │   └── AppLayout.tsx         # Root shell, titlebar, hotkeys, file menu
│   ├── store/
│   │   └── useAppStore.ts        # Single source of truth (Zustand)
│   ├── hooks/
│   │   └── useDraggable.ts       # Shared draggable panel hook
│   ├── utils/
│   │   └── fsUtils.ts            # Tauri FS helpers (safe workspace dir)
│   ├── assets/
│   ├── config.ts                 # Backend URLs (API_BASE, WS_STREAM)
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   └── main.py                   # FastAPI server, AI inference, Excel export
├── src-tauri/
│   ├── src/                      # Rust source (minimal window management)
│   ├── capabilities/
│   │   └── default.json          # Tauri plugin permissions
│   ├── icons/
│   ├── tauri.conf.json           # Tauri configuration
│   ├── Cargo.toml
│   └── build.rs
├── fileonnx/                     # ONNX models (yolov8n_4x.onnx, yolov8n_10x.onnx)
├── resources/                    # Calibration JSON files (4x.json, 10x.json)
├── datafordevapp/                # Development data
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── postcss.config.js
```

---

## Building and Running

### Prerequisites

- Node.js 18+ and npm
- Rust toolchain (for Tauri)
- Python 3.9+ with virtualenv
- ONNX models in `fileonnx/` directory

### Frontend / Tauri Desktop App

```powershell
# Install dependencies
npm install

# Run in Tauri dev mode (starts Vite + Rust together)
npm run tauri dev

# Build for production
npm run tauri build

# Run Vite-only dev server (no Tauri wrapper)
npm run dev

# Preview production build
npm run preview
```

### Backend (Python AI Engine)

```powershell
cd backend
.\venv\Scripts\activate
python main.py
```

**Note**: The backend must be started separately before using AI features. The frontend connects to `ws://localhost:8000/ws/stream`.

---

## Architecture & Communication

### Data Flow

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   React UI      │ ◄────────────────► │  Python/FastAPI │
│   (Port 1420)   │   JSON Commands    │  (Port 8000)    │
│                 │   Base64 Frames    │                 │
└─────────────────┘                    └─────────────────┘
        ▲                                      │
        │                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│  Tauri (Rust)   │                    │  ONNX Runtime   │
│  Window Mgmt    │                    │  OpenCV         │
└─────────────────┘                    └─────────────────┘
```

### WebSocket Protocol

**Frontend → Backend Commands** (JSON over WebSocket):
```json
{ "action": "set_camera", "index": 0 }
{ "action": "set_lens", "lens": "10x" }
{ "action": "update_settings", "conf": 0.25 }
{ "action": "reset_stats" }
{ "action": "take_snapshot" }
{ "action": "set_ai_active", "active": true }
{ "action": "set_profile", "profile": "high" }
{ "action": "remove_droplet", "id": 123 }
```

**Backend → Frontend Messages**:
```json
{
  "type": "hardware_info",
  "profile": "high",
  "ram_gb": 16.0,
  "cpu_cores": 8,
  "inference_skip": 1
}
// Frame updates (base64 JPEG + stats)
{
  "image": "base64...",
  "vmd": 22.5,
  "span": 1.2,
  "count": 150,
  "out_of_bounds": 5.3,
  "droplets": [{ "id": 1, "diameter": 22.5, "source": "AI" }]
}
```

### REST Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/session-data` | Get current session droplet data |
| POST | `/api/update-manual-data` | Sync manual annotations |
| POST | `/api/reset-stats` | Clear session statistics |
| POST | `/api/save-project` | Save project (.drop + Excel) |
| GET | `/api/load-project` | Load project from .drop file |

---

## Key Configuration Files

### `src/config.ts`
Single source for backend URLs. Modify here to change backend endpoint:
```typescript
export const API_BASE = 'http://localhost:8000';
export const WS_STREAM = 'ws://localhost:8000/ws/stream';
```

### `src/store/useAppStore.ts`
Single source of truth. All app state lives here:
- Camera/AI state (isCameraRunning, isAIRunning, objectiveLens)
- Hardware profile (low/mid/high, RAM, CPU cores)
- Real-time stats (vmd, span, accumulated, outOfBounds)
- Manual annotations (circle, rect, line tools)
- Slides and project data
- Settings (hotkeys, confidence threshold, appearance)

### `src-tauri/tauri.conf.json`
Tauri window configuration:
- Frameless, transparent, maximized window
- Custom titlebar with macOS/Windows chrome styles
- Port 1420 for Vite dev server

### `backend/main.py`
Core AI logic:
- `DropletSystem` class: ONNX session, ByteTrack tracker, calibration
- `calculate_stats()`: WHO volume-weighted statistics (Dv10, Dv50, Dv90, SPAN)
- `_build_excel()`: Styled Excel report generation
- WebSocket frame streaming at ~30 FPS

---

## Domain Knowledge: WHO Droplet Analysis Standards

### Spread Factor Calculation
Droplets flatten on MgO slides; true diameter requires correction:
```
True Diameter = Crater Diameter × Spread Factor
```

| Diameter Range | Spread Factor |
|----------------|---------------|
| > 20 µm | 0.86 |
| 15–20 µm | 0.80 |
| 10–15 µm | 0.75 |
| < 10 µm | 0.70 |

### Volume Calculation
```
Volume = (π / 6) × TrueDiameter³
```

### WHO Compliance Criteria
- **VMD Target**: 10.0–30.0 µm
- **SPAN Target**: ≤ 2.0
- **Minimum Count**: ≥ 200 droplets for statistical validity

### Statistical Metrics
- **Dv10**: Diameter below which 10% of total volume lies
- **Dv50 (VMD)**: Volume Median Diameter — 50% of volume
- **Dv90**: Diameter below which 90% of total volume lies
- **SPAN**: (Dv90 - Dv10) / Dv50 — measures distribution width

---

## Development Conventions

### Coding Style
- **TypeScript**: Strict mode, no unused locals/parameters
- **React**: Functional components with hooks, TypeScript interfaces for props
- **State**: All global state in Zustand store; avoid local state for shared data
- **Naming**: camelCase for variables/functions, PascalCase for components/types

### Key Technical Conventions
- **Manual annotation IDs**: Negative integers (starting at -1000) to avoid collision with ByteTrack's positive tracker IDs
- **NumPy types**: Must cast to Python native types (`float()`, `int()`) before JSON serialization
- **Project files**: `.drop` extension (ZIP containing `project.json` + Excel report)
- **CSS**: Use CSS variables (`var(--bg-window)`, `var(--accent)`) — not hardcoded Tailwind colors
- **Theme**: Dark mode via `.dark` class on root element

### Testing Practices
- Manual testing via UI (no automated test suite configured)
- Backend logging via `logger.info()` for debugging inference pipeline

---

## Common Tasks

### Adding a New Feature
1. Add state to `useAppStore.ts` if global, or local state in component
2. Create component in `src/components/` with clear single responsibility
3. If backend communication needed:
   - Add WebSocket command handler in `backend/main.py` `handle_commands()`
   - Dispatch from frontend via `window.dispatchEvent(new CustomEvent('send-backend-command', {...}))`
4. For new REST endpoint: add FastAPI route in `backend/main.py`

### Changing Backend URL
Edit `src/config.ts`:
```typescript
export const API_BASE = 'http://new-host:8000';
export const WS_STREAM = 'ws://new-host:8000/ws/stream';
```

### Adding a New ONNX Model
1. Place model in `fileonnx/` (e.g., `yolov8n_20x.onnx`)
2. Add calibration JSON in `resources/20x.json`
3. Update `backend/main.py` `load_resources()` to recognize new lens
4. Add lens option to frontend store (`objectiveLens` type)

### Modifying Excel Report
Edit `_build_excel()` in `backend/main.py`. The function creates:
- Summary sheet with per-slide metrics
- Per-slide raw data sheets
- "All Raw Data" consolidated sheet

---

## Troubleshooting

### Backend Connection Issues
- Ensure `python main.py` is running in `backend/` directory
- Check port 8000 is not blocked by firewall
- Verify WebSocket URL in `src/config.ts`

### ONNX Model Not Found
- Models must be in `fileonnx/` directory at project root
- Backend uses `BASE_DIR` (project root) to resolve paths
- Check `backend/main.py` logs for path resolution errors

### Tauri Build Fails
- Ensure Rust toolchain is installed: `rustup install stable`
- Run `npm run tauri build` from project root
- Check `src-tauri/Cargo.toml` for dependency issues

### Camera Not Detected
- Backend uses `cv2.CAP_DSHOW` (DirectShow) on Windows
- Try different camera indices (0, 1, 2...) via Settings → Hardware & Camera
- Verify camera is not in use by another application

---

## File Format Specifications

### `.drop` Project File
ZIP archive containing:
- `project.json`: Project metadata, slides, droplet data
- `<project_name>_Report.xlsx`: Excel report

### `project.json` Schema
```json
{
  "project_name": "string",
  "target_size": 224,
  "slides": [
    {
      "id": "uuid",
      "name": "Slide 1",
      "droplets": [22.5, 18.3, 25.1],
      "status": "Completed",
      "timestamp": "2025-03-14 10:30:00"
    }
  ]
}
```

### Calibration JSON (`resources/{lens}.json`)
```json
{
  "calibrations": [
    {
      "name": "10x",
      "value": 2.7926330340561596e-07
    }
  ]
}
```

---

## Hardware Profiles

The app auto-detects system capabilities and adjusts inference frequency:

| Profile | RAM | Inference Skip | Track Buffer | Queue Size |
|---------|-----|----------------|--------------|------------|
| Low | < 6 GB | 1/3 frames | 90 frames | 2 |
| Mid | 6–12 GB | 1/2 frames | 60 frames | 4 |
| High | ≥ 12 GB | Every frame | 30 frames | 8 |

Override via Settings → Hardware & Camera → Performance Profile.
