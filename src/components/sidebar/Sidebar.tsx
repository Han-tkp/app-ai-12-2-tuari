import React, { useState } from 'react';
import {
  Camera, LayoutDashboard,
  RotateCcw, Play, Square,
  Camera as CameraIcon, Filter,
  Plus, Download, ChevronDown, Layers, RefreshCcw, Trash2,
} from 'lucide-react';

// Compute volume-weighted stats for a slide's droplet array (mirrors backend logic)
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
  } = useAppStore();
  const [isSlideSelectOpen, setSlideSelectOpen] = useState(false);


  const activeSlide = slides.find(s => s.id === activeSlideId);

  const handleExport = () => {
    if (mode === 'Report') {
      triggerSave();
    } else {
      window.dispatchEvent(new CustomEvent('send-backend-command', { detail: { action: 'export_excel' } }));
    }
  };

  const handleSnapshot = () => {
    if (!isCameraRunning) return;
    window.dispatchEvent(new CustomEvent('send-backend-command', { detail: { action: 'take_snapshot' } }));
  };

  const handleAddToSlide = () => {
    fetchSessionAndAddToSlide();
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
    <div className="flex flex-col h-full transition-colors">
      <div className="flex px-2.5 pt-2 gap-0.5 border-b border-[var(--separator)] shrink-0">
        <SidebarTab active={mode === 'Analyze'} onClick={() => setMode('Analyze')} icon={<Camera size={12} />} label="Analyze" />
        <SidebarTab active={mode === 'Report'} onClick={() => setMode('Report')} icon={<LayoutDashboard size={12} />} label="Report" />
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll p-3.5 space-y-4 font-sans">
        {mode === 'Analyze' ? (
          <>
            {/* Objective Lens Section */}
            <section>
              <div className="sf-section-label">Objective Lens</div>
              <div className="relative">
                <select 
                  value={objectiveLens} 
                  onChange={(e) => setObjectiveLens(e.target.value as '4x' | '10x')} 
                  className="mac-select"
                >
                  <option value="10x">10x Lens (High-Res)</option>
                  <option value="4x">4x Lens (Precision)</option>
                </select>
              </div>
            </section>

            {/* Camera Controls */}
            <section className="grid grid-cols-12 gap-1.5">
              <button 
                onClick={toggleCamera} 
                className={`col-span-8 h-10 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border flex items-center justify-center gap-2 ${isCameraRunning ? 'bg-[var(--mac-red)]/10 text-[var(--mac-red)] border-[var(--mac-red)]/30 hover:bg-[var(--mac-red)]/20' : 'bg-[var(--mac-green)]/10 text-[var(--mac-green)] border-[var(--mac-green)]/30 hover:bg-[var(--mac-green)]/20'}`}
              >
                {isCameraRunning ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                <span>{isCameraRunning ? 'Stop Camera' : 'Start Camera'}</span>
              </button>
              
              <button 
                onClick={switchCamera} 
                disabled={!isCameraRunning} 
                className="col-span-4 h-10 rounded-xl bg-[var(--bg-surface2)] border border-[var(--border)] text-[var(--text2)] disabled:opacity-20 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw size={14} />
                <span className="text-[9px] font-black">SW</span>
              </button>
            </section>

            <div className="h-px bg-[var(--separator)] my-1 opacity-50"></div>

            {/* AI Detection Controls */}
            <section className="space-y-1.5">
              <div className="sf-section-label">AI Inference Engine</div>
              <button 
                onClick={() => setAIRunning(!isAIRunning)} 
                disabled={!isCameraRunning} 
                className={`w-full h-11 rounded-xl font-black uppercase text-[11px] transition-all flex items-center justify-center gap-3 border shadow-lg ${!isCameraRunning ? 'bg-[var(--bg-surface2)] border-[var(--border)] text-[var(--text4)] cursor-not-allowed' : isAIRunning ? 'bg-[var(--mac-orange)] text-[var(--bg-window)] border-[var(--mac-orange)] animate-pulse' : 'bg-[var(--bg-surface)] text-[var(--mac-orange)] border-[var(--mac-orange)]/40 hover:bg-[var(--mac-orange)]/5'}`}
              >
                {isAIRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                <span>{isAIRunning ? 'Stop Live AI' : `Start Live AI (${hotkeyLiveAI})`}</span>
              </button>

              <button 
                onClick={handleSnapshot}
                disabled={!isCameraRunning}
                className="w-full h-10 bg-[var(--bg-surface2)] border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text1)] hover:bg-[var(--bg-surface3)] flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-20"
              >
                <CameraIcon size={14} />
                <span className="font-bold uppercase text-[10px] tracking-wide">Take Snapshot ({hotkeySnapshot})</span>
              </button>
            </section>

            <div className="h-px bg-[var(--separator)] my-1 opacity-50"></div>

            {/* Action Buttons in Analyze Mode */}
            <section className="space-y-2 pt-1">
              <button 
                onClick={handleAddToSlide}
                className="w-full h-11 rounded-xl bg-[var(--mac-green)]/10 text-[var(--mac-green)] border border-[var(--mac-green)]/30 font-black uppercase text-[10px] tracking-widest hover:bg-[var(--mac-green)]/20 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Plus size={14} /> Add Data to Slide
              </button>
              <button 
                onClick={handleExport}
                className="w-full h-10 rounded-xl bg-[var(--bg-surface2)] border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text1)] hover:bg-[var(--bg-surface3)] flex items-center justify-center gap-2 transition-all font-bold uppercase text-[10px]"
              >
                <Download size={14} /> Quick Export Excel
              </button>
            </section>

          </>
        ) : (
          <>
            {/* ── Report Dashboard ── */}
            <section className="space-y-2">
              <div className="sf-section-label">Slide Summary</div>
              <div className="bg-[var(--bg-surface2)] rounded-xl border border-[var(--border)] overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[var(--bg-surface3)] text-[9px] font-black uppercase tracking-tighter text-[var(--text4)] border-b border-[var(--border)]">
                    <tr>
                      <th className="px-2 py-1.5">Slide</th>
                      <th className="px-2 py-1.5 text-right">VMD</th>
                      <th className="px-2 py-1.5 text-right">Span</th>
                      <th className="px-2 py-1.5 text-right">n</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--separator)]">
                    {slides.map((s, i) => {
                      const stats = computeSlideStats(s.droplets);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setActiveSlideId(s.id)}
                          className={`cursor-pointer transition-colors hover:bg-[var(--bg-hover)] ${activeSlideId === s.id ? 'bg-[var(--bg-active)]' : ''}`}
                        >
                          <td className="px-2 py-1.5 font-bold text-[var(--text2)] flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-[var(--accent)]/10 text-[var(--accent-text)] flex items-center justify-center text-[8px] font-black shrink-0">{i + 1}</span>
                            <span className="truncate max-w-[60px]">{s.name}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono font-bold text-[var(--text1)]">
                            {stats.count > 0 ? stats.vmd.toFixed(1) : '—'}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-[var(--text2)]">
                            {stats.count > 0 ? stats.span.toFixed(2) : '—'}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-[var(--text3)]">{stats.count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Active slide sorted data */}
              {activeSlideId && (() => {
                const slide = slides.find(s => s.id === activeSlideId);
                if (!slide || slide.droplets.length === 0) return null;
                const sorted = [...slide.droplets].sort((a, b) => a - b);
                return (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-surface2)] px-3 py-1.5 border-b border-[var(--border)] flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text3)]">{slide.name} — sorted ↑</span>
                      <span className="text-[9px] font-bold text-[var(--accent)]">{sorted.length} drops</span>
                    </div>
                    <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-[10.5px]">
                        <tbody className="divide-y divide-[var(--separator)]">
                          {sorted.map((d, idx) => (
                            <tr key={idx} className="hover:bg-[var(--bg-hover)]">
                              <td className="px-3 py-1 text-[var(--text4)] font-mono">{idx + 1}</td>
                              <td className="px-3 py-1 font-bold text-[var(--accent-text)] text-right">
                                {d.toFixed(1)} µm
                              </td>
                              <td className="px-3 py-1 text-right">
                                <div
                                  className="inline-block h-1.5 rounded-full bg-[var(--accent)]/40"
                                  style={{ width: `${Math.min(60, (d / 30) * 60)}px` }}
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
            </section>

            <div className="h-px bg-[var(--separator)] my-1 opacity-50" />

            {/* Report Mode - Filter Card */}
            <section className="sf-card shadow-sm">
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-[var(--text2)] font-black uppercase text-[9px] tracking-widest">
                  <Filter size={12} />
                  <span>Filter Size (µm)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] text-[var(--text4)] px-1 uppercase font-bold">Min</span>
                    <input type="number" value={filterMin} onChange={(e) => handleFilterMin(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-[13px] text-[var(--text1)] font-mono outline-none focus:border-[var(--accent)] transition-all" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-[var(--text4)] px-1 uppercase font-bold">Max</span>
                    <input type="number" value={filterMax} onChange={(e) => handleFilterMax(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-[13px] text-[var(--text1)] font-mono outline-none focus:border-[var(--accent)] transition-all" />
                  </div>
                </div>
                <div className="bg-[var(--bg-active)] text-[var(--accent-text)] text-center py-1.5 rounded-lg text-[10px] font-black font-mono border border-[var(--accent-text)]/20 uppercase tracking-tighter transition-colors">
                  WHO Criteria: {filterMin} – {filterMax} µm
                </div>
              </div>
            </section>

            {/* Advanced Slide Selection */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="sf-section-label mb-0">Slide History ({slides.length})</div>
                <button onClick={addSlide} className="text-[var(--accent)] hover:opacity-80 transition-all flex items-center gap-1 font-bold text-[10px] uppercase">
                  <Plus size={12} strokeWidth={3} /> Add Slide
                </button>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setSlideSelectOpen(!isSlideSelectOpen)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-left flex items-center justify-between hover:bg-[var(--bg-surface2)] transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                      <Layers size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12.5px] font-bold text-[var(--text1)]">{activeSlide?.name || "Select a Slide"}</span>
                      <span className="text-[10px] text-[var(--text4)] font-medium uppercase tracking-widest">{activeSlide ? `${activeSlide.droplets.length} drops captured` : "Choose destination"}</span>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-[var(--text4)] transition-transform duration-300 ${isSlideSelectOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSlideSelectOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSlideSelectOpen(false)}></div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-sidebar)] backdrop-blur-2xl border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5">
                        {slides.length === 0 ? (
                          <div className="py-6 text-center text-[11px] text-[var(--text4)] italic">No slides defined.</div>
                        ) : (
                          slides.map((s) => (
                            <div 
                              key={s.id}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group ${activeSlideId === s.id ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'}`}
                            >
                              <button 
                                onClick={() => { setActiveSlideId(s.id); setSlideSelectOpen(false); }}
                                className="flex-1 flex items-center gap-3"
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeSlideId === s.id ? 'bg-[var(--accent)]' : 'bg-[var(--text4)]'}`}></div>
                                <div className="flex flex-col text-left">
                                  <span className={`text-[12px] font-bold ${activeSlideId === s.id ? 'text-[var(--accent-text)]' : 'text-[var(--text1)]'}`}>{s.name}</span>
                                  <span className="text-[9px] text-[var(--text4)] font-medium uppercase tracking-tighter">{s.status} · {s.droplets.length} droplets</span>
                                </div>
                              </button>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); retakeSlide(s.id); setSlideSelectOpen(false); }}
                                  className="p-1.5 rounded-lg text-[var(--text4)] hover:text-[var(--accent)] hover:bg-[var(--bg-active)] opacity-0 group-hover:opacity-100 transition-all"
                                  title="Retake Slide"
                                >
                                  <RefreshCcw size={14} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeSlide(s.id); }}
                                  className="p-1.5 rounded-lg text-[var(--text4)] hover:text-[var(--mac-red)] hover:bg-[var(--mac-red)]/10 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Delete Slide"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Target Sampling Size */}
            <section className="space-y-2 pt-2">
              <div className="sf-section-label">Target Sampling Size</div>
              <div className="flex items-center bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-xl overflow-hidden shadow-inner h-10 transition-colors">
                <button onClick={() => setTargetSize(Math.max(1, targetSize - 1))} className="w-10 h-full flex items-center justify-center hover:bg-[var(--bg-surface2)] text-[var(--text3)] transition-colors border-r border-[var(--border-strong)] font-black text-xs">－</button>
                <input 
                  type="text" 
                  value={targetSize} 
                  onChange={(e) => handleTargetSizeChange(e.target.value)}
                  className="flex-1 text-center text-[15px] font-black font-mono text-[var(--accent)] bg-transparent outline-none w-full"
                />
                <button onClick={() => setTargetSize(targetSize + 1)} className="w-10 h-full flex items-center justify-center hover:bg-[var(--bg-surface2)] text-[var(--text3)] transition-colors border-l border-[var(--border-strong)] font-black text-xs">＋</button>
              </div>
              <p className="text-[9px] text-[var(--text4)] px-1 leading-relaxed italic opacity-70">* AI will select {targetSize} droplets based on WHO criteria distribution.</p>
            </section>

            {/* Action Buttons */}
            <section className="space-y-3 pt-2">
              <button 
                onClick={handleAddToSlide}
                className="w-full h-11 rounded-xl bg-[var(--mac-green)]/10 text-[var(--mac-green)] border border-[var(--mac-green)]/30 font-black uppercase text-[10px] tracking-widest hover:bg-[var(--mac-green)]/20 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Plus size={14} /> Add Data to Slide
              </button>
              
              <button 
                onClick={handleExport}
                className="w-full h-12 rounded-xl bg-[var(--accent)] text-white font-black uppercase text-[12px] tracking-[0.1em] hover:brightness-110 shadow-xl shadow-[var(--accent)]/30 transition-all flex items-center justify-center gap-3 mt-1 active:scale-95"
              >
                <Download size={18} />
                Export Excel Report
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
};


const SidebarTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-t-xl transition-all relative text-[11px] font-black uppercase tracking-tighter ${active ? 'bg-[var(--bg-active)] text-[var(--accent-text)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`}
  >
    {icon}
    <span>{label}</span>
    {active && <div className="absolute bottom-[-0.5px] left-[15%] right-[15%] h-[2.5px] bg-[var(--accent-text)] rounded-t-full shadow-[0_-2px_10px_rgba(10,132,255,0.5)]"></div>}
  </button>
);

export default Sidebar;
