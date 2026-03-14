import React, { useState } from 'react';
import {
  Camera, LayoutDashboard,
  RotateCcw, Play, Square,
  Camera as CameraIcon,
  Plus, Download, ChevronDown, Layers, RefreshCcw, Trash2,
} from 'lucide-react';

function computeSlideStats(droplets: number[]) {
  if (!droplets.length) return { vmd: 0, span: 0, count: 0, dv10: 0, dv90: 0 };
  const sorted = [...droplets].sort((a, b) => a - b);
  const vols = sorted.map(d => (Math.PI / 6) * Math.pow(d, 3));
  const totalVol = vols.reduce((a, b) => a + b, 0);
  if (!totalVol) return { vmd: 0, span: 0, count: sorted.length, dv10: 0, dv90: 0 };
  const cumVol: number[] = [];
  let running = 0;
  for (const v of vols) { running += v / totalVol; cumVol.push(running); }
  const idx10 = cumVol.findIndex(c => c >= 0.1);
  const idx50 = cumVol.findIndex(c => c >= 0.5);
  const idx90 = cumVol.findIndex(c => c >= 0.9);
  const dv10 = sorted[idx10 >= 0 ? idx10 : 0] ?? 0;
  const dv50 = sorted[idx50 >= 0 ? idx50 : 0] ?? 0;
  const dv90 = sorted[idx90 >= 0 ? idx90 : sorted.length - 1] ?? 0;
  const span = dv50 > 0 ? (dv90 - dv10) / dv50 : 0;
  return { vmd: dv50, span, count: sorted.length, dv10, dv90 };
}

import { useAppStore } from '../../store/useAppStore';

const Sidebar: React.FC = () => {
  const {
    mode, setMode,
    isCameraRunning, toggleCamera,
    isAIRunning, setAIRunning,
    objectiveLens, setObjectiveLens,
    switchCamera,
    slides, addSlide, removeSlide, targetSize, setTargetSize,
    filterMin, filterMax, setFilterRange,
    activeSlideId, setActiveSlideId, retakeSlide,
    hotkeyLiveAI, hotkeySnapshot, triggerSave, fetchSessionAndAddToSlide,
    excelLanguage, setExcelLanguage,
  } = useAppStore();

  const [isSlideSelectOpen, setSlideSelectOpen] = useState(false);
  const activeSlide = slides.find(s => s.id === activeSlideId);

  const handleExport = () => {
    if (mode === 'Report') triggerSave();
    else window.dispatchEvent(new CustomEvent('send-backend-command', { detail: { action: 'export_excel' } }));
  };

  const handleSnapshot = () => {
    if (!isCameraRunning) return;
    window.dispatchEvent(new CustomEvent('send-backend-command', { detail: { action: 'take_snapshot' } }));
  };

  const handleFilterMin = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n)) setFilterRange(n, filterMax);
    else if (val === '') setFilterRange(0, filterMax);
  };

  const handleFilterMax = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n)) setFilterRange(filterMin, n);
    else if (val === '') setFilterRange(filterMin, 0);
  };

  const handleTargetSizeChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const n = parseInt(cleaned);
    if (!isNaN(n)) setTargetSize(n);
    else if (cleaned === '') setTargetSize(0);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-sidebar)' }}>

      {/* ── Mode Tabs ──────────────────────────────────────────────── */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <SidebarTab active={mode === 'Analyze'} onClick={() => setMode('Analyze')} icon={<Camera size={13} />} label="Analyze" />
        <SidebarTab active={mode === 'Report'}  onClick={() => setMode('Report')}  icon={<LayoutDashboard size={13} />} label="Report" />
      </div>

      {/* ── Scrollable content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {mode === 'Analyze' ? (
          <>
            {/* Objective Lens */}
            <SidebarSection label="Objective Lens">
              <select
                value={objectiveLens}
                onChange={(e) => setObjectiveLens(e.target.value as '4x' | '10x')}
                className="mac-select"
              >
                <option value="10x">10× — High Resolution</option>
                <option value="4x">4× — Wide Field</option>
              </select>
            </SidebarSection>

            {/* Camera */}
            <SidebarSection label="Camera">
              <div className="flex gap-2">
                <button
                  onClick={toggleCamera}
                  className={isCameraRunning ? 'btn-danger flex-1' : 'btn-success flex-1'}
                >
                  {isCameraRunning
                    ? <><Square size={12} fill="currentColor" /><span>Stop Camera</span></>
                    : <><Play size={12} fill="currentColor" /><span>Start Camera</span></>
                  }
                </button>
                <button
                  onClick={switchCamera}
                  disabled={!isCameraRunning}
                  title="Switch Camera"
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors border shrink-0"
                  style={{
                    borderColor: 'var(--border-strong)',
                    background: 'var(--bg-surface2)',
                    color: isCameraRunning ? 'var(--text2)' : 'var(--text4)',
                    cursor: isCameraRunning ? 'pointer' : 'not-allowed',
                    opacity: isCameraRunning ? 1 : 0.4,
                  }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </SidebarSection>

            {/* AI Inference */}
            <SidebarSection label="AI Inference">
              <div className="space-y-2">
                <button
                  onClick={() => setAIRunning(!isAIRunning)}
                  disabled={!isCameraRunning}
                  className={
                    !isCameraRunning
                      ? 'btn-secondary w-full h-10 opacity-40 cursor-not-allowed'
                      : isAIRunning
                        ? 'btn-danger'
                        : 'btn-primary'
                  }
                >
                  {isAIRunning
                    ? <><Square size={12} fill="currentColor" /><span>Stop Live AI</span></>
                    : <><Play size={12} fill="currentColor" /><span>Start Live AI</span></>
                  }
                  <span
                    className="ml-auto font-instrument text-[10px] opacity-60"
                  >
                    {hotkeyLiveAI}
                  </span>
                </button>

                <button
                  onClick={handleSnapshot}
                  disabled={!isCameraRunning}
                  className="btn-secondary"
                >
                  <CameraIcon size={13} />
                  <span>Snapshot</span>
                  <span className="ml-auto font-instrument text-[10px]" style={{ color: 'var(--text4)' }}>
                    {hotkeySnapshot}
                  </span>
                </button>
              </div>
            </SidebarSection>

            {/* Data Actions */}
            <SidebarSection label="Data" last>
              <div className="space-y-2">
                <button
                  onClick={() => fetchSessionAndAddToSlide()}
                  className="btn-success"
                >
                  <Plus size={13} />
                  <span>Add Session to Slide</span>
                </button>
                <button onClick={handleExport} className="btn-secondary">
                  <Download size={13} />
                  <span>Quick Export Excel</span>
                </button>
              </div>
            </SidebarSection>
          </>
        ) : (
          <>
            {/* Slide Summary Table */}
            <SidebarSection label={`Slide Summary (${slides.length})`}>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-left text-[11px]">
                  <thead style={{ background: 'var(--bg-surface3)' }}>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>Slide</th>
                      <th className="px-2 py-1.5 text-right text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>VMD</th>
                      <th className="px-2 py-1.5 text-right text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>Span</th>
                      <th className="px-2 py-1.5 text-right text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slides.map((s, i) => {
                      const stats = computeSlideStats(s.droplets);
                      const isActive = activeSlideId === s.id;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setActiveSlideId(s.id)}
                          className="cursor-pointer transition-colors"
                          style={{
                            background: isActive ? 'var(--bg-active)' : i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface2)',
                            borderTop: '1px solid var(--separator)',
                          }}
                          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface2)'; }}
                        >
                          <td className="px-2 py-1.5 flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold shrink-0"
                              style={{
                                background: isActive ? 'var(--accent)' : 'var(--bg-surface3)',
                                color: isActive ? '#fff' : 'var(--text3)',
                              }}
                            >{i + 1}</span>
                            <span className="truncate max-w-[55px] text-[11px] font-medium" style={{ color: 'var(--text1)' }}>{s.name}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right font-instrument font-bold text-[11px]" style={{ color: 'var(--text1)' }}>
                            {stats.count > 0 ? stats.vmd.toFixed(1) : '—'}
                          </td>
                          <td className="px-2 py-1.5 text-right font-instrument text-[11px]" style={{ color: 'var(--text2)' }}>
                            {stats.count > 0 ? stats.span.toFixed(2) : '—'}
                          </td>
                          <td className="px-2 py-1.5 text-right font-instrument text-[11px]" style={{ color: 'var(--text3)' }}>
                            {stats.count}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sorted droplet list for active slide */}
              {activeSlideId && (() => {
                const slide = slides.find(s => s.id === activeSlideId);
                if (!slide || slide.droplets.length === 0) return null;
                const sorted = [...slide.droplets].sort((a, b) => a - b);
                return (
                  <div className="mt-3 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <div
                      className="px-3 py-1.5 flex items-center justify-between"
                      style={{ background: 'var(--bg-surface3)', borderBottom: '1px solid var(--border)' }}
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>{slide.name} — sorted</span>
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--accent-text)' }}>{sorted.length} drops</span>
                    </div>
                    <div className="max-h-[130px] overflow-y-auto custom-scrollbar" style={{ background: 'var(--bg-surface)' }}>
                      <table className="w-full text-[10.5px]">
                        <tbody>
                          {sorted.map((d, idx) => (
                            <tr key={idx} style={{ borderTop: idx > 0 ? '1px solid var(--separator)' : undefined }}>
                              <td className="px-3 py-1 font-instrument" style={{ color: 'var(--text4)' }}>{idx + 1}</td>
                              <td className="px-3 py-1 text-right font-instrument font-semibold" style={{ color: 'var(--accent-text)' }}>
                                {d.toFixed(1)} µm
                              </td>
                              <td className="px-3 py-1 text-right">
                                <div
                                  className="inline-block h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(60, (d / 30) * 60)}px`,
                                    background: d >= 10 && d <= 30 ? 'var(--accent)' : 'var(--mac-red)',
                                    opacity: 0.5,
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </SidebarSection>

            {/* Filter */}
            <SidebarSection label="Filter Range (µm)">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text4)', letterSpacing: '0.06em' }}>Min</span>
                  <input
                    type="number"
                    value={filterMin}
                    onChange={(e) => handleFilterMin(e.target.value)}
                    className="w-full rounded-md px-2.5 py-1.5 text-[12px] font-instrument outline-none transition-colors border"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-strong)', color: 'var(--text1)' }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text4)', letterSpacing: '0.06em' }}>Max</span>
                  <input
                    type="number"
                    value={filterMax}
                    onChange={(e) => handleFilterMax(e.target.value)}
                    className="w-full rounded-md px-2.5 py-1.5 text-[12px] font-instrument outline-none transition-colors border"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-strong)', color: 'var(--text1)' }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'}
                  />
                </div>
              </div>
              <div
                className="w-full py-1.5 rounded-md text-center text-[10px] font-semibold border"
                style={{
                  background: 'var(--bg-active)',
                  borderColor: 'rgba(59,130,246,0.25)',
                  color: 'var(--accent-text)',
                }}
              >
                WHO Criteria: {filterMin}–{filterMax} µm
              </div>
            </SidebarSection>

            {/* Slide selector */}
            <SidebarSection label={`Slides (${slides.length})`} headerRight={
              <button
                onClick={addSlide}
                className="text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
                style={{ color: 'var(--accent-text)' }}
              >
                <Plus size={11} strokeWidth={2.5} /> Add
              </button>
            }>
              <div className="relative">
                <button
                  onClick={() => setSlideSelectOpen(!isSlideSelectOpen)}
                  className="w-full rounded-lg px-3 py-2.5 flex items-center justify-between transition-colors border"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-active)' }}
                    >
                      <Layers size={14} style={{ color: 'var(--accent-text)' }} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--text1)' }}>
                        {activeSlide?.name || 'Select Slide'}
                      </span>
                      <span className="text-[9px] leading-tight" style={{ color: 'var(--text4)' }}>
                        {activeSlide ? `${activeSlide.droplets.length} droplets · ${activeSlide.status}` : 'Choose destination'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--text4)',
                      transform: isSlideSelectOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {isSlideSelectOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSlideSelectOpen(false)} />
                    <div
                      className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-lg"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                      }}
                    >
                      <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                        {slides.length === 0 ? (
                          <div className="py-4 text-center text-[10px] italic" style={{ color: 'var(--text4)' }}>No slides yet.</div>
                        ) : slides.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between rounded-md px-2 py-1.5 group transition-colors cursor-pointer"
                            style={{ background: activeSlideId === s.id ? 'var(--bg-active)' : 'transparent' }}
                            onMouseEnter={e => { if (activeSlideId !== s.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={e => { if (activeSlideId !== s.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            onClick={() => { setActiveSlideId(s.id); setSlideSelectOpen(false); }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: activeSlideId === s.id ? 'var(--accent)' : 'var(--text4)' }}
                              />
                              <div>
                                <div className="text-[11px] font-medium" style={{ color: activeSlideId === s.id ? 'var(--accent-text)' : 'var(--text1)' }}>{s.name}</div>
                                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>{s.status} · {s.droplets.length} drops</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); retakeSlide(s.id); setSlideSelectOpen(false); }}
                                className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                                style={{ color: 'var(--text4)' }}
                                title="Retake"
                              >
                                <RefreshCcw size={11} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeSlide(s.id); }}
                                className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                                style={{ color: 'var(--text4)' }}
                                title="Delete"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SidebarSection>

            {/* Target Size */}
            <SidebarSection label="Target Sample Size (n)">
              <div
                className="flex items-center rounded-lg border overflow-hidden h-10"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-strong)' }}
              >
                <button
                  onClick={() => setTargetSize(Math.max(1, targetSize - 1))}
                  className="w-10 h-full flex items-center justify-center transition-colors text-[16px] font-medium shrink-0"
                  style={{ borderRight: '1px solid var(--border-strong)', color: 'var(--text3)' }}
                >
                  −
                </button>
                <input
                  type="text"
                  value={targetSize}
                  onChange={(e) => handleTargetSizeChange(e.target.value)}
                  className="flex-1 text-center text-[15px] font-instrument font-bold bg-transparent outline-none"
                  style={{ color: 'var(--accent-text)' }}
                />
                <button
                  onClick={() => setTargetSize(targetSize + 1)}
                  className="w-10 h-full flex items-center justify-center transition-colors text-[16px] font-medium shrink-0"
                  style={{ borderLeft: '1px solid var(--border-strong)', color: 'var(--text3)' }}
                >
                  +
                </button>
              </div>
              <p className="mt-1.5 text-[9px] italic" style={{ color: 'var(--text4)' }}>
                AI selects {targetSize} droplets by WHO distribution criteria.
              </p>
            </SidebarSection>

            {/* Actions */}
            <SidebarSection label="Actions" last>
              <div className="space-y-2">
                <button onClick={() => fetchSessionAndAddToSlide()} className="btn-success">
                  <Plus size={13} /> Add Session to Slide
                </button>
                
                {/* Excel Language Selector */}
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text4)', letterSpacing: '0.06em' }}>
                    Excel Language
                  </span>
                  <select
                    value={excelLanguage}
                    onChange={(e) => setExcelLanguage(e.target.value as 'th' | 'en')}
                    className="mac-select"
                  >
                    <option value="th">ไทย (Thai)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                
                <button
                  onClick={handleExport}
                  className="btn-primary"
                >
                  <Download size={14} /> Export Excel Report
                </button>
              </div>
            </SidebarSection>
          </>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SidebarTab: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-colors relative"
    style={{ color: active ? 'var(--accent-text)' : 'var(--text3)' }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text3)'; }}
  >
    {icon}
    <span>{label}</span>
    {active && (
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '2px', background: 'var(--accent)', borderRadius: '1px 1px 0 0' }}
      />
    )}
  </button>
);

const SidebarSection: React.FC<{
  label: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  last?: boolean;
}> = ({ label, children, headerRight, last }) => (
  <div
    className="px-3 py-3"
    style={{ borderBottom: last ? undefined : '1px solid var(--separator)' }}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="sf-section-label mb-0">{label}</span>
      {headerRight}
    </div>
    {children}
  </div>
);

export default Sidebar;
