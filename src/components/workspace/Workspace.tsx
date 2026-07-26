import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import AnnotationLayer from './AnnotationLayer';
import SessionDropletTable from './SessionDropletTable';
import DragDropImport from './DragDropImport';
import VideoControls from './VideoControls';
import { WS_STREAM } from '../../config';
import { Box } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../i18n';

const Workspace: React.FC = () => {
  const {
    isCameraRunning, cameraIndex, ramUsage,
    objectiveLens, updateStats,
    isAIRunning, hardwareProfile, inferenceSkip,
    setHardwareInfo,
    currentSessionDroplets, isSessionTablePoppedOut, setSessionTablePoppedOut,
    activeSlideId, setActiveSlideId, slides,
    setImportedMediaPath, importedMediaPath,
  } = useAppStore();

  const { t } = useTranslation();

  const [zoom, setZoom] = useState(100);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSlideMenuOpen, setSlideMenuOpen] = useState(false);
  const [snapshotFreeze, setSnapshotFreeze] = useState<{ src: string; count: number } | null>(null);
  const snapshotFreezeRef = useRef(snapshotFreeze);
  snapshotFreezeRef.current = snapshotFreeze;
  const [snapshotPosition, setSnapshotPosition] = useState({ x: 0, y: 0 });
  const [isDraggingSnapshot, setIsDraggingSnapshot] = useState(false);
  const [isImportingMedia, setIsImportingMedia] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotDragOffset = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Always-on WebSocket — connects on mount, reconnects with backoff
  useEffect(() => {
    let cancelled = false;
    let retryDelay = 2000;
    const MAX_RETRY_DELAY = 30000;

    const connect = () => {
      if (cancelled) return;
      const socket = new WebSocket(WS_STREAM);
      ws.current = socket;

      socket.onopen = () => {
        if (cancelled) { socket.close(); return; }
        console.log('[WS] Connected');
        retryDelay = 2000; // Reset backoff on successful connect
        const state = useAppStore.getState();
        // Sync current state to backend (lightweight, no side effects)
        socket.send(JSON.stringify({ action: 'set_ai_active', active: state.isAIRunning }));
        socket.send(JSON.stringify({ action: 'set_lens', lens: state.objectiveLens }));
        // Resend camera start on reconnect if camera was running
        if (state.isCameraRunning) {
          socket.send(JSON.stringify({ action: 'start_camera', index: state.cameraIndex }));
        }
      };

      socket.onmessage = (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
          return;
        }
        if (data.type === 'hardware_info') {
          setHardwareInfo({
            profile: data.profile,
            ram_gb: data.ram_gb,
            cpu_cores: data.cpu_cores,
            inference_skip: data.inference_skip,
          });
        } else if (data.type === 'camera_status') {
          if (data.status === 'offline' || data.status === 'error') {
            setImageSrc(null);
            console.warn(`Camera ${data.status}: ${data.message}`);
          }
        } else if (data.image && !data.action) {
          const src = `data:image/jpeg;base64,${data.image}`;

          if (data.is_snapshot) {
            if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
            const duration = useAppStore.getState().snapshotDisplayDuration;
            setSnapshotFreeze({ src, count: data.count ?? 0 });
            snapshotTimerRef.current = setTimeout(() => setSnapshotFreeze(null), duration * 1000);
          } else if (!snapshotFreezeRef.current) {
            setImageSrc(src);
          }

          if (data.vmd !== undefined) {
            updateStats(data.vmd, data.span, data.count, data.out_of_bounds, data.ram, data.session_droplets || []);
          }
          // Update video progress if present in frame payload
          if (data.video_progress) {
            useAppStore.getState().setVideoState({
              videoCurrentFrame: data.video_progress.current_frame,
              videoTotalFrames: data.video_progress.total_frames,
              isVideoPlaying: data.video_progress.is_playing,
              videoSpeed: data.video_progress.speed,
              videoFps: data.video_progress.fps,
            });
          }
        } else if (data.action === 'export_result') {
          showToast(`Report exported: ${data.path}`, 'success');
        } else if (data.action === 'snapshot_exported') {
          showToast(`Snapshot saved: ${data.path}`, 'success');
        } else if (data.action === 'snapshot_export_error') {
          showToast(`Snapshot export failed: ${data.error}`, 'error');
        } else if (data.action === 'media_imported') {
          setIsImportingMedia(false);
          setImportProgress('');

          if (data.image) {
            const src = `data:image/jpeg;base64,${data.image}`;
            setImageSrc(src);
            setImportedMediaPath(data.path);
            console.log('Media displayed via backend:', data.type, data.width, 'x', data.height);
          }
          // Set video playback state if this is a video
          if (data.is_video) {
            useAppStore.getState().setVideoState({
              isVideoLoaded: true,
              isVideoPlaying: false,
              videoTotalFrames: data.total_frames || 0,
              videoFps: data.fps || 30,
              videoCurrentFrame: 0,
              videoSpeed: 1.0,
            });
          } else {
            // Image import — clear video state
            useAppStore.getState().setVideoState({ isVideoLoaded: false, isVideoPlaying: false });
          }
          showToast(`${data.type === 'video' ? 'Video' : 'Image'} imported — AI & Snapshot ready`, 'success');
        } else if (data.action === 'import_error') {
          setIsImportingMedia(false);
          setImportProgress('');
          showToast(`Import failed: ${data.error}`, 'error');
        } else if (data.action === 'import_progress') {
          setImportProgress(data.message);
        } else if (data.action === 'video_frame') {
          // Video seek/stop result — display the frame
          if (data.image) {
            setImageSrc(`data:image/jpeg;base64,${data.image}`);
          }
          if (data.video_progress) {
            useAppStore.getState().setVideoState({
              videoCurrentFrame: data.video_progress.current_frame,
              videoTotalFrames: data.video_progress.total_frames,
              isVideoPlaying: data.video_progress.is_playing,
              videoSpeed: data.video_progress.speed,
              videoFps: data.video_progress.fps,
            });
          }
        } else if (data.action === 'video_ended') {
          useAppStore.getState().setVideoState({ isVideoPlaying: false });
          if (data.video_progress) {
            useAppStore.getState().setVideoState({
              videoCurrentFrame: data.video_progress.current_frame,
            });
          }
          showToast('Video playback ended', 'info');
        } else if (data.action === 'detect_roi_result') {
          if (data.found && data.droplets?.length > 0) {
            // AI-assisted detection: create annotations for found droplets
            const BACKEND_W = 640;
            const BACKEND_H = 480;
            const CW = 1280, CH = 720;
            const dScale = Math.min(CW / BACKEND_W, CH / BACKEND_H);
            const oX = (CW - BACKEND_W * dScale) / 2;
            const oY = (CH - BACKEND_H * dScale) / 2;

            for (const drop of data.droplets) {
              const canvasX = drop.cx * dScale + oX;
              const canvasY = drop.cy * dScale + oY;
              const boxW = (drop.box[2] - drop.box[0]) * dScale;
              const boxH = (drop.box[3] - drop.box[1]) * dScale;
              const canvasRadius = Math.max(boxW, boxH) / 2;

              const ann = {
                id: uuidv4(),
                type: 'circle' as const,
                x: canvasX,
                y: canvasY,
                radius: canvasRadius,
                color: '#0a84ff',
                diameter_um: drop.diameter,
                detectionId: drop.id,
              };
              useAppStore.getState().addAnnotation(ann);
            }

            // Update stats
            if (data.vmd !== undefined) {
              updateStats(
                data.vmd, data.span, data.count,
                data.out_of_bounds, useAppStore.getState().ramUsage,
                data.session_droplets || []
              );
            }

            const names = data.droplets.map((d: any) => `#${d.id} ${d.diameter.toFixed(1)}µm`).join(', ');
            showToast(`Detected: ${names}`, 'success');
          } else {
            showToast(data.message || 'ไม่ตรวจพบ droplet ในบริเวณที่เลือก', 'error');
          }
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        console.log(`[WS] Disconnected, reconnecting in ${retryDelay / 1000}s...`);
        reconnectTimerRef.current = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, MAX_RETRY_DELAY);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (ws.current) ws.current.close();
    };
  }, [updateStats, setHardwareInfo, setImportedMediaPath, showToast]);

  // Send commands to backend via WebSocket (always available)
  useEffect(() => {
    const handleCommand = (e: any) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(e.detail));
      } else {
        console.warn('[WS] Not connected, command dropped:', e.detail);
      }
    };

    window.addEventListener('send-backend-command', handleCommand);
    return () => window.removeEventListener('send-backend-command', handleCommand);
  }, []);

  // Camera start/stop via WebSocket commands
  useEffect(() => {
    const sendCameraCommand = () => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
      if (isCameraRunning) {
        ws.current.send(JSON.stringify({ action: 'start_camera', index: cameraIndex }));
      } else {
        ws.current.send(JSON.stringify({ action: 'stop_camera' }));
      }
    };
    // If WS is already open, send immediately; otherwise wait briefly for connection
    if (ws.current?.readyState === WebSocket.OPEN) {
      sendCameraCommand();
    } else {
      const timer = setTimeout(sendCameraCommand, 500);
      return () => clearTimeout(timer);
    }
  }, [isCameraRunning, cameraIndex]);

  // Sync AI state
  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'set_ai_active', active: isAIRunning }));
    }
  }, [isAIRunning]);

  // Sync lens
  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'set_lens', lens: objectiveLens }));
    }
  }, [objectiveLens]);

  // Sync camera index change (while camera is running)
  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isCameraRunning) {
      ws.current.send(JSON.stringify({ action: 'set_camera', index: cameraIndex }));
    }
  }, [cameraIndex, isCameraRunning]);

  const handleWheel = useCallback((e: WheelEvent) => {
    const zoomWithCtrl = useAppStore.getState().zoomWithCtrl;
    if (zoomWithCtrl && !e.ctrlKey) return;
    e.preventDefault();
    const zoomStep = 5;
    if (e.deltaY < 0) setZoom(prev => Math.min(400, prev + zoomStep));
    else setZoom(prev => Math.max(50, prev - zoomStep));
  }, []);

  // Snapshot drag handlers
  const handleSnapshotMouseDown = (e: React.MouseEvent) => {
    if (!snapshotRef.current) return;
    setIsDraggingSnapshot(true);
    const rect = snapshotRef.current.getBoundingClientRect();
    snapshotDragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSnapshot || !viewportRef.current) return;
      const viewportRect = viewportRef.current.getBoundingClientRect();
      const x = e.clientX - viewportRect.left - snapshotDragOffset.current.x;
      const y = e.clientY - viewportRect.top - snapshotDragOffset.current.y;
      const maxX = viewportRect.width - 200;
      const maxY = viewportRect.height - 100;
      setSnapshotPosition({
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY))
      });
    };

    const handleMouseUp = () => setIsDraggingSnapshot(false);

    if (isDraggingSnapshot) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSnapshot]);

  // Clear viewport when project resets (importedMediaPath cleared + camera off)
  useEffect(() => {
    if (!importedMediaPath && !isCameraRunning) {
      setImageSrc(null);
    }
  }, [importedMediaPath, isCameraRunning]);

  // Attach wheel listener to viewport with passive:false so we can preventDefault
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Handle media import from Electron drag-drop
  const handleImportMedia = useCallback(async (path: string, type: 'image' | 'video') => {
    console.log('[Import] Electron drop path:', path, type);
    setIsImportingMedia(true);
    setImportProgress(`Importing ${type}...`);

    try {
      // For images, read and display locally immediately
      if (type === 'image') {
        const base64 = await window.electron.readFileAsBase64(path);
        const ext = path.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' :
                         ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                         ext === 'bmp' ? 'image/bmp' :
                         ext === 'tiff' || ext === 'tif' ? 'image/tiff' : 'image/jpeg';
        setImageSrc(`data:${mimeType};base64,${base64}`);
        setImportedMediaPath(path);
      }

      // For images: display is already done locally, clear spinner now
      // Backend will still process for AI, but user sees image immediately
      if (type === 'image') {
        setIsImportingMedia(false);
        setImportProgress('');
      }

      // Send to backend for AI processing (and video frame extraction)
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          action: 'import_media',
          type,
          path,
          display: type === 'image',
        }));
      } else {
        if (type === 'video') {
          showToast('Backend not connected — video requires backend for frame extraction', 'error');
        } else {
          showToast('Image displayed — connect backend for AI features', 'info');
        }
        setIsImportingMedia(false);
        setImportProgress('');
      }
    } catch (err) {
      console.error('[Import] Failed to read file:', err);
      showToast(`Import failed: ${(err as Error).message}`, 'error');
      setIsImportingMedia(false);
      setImportProgress('');
    }
  }, [showToast, setImportedMediaPath]);

  const activeSlide = slides.find(s => s.id === activeSlideId);
  const slideIndex = slides.findIndex(s => s.id === activeSlideId);
  // Show "No Signal" only when there's no image at all (neither camera nor imported)
  const hasVisual = !!(snapshotFreeze ? snapshotFreeze.src : imageSrc);

  return (
    <div className="w-full h-full flex flex-col transition-colors relative">

      {/* ── Workspace Navbar ─────────────────────────────────────────── */}
      <div
        className="h-[32px] border-b flex items-center gap-1.5 px-3 shrink-0 transition-colors"
        style={{ backgroundColor: 'var(--bg-titlebar)', borderBottomColor: 'var(--border)' }}
      >
        {/* Camera status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${isCameraRunning ? 'bg-[var(--mac-green)] animate-pulse' : importedMediaPath ? 'bg-[var(--mac-orange)]' : 'bg-[var(--text4)]'}`} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text3)' }}>
            {isCameraRunning ? 'Live' : importedMediaPath ? 'Imported' : 'Offline'}
          </span>
        </div>
        {isAIRunning && (
          <span className="text-[9px] bg-[var(--mac-orange)]/20 text-[var(--mac-orange)] px-1.5 py-0.5 rounded font-black animate-pulse shrink-0">AI ACTIVE</span>
        )}

        <div className="w-px h-4 bg-[var(--separator)] mx-0.5 shrink-0" />

        {/* ── Slide selector ── */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSlideMenuOpen(!isSlideMenuOpen)}
            className="flex items-center gap-1.5 h-6 px-2 bg-[var(--bg-surface2)] border border-[var(--border)] rounded-md text-[10px] font-bold text-[var(--text2)] hover:bg-[var(--bg-surface3)] transition-all"
          >
            <span className="w-4 h-4 rounded bg-[var(--accent)]/15 text-[var(--accent-text)] flex items-center justify-center text-[8px] font-black shrink-0">
              {slideIndex >= 0 ? slideIndex + 1 : '—'}
            </span>
            <span className="max-w-[90px] truncate">{activeSlide?.name ?? 'Select Slide'}</span>
          </button>

          {isSlideMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSlideMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-[190px] bg-[var(--bg-sidebar)] border border-[var(--border-strong)] rounded-[5px] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}>
                {slides.length === 0 ? (
                  <div className="py-4 text-center text-[10px] text-[var(--text4)] italic">No slides defined.</div>
                ) : slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSlideId(s.id); setSlideMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-all hover:bg-[var(--bg-hover)] ${activeSlideId === s.id ? 'bg-[var(--bg-active)]' : ''}`}
                  >
                    <span className="w-5 h-5 rounded-md bg-[var(--accent)]/10 text-[var(--accent-text)] flex items-center justify-center text-[9px] font-black shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-[var(--text1)] truncate">{s.name}</span>
                      <span className="text-[8px] text-[var(--text4)] font-medium">{s.droplets.length} drops · {s.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Session table toggle ── */}
        <button
          onClick={() => setSessionTablePoppedOut(!isSessionTablePoppedOut)}
          className={`flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-bold transition-all border shrink-0 ${
            isSessionTablePoppedOut
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'bg-[var(--bg-surface2)] text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg-surface3)]'
          }`}
          title="Session Data Table"
        >
          <Box size={10} />
          <span className="font-mono">{currentSessionDroplets.length}</span>
        </button>

        {/* CAM badge ── far right */}
        <div
          className="text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-surface2)] border border-[var(--border)] px-2 py-0.5 rounded-[5px] ml-auto shrink-0"
          style={{ color: 'var(--text3)' }}
        >
          CAM {cameraIndex}
        </div>
      </div>

      {/* ── Viewport ─────────────────────────────────────────────────── */}
      <div ref={viewportRef} className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 vp-grid-black" />
        <div
          className="relative bg-black border shadow-2xl transition-transform duration-200 overflow-hidden"
          style={{
            aspectRatio: '16/9',
            width: `${CANVAS_WIDTH}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoom / 100})`,
            borderColor: 'var(--border)',
          }}
        >
          {(snapshotFreeze ? snapshotFreeze.src : imageSrc) && (
            <img
              src={snapshotFreeze ? snapshotFreeze.src : imageSrc!}
              alt="Camera Stream"
              className="absolute inset-0 w-full h-full object-contain select-none"
              draggable={false}
            />
          )}
          <AnnotationLayer width={CANVAS_WIDTH} height={CANVAS_HEIGHT} scale={1} />

          {/* Snapshot freeze overlay - draggable */}
          {snapshotFreeze && (
            <div
              ref={snapshotRef}
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-move pointer-events-auto"
              style={{
                top: `${snapshotPosition.y}px`,
                right: `${snapshotPosition.x}px`,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid var(--accent)',
              }}
              onMouseDown={handleSnapshotMouseDown}
            >
              <div className="w-2 h-2 rounded-full bg-[var(--mac-red)] animate-pulse" />
              <span className="text-[11px] font-bold text-white uppercase">{t('snapshot')}</span>
              <span className="text-[13px] font-instrument font-bold" style={{ color: 'var(--accent-text)' }}>
                {snapshotFreeze.count} {t('detected')}
              </span>
            </div>
          )}

          {!hasVisual && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
              <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" stroke="var(--text4)" strokeWidth="1.5">
                <rect x="4" y="4" width="32" height="26" rx="3" />
                <path d="M14 36h12M20 30v6" />
                <line x1="8" y1="8" x2="32" y2="28" strokeWidth="1.5" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] mt-4" style={{ color: 'var(--text4)' }}>{t('no_signal')}</span>
              <span className="text-[9px] mt-1" style={{ color: 'var(--text4)' }}>{t('no_signal_desc')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Unified floating session + manual data table */}
      <SessionDropletTable />

      {/* Video playback controls (floating) */}
      <VideoControls />

      {/* Drag & Drop Import Overlay */}
      <DragDropImport onImport={handleImportMedia} />

      {/* Import Progress Indicator */}
      {isImportingMedia && (
        <div className="fixed bottom-20 right-4 z-[100] px-4 py-3 rounded-lg border mac-dialog-shadow pointer-events-auto"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--accent)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text1)' }}>
              {importProgress || 'Importing...'}
            </span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-20 right-4 z-[200] px-4 py-3 rounded-lg border pointer-events-auto animate-in slide-in-from-bottom-2 duration-200 max-w-sm ${
            toast.type === 'error' ? 'border-[var(--mac-red)]' :
            toast.type === 'success' ? 'border-[var(--mac-green)]' :
            'border-[var(--accent)]'
          }`}
          style={{
            background: 'var(--bg-surface)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          onClick={() => setToast(null)}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === 'error' ? 'bg-[var(--mac-red)]' :
              toast.type === 'success' ? 'bg-[var(--mac-green)]' :
              'bg-[var(--accent)]'
            }`} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--text1)' }}>
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* ── Bottom zoom bar ───────────────────────────────────────────── */}
      <div
        className="h-[40px] border-t flex items-center justify-between px-4 transition-colors shrink-0"
        style={{ backgroundColor: 'var(--bg-titlebar)', borderTopColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text3)' }}>Zoom</span>
          <input
            type="range" min="50" max="400" value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
            className="zoom-input"
          />
          <span className="text-[11px] font-medium font-mono w-10 text-center" style={{ color: 'var(--text2)' }}>{zoom}%</span>
          <button onClick={() => setZoom(100)} className="reset-btn ml-2">Reset View</button>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
            RAM {ramUsage} · {isCameraRunning ? '30' : '0'} FPS
          </span>
          <ProfileBadge profile={hardwareProfile} inferenceSkip={inferenceSkip} />
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const PROFILE_COLORS: Record<string, string> = {
  low: 'var(--mac-orange)',
  mid: 'var(--mac-yellow)',
  high: 'var(--mac-green)',
};

const ProfileBadge: React.FC<{ profile: string; inferenceSkip: number }> = ({ profile, inferenceSkip }) => {
  const { ramGb } = useAppStore();
  const color = PROFILE_COLORS[profile] ?? 'var(--text4)';
  const label = profile.toUpperCase();
  const skipLabel = inferenceSkip > 1 ? ` 1/${inferenceSkip}` : '';
  const tooltip = `${label} profile — inference ทุก ${inferenceSkip} frame · RAM ${ramGb > 0 ? ramGb + ' GB' : 'N/A'}`;
  return (
    <span
      title={tooltip}
      className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border"
      style={{ color, borderColor: color, background: `${color}15` }}
    >
      {label}{skipLabel}
    </span>
  );
};

export default Workspace;
