# QWEN.md - DropDetect AI Project Context

## Project Overview

**DropDetect AI** is a professional desktop application for real-time chemical spray droplet analysis following WHO (World Health Organization) standards. The application captures microscope camera feeds, detects droplets using YOLOv8 ONNX models, tracks them with ByteTrack, and generates statistical reports (Dv10, Dv50/VMD, Dv90, SPAN) compliant with WHO chemical spray testing standards.

### Architecture

Hybrid desktop application with three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    DropDetect AI Desktop                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         WebSocket         ┌──────────┐ │
│  │   Tauri Shell   │  http://localhost:1420    │  Python  │ │
│  │   (Rust)        │ ◄──────────────────────►  │ FastAPI  │ │
│  │                 │   ws://localhost:8000     │ Backend  │ │
│  │  ┌───────────┐  │                           │          │ │
│  │  │  React    │  │                           │ - Camera │ │
│  │  │  + TS     │  │                           │ - AI/ONNX│ │
│  │  │  Frontend │  │                           │ - Tracking│ │
│  │  └───────────┘  │                           │ - Excel  │ │
│  └─────────────────┘                           └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Desktop Shell** | Tauri v2 (Rust) | Native window management, file system access |
| **Frontend Framework** | React 19 + TypeScript | UI components, state management |
| **Build Tool** | Vite 7 | Fast development server and bundling |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with CSS variables |
| **State Management** | Zustand | Single source of truth for app state |
| **Canvas Rendering** | React-Konva + Konva | Manual annotation tools |
| **Icons** | Lucide React | Icon library |
| **Backend Framework** | FastAPI (Python) | REST API + WebSocket server |
| **AI Runtime** | ONNX Runtime | YOLOv8 model inference |
| **Object Tracking** | supervision (ByteTrack) | Multi-object tracking |
| **Image Processing** | OpenCV | Camera capture, image processing |
| **Report Generation** | openpyxl | Styled Excel reports with charts |

---

## Project Structure

```
webappsdesktop/
├── src/                          # React frontend source
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── TopDashboard.tsx         # Real-time metrics strip
│   │   ├── sidebar/
│   │   │   └── Sidebar.tsx              # Controls, Analyze/Report tabs
│   │   ├── workspace/
│   │   │   ├── Workspace.tsx            # Camera viewport, WebSocket manager
│   │   │   ├── AnnotationLayer.tsx      # React-Konva manual annotations
│   │   │   ├── ManualEditTable.tsx      # Manual measurements table
│   │   │   └── SessionDropletTable.tsx  # Session data with WHO compliance
│   │   ├── SettingsWindow.tsx           # Draggable settings panel
│   │   └── SystemStatusBar.tsx          # Auto-save status bar
│   ├── layouts/
│   │   └── AppLayout.tsx                # Root shell, titlebar, hotkeys
│   ├── store/
│   │   └── useAppStore.ts               # Single source of truth (Zustand)
│   ├── hooks/
│   │   └── useDraggable.ts              # Draggable panel hook
│   ├── utils/
│   │   └── fsUtils.ts                   # Tauri FS helpers
│   ├── assets/
│   ├── config.ts                        # Backend URLs (API_BASE, WS_STREAM)
│   ├── index.css                        # Theme CSS variables
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   └── main.py                          # FastAPI server, AI inference
├── src-tauri/
│   ├── src/                             # Rust source (minimal)
│   ├── capabilities/
│   │   └── default.json                 # Tauri plugin permissions
│   ├── icons/
│   ├── tauri.conf.json                  # Tauri configuration
│   ├── Cargo.toml
│   └── build.rs
├── fileonnx/                            # ONNX models
│   ├── yolov8n_4x.onnx
│   └── yolov8n_10x.onnx
├── resources/                           # Calibration JSON files
│   ├── 4x.json
│   └── 10x.json
├── datafordevapp/                       # Development data
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

**Important**: The backend must be started separately before using AI features. The frontend connects to `ws://localhost:8000/ws/stream`.

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
| POST | `/api/cleanup-autosave` | Clean up old auto-save files |

---

## Key Configuration Files

### `src/config.ts`
Single source for backend URLs:
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
- Auto-save state (isDirty, lastAutoSave, autoSaveEnabled)
- Excel language preference (th/en)

### `src-tauri/tauri.conf.json`
Tauri window configuration:
- Frameless, transparent, maximized window
- Custom titlebar with macOS/Windows chrome styles
- Port 1420 for Vite dev server

### `backend/main.py`
Core AI logic:
- `DropletSystem` class: ONNX session, ByteTrack tracker, calibration
- `calculate_stats()`: WHO volume-weighted statistics
- `_build_excel()`: Styled Excel report generation (Thai/English)
- WebSocket frame streaming at ~30 FPS
- LanguageConfig: Thai/English label support

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
- **VMD Target**: 10.0–30.0 µm (flexible up to 30.06)
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
- **WHO Range**: 10.00-30.00 µm (flexible up to 30.06)

### Testing Practices
- Manual testing via UI (no automated test suite configured)
- Backend logging via `logger.info()` for debugging inference pipeline
- Integration tests available in `test_integration.py`

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
- Summary sheet with per-slide metrics (Thai/English)
- Per-slide raw data sheets
- Distribution charts

### Adding New Language
1. Add labels to `LanguageConfig` class in `backend/main.py`
2. Add language option to frontend Settings
3. Pass `language` parameter in save-project request

---

## Troubleshooting

### Backend Connection Issues
- Ensure `python main.py` is running in `backend/` directory
- Check port 8000 is not blocked by firewall
- Verify WebSocket URL in `src/config.ts`
- Kill old Python processes: `taskkill /F /IM python.exe`

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

### Excel Export Errors
- Check `BarChart` and `Reference` are imported from `openpyxl.chart`
- Clear Python cache: `del /q /s backend\__pycache__`
- Restart backend after code changes

### Auto-Save Issues
- Check localStorage quota exceeded errors
- Verify `Documents/DropDetect_Projects/` folder exists
- Check disk space for auto-save files

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
  "language": "th",
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

---

## Auto-Save & Persistence

### Features
- **Auto-Save Interval**: 30 seconds (configurable)
- **Dirty Flag**: Tracks unsaved changes
- **Recovery Dialog**: Prompts to recover unsaved work on app restart
- **Cleanup**: Auto-deletes auto-save files older than 7 days
- **Dual Storage**: localStorage (for crash recovery) + disk (for backup)

### State Persistence
- Theme preference (dark/light/warm) → localStorage
- Shell preference (macos/windows) → localStorage
- Excel language (th/en) → Zustand store
- Auto-save data → localStorage + disk

---

## Excel Export Features

### Languages Supported
- **Thai (default)**: Full Thai labels for all UI elements
- **English**: Standard English labels

### Sheet Structure
1. **Summary**: Dashboard with stats table + VMD comparison chart
2. **Slide 1, Slide 2, ...**: Individual droplet data + distribution chart

### Column Headers (Thai)
- ละอองที่ (No.)
- ขนาด (µm) (Diameter)
- ช่วง WHO (WHO Range)
- ปริมาตร (µm³) (Volume)
- Spread Factor
- สะสม (%) (Cumulative %)

### Styling
- Default Excel style (no custom colors)
- Thin borders on all cells
- Green/Red font for Pass/Fail
- Number formats: 0.000, 0.0%, 0.00

---

## Recent Updates (March 2025)

### Phase 5: Professional Dark Theme
- Replaced space/sci-fi theme with professional neutral dark
- Blue accent (#3b82f6) instead of cyan-teal
- Section-based sidebar layout
- Removed glow/frosted glass effects

### Excel Export Overhaul
- Thai language support with LanguageConfig class
- Side-by-side layout (dashboard left, tables right)
- Distribution charts (BarChart)
- WHO compliance: 10.00-30.00 µm (flexible up to 30.06)

### Auto-Save System
- 30-second interval auto-save
- Recovery dialog on app restart
- Dirty flag tracking
- Cleanup mechanism for old files
- Status bar indicator

### SessionDropletTable Updates
- Shows all droplets from selected slide
- Columns: ID | Size | WHO | Source
- Source icons: AI 🧠 / Manual ✏️ / Slide 📊
- WHO compliance badge with flexible range

---

## Integration Test

Run integration tests to verify frontend-backend connection:

```powershell
cd C:\Users\h4n\Desktop\webappsdesktop
C:\Users\h4n\Desktop\webappsdesktop\backend\venv\Scripts\python test_integration.py
```

Expected output:
```
✓ PASS: Backend Connection
✓ PASS: Save Project (Thai)
✓ PASS: Save Project (English)
✓ PASS: Language Config

Total: 4/4 tests passed
🎉 All integration tests passed!
```

---

## Quick Start Checklist

1. ✅ Install Node.js, Rust, Python 3.9+
2. ✅ Run `npm install` in project root
3. ✅ Start backend: `cd backend && .\venv\Scripts\activate && python main.py`
4. ✅ Start frontend: `npm run tauri dev`
5. ✅ Configure camera in Settings → Hardware & Camera
6. ✅ Select language in Report mode → Excel Language dropdown
7. ✅ Export Excel report with Thai/English labels

---

## Contact & Support

For issues or questions, refer to:
- `CLAUDE.md` - Development guidelines
- `project_logic_summary.md` - System workflow documentation
- `test_integration.py` - Integration test script
- Backend logs for AI inference debugging
