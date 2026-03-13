# DropDetect AI - Developer Context

This document serves as the foundational instructional context for Gemini CLI when working on the **DropDetect AI** project.

## 🚀 Project Overview
**DropDetect AI** is a professional desktop application designed for real-time analysis of chemical spray droplets, adhering to **WHO standards**. It is a hybrid application combining a modern web-based UI with a high-performance AI inference engine.

### Core Technologies
- **Frontend:** React (TypeScript), Vite, Tailwind CSS v4 (Custom macOS Redesign theme).
- **Desktop Wrapper:** Tauri v2 (Rust backend for window management and system integration).
- **Backend (AI Engine):** Python 3.11+, FastAPI, Uvicorn (WebSocket streaming).
- **AI/ML:** ONNX Runtime (CPU/GPU inference), Supervision (tracking & annotation), YOLOv8 models.
- **State Management:** Zustand (React).
- **Graphics/Manual Edit:** React-Konva.

---

## 🏗️ Architecture & Logic

### 1. Hybrid Communication
- The **Frontend** communicates with the **Python Backend** via **WebSockets** (`ws://localhost:8000/ws/stream`).
- **Real-time Stream:** Python captures frames -> AI detects droplets -> Supervision annotates -> Encoded as Base64 -> Sent to React -> Rendered on Canvas.
- **Command Loop:** React sends actions (switch_camera, set_lens, export_excel) to Python via the same WebSocket.

### 2. WHO Standards (Mathematical Core)
- **VMD (Volume Median Diameter / Dv0.5):** Calculated based on the cumulative volume of droplets.
- **SPAN:** Calculation formula: `(Dv0.9 - Dv0.1) / Dv0.5`. Target must be `< 2.0`.
- **Spread Factor (MgO Slides):**
  - `> 20 µm`: 0.86
  - `15–20 µm`: 0.80
  - `10–14.9 µm`: 0.75
  - `< 10 µm`: 0.70
- **Sampling:** Target Size (default 224) is achieved via **Uniform Sampling** from the filtered and sorted droplet list.

---

## 🛠️ Building and Running

### Prerequisites
- Node.js & npm
- Python 3.11+ (with `venv` in `/backend`)
- Rust (for Tauri)

### Execution Commands
- **Frontend (Tauri Dev Mode):**
  ```powershell
  npm run tauri dev
  ```
- **Backend (AI Server):**
  ```powershell
  cd backend
  .\venv\Scripts\activate
  python main.py
  ```

---

## 🎨 Development Conventions

### Styling (Tailwind v4)
- **No `tailwind.config.js`:** All styling is managed via `@theme` variables in `src/index.css`.
- **macOS Native Look:** Follow the "macOS Redesign" theme variables (`--bg-window`, `--accent`, etc.).
- **Transitions:** Use smooth transitions for theme switching (Dark/Light).

### Components Structure
- `src/layouts/`: Main shell, title bars, and grid containers.
- `src/components/sidebar/`: Control panels (Analyze/Report tabs).
- `src/components/dashboard/`: Top metrics strip.
- `src/components/workspace/`: Camera viewport, Annotation layer, and Manual Edit table.
- `src/store/`: Zustand stores (`useAppStore.ts` is the source of truth).

### Backend Standards
- **Native Types:** Always convert NumPy types (`float32`, `int64`) to Python native types before sending JSON.
- **Absolute Paths:** Use `BASE_DIR` for loading ONNX models and JSON calibration files.
- **Tracking:** Use `sv.ByteTrack` for consistent droplet IDs.

---

## 📂 Key File Locations
- `src-tauri/tauri.conf.json`: Window configurations (Maximized, Decorations disabled).
- `src-tauri/capabilities/default.json`: Tauri API permissions.
- `backend/main.py`: AI inference and WebSocket server.
- `fileonnx/`: Storage for YOLOv8 `.onnx` models (4x and 10x).
- `resources/`: Storage for calibration `.json` files.
