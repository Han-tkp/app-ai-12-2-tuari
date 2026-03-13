# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: DropDetect AI

A professional desktop application for real-time chemical spray droplet analysis per WHO standards. It is a hybrid app: a Tauri v2 (Rust) shell wrapping a React/TypeScript frontend, with a separate Python/FastAPI AI backend communicating via WebSocket.

---

## Commands

### Frontend / Tauri Desktop App

```powershell
# Run in Tauri dev mode (starts Vite + Rust/Tauri together)
npm run tauri dev

# Build for production
npm run tauri build

# Run Vite-only (no Tauri wrapper)
npm run dev
```

### Backend (Python AI Engine)

```powershell
cd backend
.\venv\Scripts\activate
python main.py
```

The backend must be started separately before using the AI features in the app.

---

## Architecture

### Communication Flow

The frontend and backend communicate exclusively via **WebSocket at `ws://localhost:8000/ws/stream`**.

- **Python → React:** Camera frames captured at ~30 FPS → AI inference → supervision annotation → Base64-encoded JPEG frame → sent to frontend → rendered on canvas.
- **React → Python:** Commands sent as JSON messages over the same WebSocket (e.g., `switch_camera`, `set_lens`, `take_snapshot`, `export_excel`, `update_manual_data`).

There is no REST API for real-time operations; only `/api/save-project` is a REST endpoint.

### Frontend Structure

- `src/config.ts` — **Single source for backend URLs**: `API_BASE` and `WS_STREAM`. Change here to point to a different backend.
- `src/store/useAppStore.ts` — **Single source of truth** (Zustand). All app state lives here: camera state, AI stats, annotations, slides, settings, hotkeys.
- `src/hooks/useDraggable.ts` — Shared draggable-panel hook used by `ManualEditTable` and `SessionDropletTable`.
- `src/layouts/AppLayout.tsx` — Root shell. Handles titlebar (custom frameless window), hotkeys, file menu (New/Open/Save project as `.drop` zip files).
- `src/components/sidebar/Sidebar.tsx` — Left panel with Analyze/Report tabs and all controls.
- `src/components/dashboard/TopDashboard.tsx` — Real-time metrics strip (VMD, Span, count, etc.).
- `src/components/workspace/Workspace.tsx` — Camera viewport, zoom/pan, WebSocket connection manager.
- `src/components/workspace/AnnotationLayer.tsx` — React-Konva canvas overlay for manual annotations (circle, rect, line tools).
- `src/components/workspace/ManualEditTable.tsx` — Draggable/pop-out table for manual droplet annotations.
- `src/components/workspace/SessionDropletTable.tsx` — Unified AI + manual droplet session table.
- `src/components/SettingsWindow.tsx` — Draggable settings panel.
- `src/utils/fsUtils.ts` — Tauri FS helper: resolves `Documents/DropDetect_Projects/` as the safe workspace directory. Used as the fallback save path when `exportPath` is empty.

### Backend (`backend/main.py`)

Single-file Python server. Key classes and endpoints:
- `DropletSystem` — Manages ONNX model session, ByteTrack tracker, calibration values, and per-frame stats calculation.
- `calculate_stats()` — Implements WHO volume-weighted statistics: Dv0.1, Dv0.5 (VMD), Dv0.9, SPAN.
- `GET /ws/stream` — Main WebSocket. Handles all real-time frame streaming and command processing.
- `POST /api/save-project` — Generates `.drop` (zip) project file and Excel report.

### AI Models

ONNX models are stored in `fileonnx/`:
- `yolov8n_4x.onnx` — 4x objective lens model
- `yolov8n_10x.onnx` — 10x objective lens model

Calibration JSON files are in `resources/` (`4x.json`, `10x.json`). The backend uses `BASE_DIR` (project root) to resolve these paths absolutely.

### Tauri / Rust (`src-tauri/`)

Minimal Rust layer. The main role is window management (frameless, transparent, maximized) and exposing plugins. Permissions are defined in `src-tauri/capabilities/default.json`. The window is configured as decorations-less and transparent in `tauri.conf.json`.

### Styling

- **Tailwind CSS v4** with no `tailwind.config.js`. All theme tokens are CSS variables defined in `src/index.css` under `@theme` and `@layer base`.
- Use `var(--bg-window)`, `var(--accent)`, `var(--text1)`, etc. for all colors — not hardcoded Tailwind color classes.
- Dark mode is toggled by adding the `.dark` class to the root element.

---

## Key Technical Conventions

- **Manual annotation IDs** use negative integers (starting at -1000) to avoid collision with ByteTrack's positive tracker IDs.
- **Spread Factor** must be applied before any volume calculation: >20µm → 0.86, 15–20µm → 0.80, 10–15µm → 0.75, <10µm → 0.70.
- **Project files** use the `.drop` extension (a ZIP containing JSON + Excel).
- **NumPy types** must be cast to Python native types (`float()`, `int()`) before serializing to JSON in the backend.
- The Zustand store's `triggerSave` action fires a save event that `AppLayout` listens to for file system operations via Tauri FS plugin.
