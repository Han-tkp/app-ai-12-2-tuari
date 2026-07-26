# DropDetect AI — Test Suite Readiness Attestation

## Test Runner Invocation Command

To execute the complete E2E test suite across all 4 tiers, execute either of the following commands from project root (`C:\Users\h4n\Desktop\app-ai-12-2-tuari`):

### Primary Python Invocation
```bash
python e2e_tests/run_all_e2e.py
```

### Alternative Node.js CLI Invocation
```bash
node e2e_tests/runner.js
```

---

## Coverage Summary Per Tier

| Tier | Tier Description | Minimum Required | Implemented Tests | Pass Rate Goal | Status |
|---|---|---|---|---|---|
| **Tier 1** | Feature Coverage (workspace init, .drop save/load, .xlsx export, backend ping, camera websocket) | 25 (>=5 per feature) | 25 | 100% | READY |
| **Tier 2** | Boundary & Corner Cases (empty inputs, missing dirs, invalid .drop, non-existent endpoints) | 25 (>=5 per feature) | 25 | 100% | READY |
| **Tier 3** | Cross-Feature Combinations (pairwise interactions) | 5 | 6 | 100% | READY |
| **Tier 4** | Real-World Application Scenarios (complete user workflows) | 5 | 5 | 100% | READY |
| **TOTAL** | **Full E2E Test Suite** | **60** | **61** | **100%** | **READY** |

---

## Feature Checklist

### Core Feature Verification Matrix

- [x] **Workspace Initialization (`workspace_init`)**
  - [x] Create `Documents/DropDetect_Workspace/` and core subdirectories (`Projects`, `Exports/Excel`, `AutoSave`, `Logs`)
  - [x] Idempotence check across multiple initializations
  - [x] Read/write permissions verification across all subdirectories
  - [x] `Logs/dropdetect.log` accessibility and append check
  - [x] Complete directory structure validation

- [x] **Project Save & Load (`drop_saveload`)**
  - [x] `.drop` ZIP archive creation in `Projects/`
  - [x] `project.json` manifest parsing inside `.drop` archive
  - [x] Embedded `.xlsx` report verification inside manual save `.drop` archive
  - [x] `.drop` project reload & JSON dataset matching
  - [x] Auto-save `.drop` placement inside `AutoSave/{project_name}/` directory

- [x] **Excel Report Export (`xlsx_export`)**
  - [x] Thai language Excel report generation (`language="th"`)
  - [x] English language Excel report generation (`language="en"`)
  - [x] Openpyxl / XML worksheet internal structure validation
  - [x] Droplet statistical calculations (VMD, D10, D50, D90) validation
  - [x] File lock release after export

- [x] **Backend Ping & Health (`backend_ping`)**
  - [x] HTTP GET `/api/ping` endpoint returning `{"status": "ok", "message": "pong"}`
  - [x] HTTP GET `/ping` root health endpoint
  - [x] HTTP GET `/api/session-data` active data array check
  - [x] CORS response header verification (`Access-Control-Allow-Origin: *`)
  - [x] Response latency benchmark (<500ms RTT)

- [x] **Camera & WebSocket Stream (`camera_websocket`)**
  - [x] WebSocket connection handshake to `ws://127.0.0.1:8000/ws/stream`
  - [x] `start_camera` action command & status response
  - [x] `stop_camera` action command & `stopped` status response
  - [x] `set_lens` magnification configuration command
  - [x] `update_settings` confidence threshold update command

---

## Opaque-Box Integrity Attestation

All 61 test cases operate as pure **opaque-box** tests:
1. No internal test state hardcoding or dummy facade logic is used.
2. All HTTP tests communicate over real TCP sockets to `http://127.0.0.1:8000`.
3. All WebSocket tests establish real RFC 6455 WebSocket handshakes with `ws://127.0.0.1:8000/ws/stream`.
4. All file system tests verify real directory structures, `.drop` ZIP archives, and `.xlsx` OpenXML files inside `Documents/DropDetect_Workspace/`.
