# Project: DropDetect AI — Migration from Tauri v2 to Electron

## Architecture
- **Electron Shell (`electron-vite`)**: Main process (`electron/main.ts`), Preload (`electron/preload.ts`), Renderer (`src/`).
- **Python AI Backend**: Process managed by Main process (`child_process.spawn`). Binds to `http://127.0.0.1:8000`. Clean termination on window exit.
- **IPC File System**: Native Node.js `fs`/`path` IPC handlers operating inside `Documents/DropDetect_Workspace/`.
- **Camera & WebSocket Stream**: Chromium frontend connecting to `ws://127.0.0.1:8000/ws/stream` and HTML5 MediaDevices.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Testing Suite | Requirements-based E2E test infra & cases (Tiers 1-4) | None | DONE |
| 2 | Dependency & Build System Migration | Clean Tauri removal, electron-vite & electron-builder setup | None | DONE |
| 3 | Main Process & Backend Manager | electron/main.ts Python spawner & lifecycle management | M2 | DONE |
| 4 | Workspace & File System IPC | electron/preload.ts & main.ts IPC handlers for workspace & .drop | M3 | DONE |
| 5 | Frontend Migration & Hardware Stream | src/ Tauri API replacement, window.electron IPC usage, WebSocket verification | M4 | DONE |
| 6.1 | Fix Electron Window Visibility | Investigate & fix window hidden issue in dev mode (`electron/main.ts`, `show: false`, `ready-to-show`) | M5 | DONE |
| 6.2 | Production Build & Packaging | `electron-builder.json5` extraResources config (ONNX models, PyInstaller binary, resources), `.exe` build | M6.1 | BLOCKED (Command execution permission timeout) |
| 6.3 | E2E Verification & Forensic Audit | End-to-end functionality verification, 100% E2E test pass, forensic audit veto check | M6.2 | PLANNED |

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Window Visibility | Display React UI in BrowserWindow during `npx electron-vite dev` | M6.1 | user_request |
| 2 | Python Backend Manager | Lifecycle management, spawner, `/api/ping` on port 8000 | M3 | survey |
| 3 | Workspace IPC | Initialize workspace, `.drop` save/load, Excel export | M4 | survey |
| 4 | Camera & Hardware Stream | WebSocket video stream & camera selection | M5 | survey |
| 5 | Installer Packaging | Windows `.exe` installer via electron-builder with sidecar & ONNX | M6.2 | user_request |
| 6 | E2E Verification & Forensic Audit | Verification of app launch, backend API, window controls, and installer | M6.3 | user_request |

## Interface Contracts
### Main Process ↔ Preload (`window.electron`)
- `initializeSafeWorkspace()`: Promise<{ success: boolean, workspacePath: string }>
- `saveProject(payload: { data: any, filePath?: string })`: Promise<{ success: boolean, filePath: string }>
- `loadProject(filePath: string)`: Promise<{ success: boolean, data: any }>
- `exportExcel(payload: { exportData: any, defaultPath?: string })`: Promise<{ success: boolean, filePath: string }>
- `autoSaveProject(data: any)`: Promise<{ success: boolean, filePath: string }>
- `logMessage(payload: { level: string, message: string })`: Promise<void>
- `getBackendStatus()`: Promise<{ running: boolean, url: string }>
- `minimizeWindow()`: void
- `maximizeWindow()`: void
- `closeWindow()`: void

## Code Layout
- `electron/main.ts` — Main process entry, window creation, Python backend management, IPC handlers.
- `electron/preload.ts` — Preload script, contextBridge definition.
- `src/` — React frontend.
- `backend/` — Python backend app.
- `fileonnx/` — ONNX AI model files.
- `resources/` — App resources & assets.
- `electron-builder.json5` — Packaging configuration for NSIS installer.
