# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for DropDetect AI Backend (onefile mode for Tauri sidecar)

import os

ROOT = os.path.dirname(os.path.abspath(SPECPATH))

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        (os.path.join(ROOT, 'fileonnx', 'yolov8n_4x.onnx'), 'fileonnx'),
        (os.path.join(ROOT, 'fileonnx', 'yolov8n_10x.onnx'), 'fileonnx'),
        (os.path.join(ROOT, 'resources', '4x.json'), 'resources'),
        (os.path.join(ROOT, 'resources', '10x.json'), 'resources'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'supervision',
        'supervision.tracker',
        'supervision.tracker.byte_tracker',
        'supervision.tracker.byte_tracker.core',
        'onnxruntime',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'PIL.ImageTk'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='dropdetect-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    console=True,
    icon=None,
)
