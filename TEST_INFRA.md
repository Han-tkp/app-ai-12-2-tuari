# DropDetect AI — E2E Test Infrastructure Specification

## Executive Summary
This document specifies the End-to-End (E2E) testing framework for DropDetect AI. Following the Project Pattern dual-track test methodology, the test harness validates all core application features, boundary conditions, cross-feature interactions, and full real-world application workflows. All tests operate in an **opaque-box** fashion by communicating directly with application IPC interfaces, HTTP REST API endpoints, WebSocket streams, and local file system structures.

---

## Test Architecture & Directory Structure

Tests and test utilities are organized under `e2e_tests/` at project root:

```
C:\Users\h4n\Desktop\app-ai-12-2-tuari\e2e_tests\
├── run_all_e2e.py                # Master Python E2E Test Runner
├── runner.js                     # Node.js CLI execution wrapper
├── utils/
│   ├── test_client.py            # Opaque-box HTTP & WebSocket API client
│   └── test_harness.py           # Core test runner harness & assertion library
├── tier1_feature_coverage/
│   ├── test_workspace_init.py    # Tier 1: Workspace Initialization (5 tests)
│   ├── test_drop_saveload.py     # Tier 1: .drop Project File Save & Load (5 tests)
│   ├── test_xlsx_export.py       # Tier 1: Excel (.xlsx) Report Generation (5 tests)
│   ├── test_backend_ping.py      # Tier 1: Backend Ping & Health Status (5 tests)
│   └── test_camera_ws.py         # Tier 1: Camera & WebSocket Live Stream (5 tests)
├── tier2_boundary_corner/
│   ├── test_workspace_boundary.py# Tier 2: Workspace Boundary Cases (5 tests)
│   ├── test_drop_boundary.py     # Tier 2: .drop Save/Load Boundary Cases (5 tests)
│   ├── test_xlsx_boundary.py     # Tier 2: Excel Export Boundary Cases (5 tests)
│   ├── test_ping_boundary.py     # Tier 2: Backend Ping Boundary Cases (5 tests)
│   └── test_ws_boundary.py       # Tier 2: Camera WebSocket Boundary Cases (5 tests)
├── tier3_cross_combinations/
│   └── test_cross_feature.py     # Tier 3: Cross-Feature Pairwise Combinations (6 tests)
└── tier4_real_world/
    └── test_user_workflows.py    # Tier 4: End-to-End Real-World Scenarios (5 tests)
```

---

## Dual-Track Test Methodology & Tier Matrix

### Tier 1: Feature Coverage (>=5 tests per feature, 25 total)

| Test ID | Feature Area | Description | Verification Method |
|---|---|---|---|
| `T1_WS_01` | Workspace Init | Verify creation of `Documents/DropDetect_Workspace/` and subdirs (`Projects`, `Exports/Excel`, `AutoSave`, `Logs`) | Inspect file system directory existence |
| `T1_WS_02` | Workspace Init | Verify workspace initialization is idempotent across multiple runs | Re-run init & check dir preservation |
| `T1_WS_03` | Workspace Init | Verify read/write permissions across all workspace subdirectories | Create and delete test file in each subdir |
| `T1_WS_04` | Workspace Init | Verify `Logs/dropdetect.log` is accessible and writable | Check log file path creation and line append |
| `T1_WS_05` | Workspace Init | Verify workspace default paths structure completeness | Assert all 5 core subpaths resolve correctly |
| `T1_DP_01` | .drop Save/Load | Verify saving project creates valid `.drop` ZIP archive in `Projects/` | POST `/api/save-project` & check ZIP file |
| `T1_DP_02` | .drop Save/Load | Verify `.drop` ZIP file contains valid `project.json` payload | Extract `.drop` and parse `project.json` |
| `T1_DP_03` | .drop Save/Load | Verify manual save embeds `.xlsx` report inside `.drop` archive | Extract `.drop` and check for `.xlsx` entry |
| `T1_DP_04` | .drop Save/Load | Verify loading `.drop` file returns exact saved JSON data | GET `/api/load-project` & compare fields |
| `T1_DP_05` | .drop Save/Load | Verify auto-save creates `.drop` file under `AutoSave/{project_name}/` | POST `/api/save-project` with `isAutoSave=true` |
| `T1_XL_01` | .xlsx Export | Verify Excel report export in Thai language (`language="th"`) | Check `Exports/Excel/{name}_Report.xlsx` |
| `T1_XL_02` | .xlsx Export | Verify Excel report export in English language (`language="en"`) | Check file existence and English headers |
| `T1_XL_03` | .xlsx Export | Verify generated Excel file contains required Summary and Slide worksheets | Inspect workbook sheet names |
| `T1_XL_04` | .xlsx Export | Verify Excel contains calculated droplet statistics (VMD, D10, D50, D90) | Parse Excel cells & compare stats |
| `T1_XL_05` | .xlsx Export | Verify Excel file handle is closed and unlocked after export | Attempt file open in read/write mode |
| `T1_PN_01` | Backend Ping | Verify GET `/api/ping` returns HTTP 200 OK with `status: ok` | Send HTTP GET `/api/ping` |
| `T1_PN_02` | Backend Ping | Verify GET `/ping` returns HTTP 200 OK | Send HTTP GET `/ping` |
| `T1_PN_03` | Backend Ping | Verify GET `/api/session-data` returns active session array | Send HTTP GET `/api/session-data` |
| `T1_PN_04` | Backend Ping | Verify response headers contain CORS headers | Check `access-control-allow-origin` header |
| `T1_PN_05` | Backend Ping | Verify backend response latency is under threshold (<500ms) | Measure GET request round-trip time |
| `T1_CW_01` | Camera WS | Verify WebSocket connection to `ws://127.0.0.1:8000/ws/stream` | Connect WS client & complete handshake |
| `T1_CW_02` | Camera WS | Verify sending `start_camera` command receives status acknowledgment | Send `start_camera` & receive JSON response |
| `T1_CW_03` | Camera WS | Verify sending `stop_camera` command receives `stopped` status | Send `stop_camera` & receive response |
| `T1_CW_04` | Camera WS | Verify `set_lens` command changes lens configuration | Send `set_lens` with `"4x"` |
| `T1_CW_05` | Camera WS | Verify `update_settings` command updates confidence threshold | Send `update_settings` with `conf=0.35` |

---

### Tier 2: Boundary & Corner Cases (>=5 tests per feature, 25 total)

| Test ID | Feature Area | Description | Verification Method |
|---|---|---|---|
| `T2_WS_01` | Workspace Boundary | Verify workspace init when target directory is marked read-only | Handle permission errors gracefully |
| `T2_WS_02` | Workspace Boundary | Verify handling when a file exists at workspace directory path | Detect file collision & report error |
| `T2_WS_03` | Workspace Boundary | Verify workspace resolution with spaces and non-ASCII user home paths | Test Unicode path handling |
| `T2_WS_04` | Workspace Boundary | Verify multi-level parent directory auto-creation for deeply nested paths | Assert recursive directory creation |
| `T2_WS_05` | Workspace Boundary | Verify concurrent workspace initialization calls are thread-safe | Run parallel init threads |
| `T2_DP_01` | .drop Boundary | Verify loading non-existent `.drop` path returns HTTP 404 | GET `/api/load-project?path=missing.drop` |
| `T2_DP_02` | .drop Boundary | Verify loading non-`.drop` extension file returns HTTP 400 | GET `/api/load-project?path=file.txt` |
| `T2_DP_03` | .drop Boundary | Verify loading corrupt non-ZIP `.drop` file returns HTTP 500 | GET `/api/load-project` with bad data |
| `T2_DP_04` | .drop Boundary | Verify loading ZIP `.drop` missing `project.json` returns HTTP 500 | GET `/api/load-project` with missing json |
| `T2_DP_05` | .drop Boundary | Verify saving project with empty project name sanitizes to fallback name | POST `/api/save-project` with `project_name=""` |
| `T2_XL_01` | .xlsx Boundary | Verify export with empty slides array generates valid report | POST `/api/save-project` with `slides: []` |
| `T2_XL_02` | .xlsx Boundary | Verify export with 0 droplets in slides handles zero-division | POST with empty droplet arrays |
| `T2_XL_03` | .xlsx Boundary | Verify export with special characters in project name sanitizes safely | POST with project name `Test/:\*?"<>|` |
| `T2_XL_04` | .xlsx Boundary | Verify export with 5,000 droplets per slide processes without memory issue | POST large droplet arrays |
| `T2_XL_05` | .xlsx Boundary | Verify export with unsupported language code falls back to default | POST with `language="fr"` |
| `T2_PN_01` | Backend Ping Boundary | Verify request to non-existent API endpoint returns HTTP 404 | GET `/api/nonexistent_route` |
| `T2_PN_02` | Backend Ping Boundary | Verify sending POST to GET-only ping endpoint returns HTTP 405 | POST `/api/ping` |
| `T2_PN_03` | Backend Ping Boundary | Verify handling malformed URL parameters does not crash server | GET `/api/ping?query=%%%` |
| `T2_PN_04` | Backend Ping Boundary | Verify sending 8KB oversized HTTP request header succeeds | GET `/api/ping` with large headers |
| `T2_PN_05` | Backend Ping Boundary | Verify 50 rapid sequential GET requests execute without dropping connections | Burst HTTP GET `/api/ping` requests |
| `T2_CW_01` | Camera WS Boundary | Verify sending malformed non-JSON frame over WS is handled cleanly | Send raw text string `"BAD_FRAME"` over WS |
| `T2_CW_02` | Camera WS Boundary | Verify sending unknown action type over WS does not crash server | Send `{"action": "unknown_act"}` |
| `T2_CW_03` | Camera WS Boundary | Verify sending invalid camera index (-999) returns error status | Send `{"action": "start_camera", "index": -999}` |
| `T2_CW_04` | Camera WS Boundary | Verify abrupt WebSocket disconnect triggers proper server cleanup | Disconnect socket without `stop_camera` |
| `T2_CW_05` | Camera WS Boundary | Verify rapid connection and closure of 10 WS sockets releases resources | Open & close 10 sockets in sequence |

---

### Tier 3: Cross-Feature Combinations (6 pairwise interaction tests)

| Test ID | Interaction Pair | Description | Verification Method |
|---|---|---|---|
| `T3_CX_01` | Workspace + .drop | Workspace Init -> Save .drop in `Projects/` -> Load .drop file | Verify full round-trip file lifecycle |
| `T3_CX_02` | WS Stream + Save | Stream WS -> Update lens/settings via WS -> Save project | Verify saved JSON contains updated settings |
| `T3_CX_03` | Ping + Fault Recovery | Ping backend -> Load corrupt .drop (HTTP 500) -> Re-ping backend | Assert backend remains healthy after error |
| `T3_CX_04` | AutoSave + Cleanup | Auto-save project -> Manual save -> Invoke cleanup endpoint | Verify old auto-save file deletion |
| `T3_CX_05` | Multi-Lang + Excel | Save Thai project -> Save English project -> Compare exports | Inspect ZIP and Excel content for both languages |
| `T3_CX_06` | Manual Data + Save | Update manual data -> Save project -> Load project | Verify manual droplet measurements in reloaded data |

---

### Tier 4: Real-World Application Scenarios (5 complete user workflows)

| Test ID | Scenario Name | Workflow Steps | Verification Method |
|---|---|---|---|
| `T4_RW_01` | Complete Experiment Session | Workspace Init -> Ping check -> WS connect -> Set lens & settings -> Simulate measurement -> Save project -> Reload `.drop` file | Verify exact data match across all steps |
| `T4_RW_02` | Auto-save & Disaster Recovery | Workspace Init -> Live detection -> Auto-save -> Crash recovery simulation -> Reload auto-saved `.drop` -> Manual save & cleanup | Verify file persistence & recovery |
| `T4_RW_03` | Multi-Slide Report Generation | Create 5 slides with varied droplet statistics -> Export Thai Excel -> Inspect openpyxl workbook cells | Validate D10, D50, D90, VMD, and WHO compliance formulas |
| `T4_RW_04` | Resilience Under Fault Injection | Ping check -> Inject bad payload to save/load API -> Verify 400/500 response -> Re-ping check -> WS stream check -> Save valid project | Verify 100% server fault recovery |
| `T4_RW_05` | High-Density Data Volume Stress | Generate 10 slides with 500 droplets each (5,000 total) -> Save project -> Export Excel -> Load `.drop` project | Verify performance & data fidelity |

---

## Test Execution Guide

### Running via Python
```bash
python e2e_tests/run_all_e2e.py
```

### Running via Node.js CLI
```bash
node e2e_tests/runner.js
```
