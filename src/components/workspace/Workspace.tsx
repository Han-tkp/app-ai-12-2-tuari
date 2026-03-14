import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import AnnotationLayer from './AnnotationLayer';
import SessionDropletTable from './SessionDropletTable';
import { WS_STREAM } from '../../config';
import {
  MousePointer2, Circle, Square as RectIcon, Minus, Trash2, Edit3, Box,
} from 'lucide-react';

const Workspace: React.FC = () => {
  const {
    isCameraRunning, cameraIndex, ramUsage,
    objectiveLens, updateStats,
    isAIRunning, hardwareProfile, inferenceSkip,
    setHardwareInfo,
    currentSessionDroplets, isSessionTablePoppedOut, setSessionTablePoppedOut,
    activeSlideId, setActiveSlideId, slides,
    isManualEditActive, setManualEditActive,
    activeTool, setActiveTool, clearAnnotations,
  } = useAppStore();

  const [zoom, setZoom] = useState(100);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSlideMenuOpen, setSlideMenuOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  useEffect(() => {
    if (isCameraRunning) {
      ws.current = new WebSocket(WS_STREAM);

      ws.current.onopen = () => {
        const state = useAppStore.getState();
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ action: 'set_ai_active', active: state.isAIRunning }));
          ws.current.send(JSON.stringify({ action: 'set_lens', lens: state.objectiveLens }));
          ws.current.send(JSON.stringify({ action: 'set_camera', index: state.cameraIndex }));
        }
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'hardware_info') {
          setHardwareInfo({
            profile: data.profile,
            ram_gb: data.ram_gb,
            cpu_cores: data.cpu_cores,
            inference_skip: data.inference_skip,
          });
        } else if (data.image) {
          setImageSrc(`data:image/jpeg;base64,${data.image}`);
          if (data.vmd !== undefined) {
            updateStats(data.vmd, data.span, data.count, data.out_of_bounds, data.ram, data.session_droplets || []);
          }
        } else if (data.action === 'export_result') {
          alert(`Report exported successfully to: ${data.path}`);
        }
      };

      const handleCommand = (e: any) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(e.detail));
        }
      };

      window.addEventListener('send-backend-command', handleCommand);
      return () => {
        window.removeEventListener('send-backend-command', handleCommand);
        if (ws.current) ws.current.close();
      };
    } else {
      if (ws.current) ws.current.close();
      setImageSrc(null);
    }
  }, [isCameraRunning, updateStats, setHardwareInfo]);

  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isCameraRunning) {
      ws.current.send(JSON.stringify({ action: 'set_ai_active', active: isAIRunning }));
    }
  }, [isAIRunning, isCameraRunning]);

  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isCameraRunning) {
      ws.current.send(JSON.stringify({ action: 'set_lens', lens: objectiveLens }));
    }
  }, [objectiveLens, isCameraRunning]);

  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isCameraRunning) {
      ws.current.send(JSON.stringify({ action: 'set_camera', index: cameraIndex }));
    }
  }, [cameraIndex, isCameraRunning]);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomStep = 5;
    if (e.deltaY < 0) setZoom(prev => Math.min(400, prev + zoomStep));
    else setZoom(prev => Math.max(50, prev - zoomStep));
  };

  const activeSlide = slides.find(s => s.id === activeSlideId);
  const slideIndex = slides.findIndex(s => s.id === activeSlideId);

  return (
    <div className="w-full h-full flex flex-col transition-colors relative" onWheel={handleWheel}>

      {/* ── Workspace Navbar ─────────────────────────────────────────── */}
      <div
        className="h-[32px] border-b flex items-center gap-1.5 px-3 shrink-0 transition-colors"
        style={{ backgroundColor: 'var(--bg-titlebar)', borderBottomColor: 'var(--border)' }}
      >
        {/* Camera status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${isCameraRunning ? 'bg-[var(--mac-green)] animate-pulse' : 'bg-[var(--text4)]'}`} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text3)' }}>
            {isCameraRunning ? 'Live' : 'Offline'}
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

        <div className="w-px h-4 bg-[var(--separator)] mx-0.5 shrink-0" />

        {/* ── Manual edit toggle ── */}
        <button
          onClick={() => setManualEditActive(!isManualEditActive)}
          className={`h-6 w-6 flex items-center justify-center rounded-md transition-all border shrink-0 ${
            isManualEditActive
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'bg-[var(--bg-surface2)] text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg-surface3)]'
          }`}
          title="Manual Edit"
        >
          <Edit3 size={11} />
        </button>

        {/* ── Manual edit tools (shown only when active) ── */}
        {isManualEditActive && (
          <div className="flex items-center gap-0.5 shrink-0">
            <NavTool active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon={<MousePointer2 size={10} />} title="Select" />
            <NavTool active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={<Circle size={10} />} title="Circle" />
            <NavTool active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} icon={<RectIcon size={10} />} title="Rectangle" />
            <NavTool active={activeTool === 'line'} onClick={() => setActiveTool('line')} icon={<Minus size={10} />} title="Line" />
            <NavTool onClick={clearAnnotations} icon={<Trash2 size={10} />} title="Clear All" danger />
          </div>
        )}

        {/* CAM badge ── far right */}
        <div
          className="text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-surface2)] border border-[var(--border)] px-2 py-0.5 rounded-[5px] ml-auto shrink-0"
          style={{ color: 'var(--text3)' }}
        >
          CAM {cameraIndex}
        </div>
      </div>

      {/* ── Viewport ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
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
          {imageSrc && (
            <img
              src={imageSrc}
              alt="Camera Stream"
              className="absolute inset-0 w-full h-full object-contain select-none"
              draggable={false}
            />
          )}
          <AnnotationLayer width={CANVAS_WIDTH} height={CANVAS_HEIGHT} scale={1} />
          {(!isCameraRunning || !imageSrc) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
              <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" stroke="var(--text4)" strokeWidth="1.5">
                <rect x="4" y="4" width="32" height="26" rx="3" />
                <path d="M14 36h12M20 30v6" />
                <line x1="8" y1="8" x2="32" y2="28" strokeWidth="1.5" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] mt-4" style={{ color: 'var(--text4)' }}>No Signal</span>
            </div>
          )}
        </div>
      </div>

      {/* Unified floating session + manual data table */}
      <SessionDropletTable />

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

const NavTool: React.FC<{
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title?: string;
  danger?: boolean;
}> = ({ active, onClick, icon, title, danger }) => (
  <button
    onClick={onClick}
    title={title}
    className={`h-6 w-6 flex items-center justify-center rounded-md transition-all ${
      active
        ? 'bg-[var(--accent)] text-white'
        : danger
        ? 'text-[var(--mac-red)] hover:bg-[var(--mac-red)]/10'
        : 'text-[var(--text3)] hover:bg-[var(--bg-surface3)] hover:text-[var(--text1)]'
    }`}
  >
    {icon}
  </button>
);

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
