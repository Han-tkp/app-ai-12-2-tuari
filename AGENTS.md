# AGENTS.md — DropDetect AI

## ⚠️ CLAUDE.md is outdated (describes old Tauri v2 shell)

The repo migrated from Tauri to **Electron**. The file `CLAUDE.md` and `QWEN.md` both reference `npm run tauri dev`, `src-tauri/`, port 1420, etc. — all wrong. Both files are gitignored (leftover artifacts). **Ignore them.**

## Current architecture

- **Desktop shell**: Electron v34 (electron-vite v5). Main process at `electron/main.ts` spawns Python as a sidecar.
- **Frontend**: React 19 + TypeScript + Zustand + Tailwind CSS v4 + react-konva. Entry: `src/main.tsx`. Renderer alias: `@renderer/*` → `src/*`.
- **Backend**: Single-file Python/FastAPI at `backend/main.py` (1457 lines). Communicates exclusively via **WebSocket** `ws://127.0.0.1:8000/ws/stream`. REST only for `/api/save-project` and `/api/load-project`.
- **Website** (separate app): `website/` — Vite + React + TypeScript + Tailwind CSS. Deployed to Cloudflare Pages via wrangler.
- **`src-tauri/`** is legacy (gitignored). Do not touch.

## Commands

### Main desktop app (root)
```powershell
npm run dev       # electron-vite dev (starts Vite + Electron + auto-spawns Python)
npm run build     # electron-vite build + electron-builder --win (NSIS installer)
# No equivalent to tauri build; no lint/typecheck scripts exist
```

### Backend (standalone, for debugging)
```powershell
cd backend
.\venv\Scripts\activate
python main.py
```
In dev mode, Electron auto-spawns `backend/venv/Scripts/python.exe backend/main.py`.
In production, runs `backend/dist/dropdetect-backend.exe` (PyInstaller-bundled).

### Website
```powershell
cd website
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (prebuild copies assets)
npm test          # node verify-website.js (23 assertion E2E suite)
```

## High-signal conventions

- **Manual annotation IDs**: negative integers starting at -1000 (avoid collision with ByteTrack's positive tracker IDs).
- **Spread factor** (MgO slide correction): >20µm→0.86, 15–20µm→0.80, 10–15µm→0.75, <10µm→0.70. Must be applied before volume calculation.
- **NumPy types** must be `float()`/`int()` cast before JSON serialization in backend.
- **Settings**: persisted to localStorage under `dd-*` keys (theme, shell, lens, confidence, etc.).
- **Auto-save**: every 30s when `isDirty=true`, saves to `Documents/DropDetect_Workspace/AutoSave/`.
- **Workspace root**: `Documents/DropDetect_Workspace/` with subdirs: `Projects/`, `AutoSave/`, `Exports/Excel/`, `Exports/QuickExports/`, `Exports/Snapshots/`, `Media/Imported/`, `Media/Processed/`, `Logs/`.
- **`.drop` files**: ZIP archives containing `project.json` + optionally Excel report.
- **`src/config.ts`**: single source for `API_BASE` and `WS_STREAM` URLs.
- **`useAppStore.ts`** (Zustand): single source of truth for all app state.
- **Hot IPC channel**: `window.electron` preload bridge. No `window.__TAURI__`.
- **Backend thread safety**: ONNX inference on `ThreadPoolExecutor(max_workers=1)`. Snapshot `droplet_data` dict before iterating in frame loop. `_build_excel` runs in executor.

## Testing

- **No test runner** configured for the main desktop app (package.json has no `test`, `lint`, or `typecheck` scripts).
- **Website E2E tests**: `cd website && npm test` (Node verification script, no framework).
- **Python test scripts** exist at root: `test_integration.py`, `test_excel_export.py`, etc. Run with `python test_*.py` from project root with backend venv active. These are gitignored (dev-only).
