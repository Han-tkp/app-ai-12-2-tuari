# DropDetect AI — Release Notes

## v2.0.4 (2026-03-15)

### Installation & UX Fixes
- Settings (export path, language, annotation fade delay) now persist across app restarts via localStorage
- Default export path auto-set to `Documents/DropDetect_Projects/` on first launch
- Default theme changed to **light mode**
- Close confirmation dialog when there are unsaved changes (Cancel / Don't Save / Save & Exit)
- Slide droplets can now be deleted from the session table

### Backend Stability
- `_build_excel` moved to thread pool executor to prevent event loop blocking (3 call sites)
- `handle_commands` WebSocket task properly cancelled on client disconnect
- `calculate_stats` uses dict snapshot before iteration to prevent RuntimeError
- `update_manual_data` uses atomic dict replacement for thread safety
- `open_camera` returns `None` on failure with exponential backoff reconnect
- Input validation added for `load_resources`, `save_project`, `load_project`, `cleanup_autosave`
- ONNX inference captures session locally before executor dispatch

### Frontend Stability
- `syncManualAnnotations` debounced at 150ms to reduce redundant backend calls
- `AnnotationLayer` null guards on shape properties prevent render crashes
- `ErrorBoundary` reset no longer wipes all localStorage (only project data)
- `Workspace` WebSocket message parsing wrapped in try/catch
- Stale closure fix in SessionDropletTable bulk/single delete

### Security
- Tauri FS permissions scoped to `$DOCUMENT/DropDetect_Workspace/**` (was broad document access)
- Content Security Policy (CSP) added to Tauri webview config
- Path traversal prevention on project save/load/cleanup endpoints

### Build & CI/CD
- Multi-platform CI/CD: Windows (NSIS + MSI) and Linux (deb + AppImage)
- GitHub Release auto-created on version tags (`v*`)
- GitHub Pages deployment from `docs/` folder
- Tauri config: category fixed, Cargo.toml metadata updated

### New: Download Website
- Static landing page in `docs/` for GitHub Pages
- OS auto-detection for download button
- Windows and Linux installer downloads supported
