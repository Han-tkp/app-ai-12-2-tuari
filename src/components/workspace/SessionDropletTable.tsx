import React from 'react';
import { X, Box, Brain, Edit3, Filter, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDraggable } from '../../hooks/useDraggable';

const SessionDropletTable: React.FC = () => {
  const {
    currentSessionDroplets,
    isSessionTablePoppedOut, setSessionTablePoppedOut,
    sessionTablePosition, setSessionTablePosition,
    filterMin, filterMax,
    activeSlideId, slides,
    removeSessionDroplet,
  } = useAppStore();

  const { onMouseDown } = useDraggable(sessionTablePosition, setSessionTablePosition);

  if (!isSessionTablePoppedOut) return null;

  const activeSlide = slides.find(s => s.id === activeSlideId);
  const aiCount = currentSessionDroplets.filter(d => d.source === 'AI').length;
  const manualCount = currentSessionDroplets.filter(d => d.source === 'Manual').length;
  const inRangeCount = currentSessionDroplets.filter(d => d.diameter >= filterMin && d.diameter <= filterMax).length;

  return (
    <div
      style={{ left: `${sessionTablePosition.x}px`, top: `${sessionTablePosition.y}px`, position: 'fixed' }}
      className="z-[900] w-[360px] h-[490px] bg-[var(--bg-window)] rounded-2xl mac-dialog-shadow border border-[var(--border)] flex flex-col overflow-hidden select-none animate-in zoom-in-95 duration-200"
    >
      {/* ── Header / drag handle ─── */}
      <div
        onMouseDown={onMouseDown}
        className="h-10 bg-[var(--bg-surface2)] border-b border-[var(--border)] flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white shrink-0">
            <Box size={14} />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-[var(--text1)] leading-none">
              Session Data
            </div>
            <div className="text-[9px] text-[var(--text4)] font-medium leading-none mt-0.5">
              {activeSlide ? activeSlide.name : 'No slide selected'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setSessionTablePoppedOut(false)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text3)] hover:bg-[var(--mac-red)]/10 hover:text-[var(--mac-red)] transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Stats strip ─── */}
      <div className="px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--separator)] grid grid-cols-3 gap-2 shrink-0">
        <div className="bg-[var(--bg-surface2)] rounded-lg p-2 border border-[var(--border)]">
          <p className="text-[8px] font-bold text-[var(--text4)] uppercase mb-0.5">Total</p>
          <p className="text-[15px] font-black text-[var(--text1)] font-mono">{currentSessionDroplets.length}</p>
        </div>
        <div className="bg-[var(--accent)]/8 rounded-lg p-2 border border-[var(--accent)]/20">
          <p className="text-[8px] font-bold text-[var(--accent-text)] uppercase mb-0.5">AI</p>
          <p className="text-[15px] font-black text-[var(--accent-text)] font-mono">{aiCount}</p>
        </div>
        <div className="bg-[var(--mac-orange)]/10 rounded-lg p-2 border border-[var(--mac-orange)]/20">
          <p className="text-[8px] font-bold text-[var(--mac-orange)] uppercase mb-0.5">Manual</p>
          <p className="text-[15px] font-black text-[var(--mac-orange)] font-mono">{manualCount}</p>
        </div>
      </div>

      {/* ── Table ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-surface)]">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-[var(--bg-surface2)] text-[9px] font-black uppercase tracking-tighter text-[var(--text3)] border-b border-[var(--border)] z-10">
            <tr>
              <th className="px-3 py-2 text-left w-10">#</th>
              <th className="px-3 py-2 text-right">Size (µm)</th>
              <th className="px-3 py-2 text-center">Type</th>
              <th className="px-1 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--separator)]">
            {currentSessionDroplets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-[10px] text-[var(--text4)] italic">
                  No data captured yet.
                </td>
              </tr>
            ) : (
              [...currentSessionDroplets].reverse().map((d, idx) => {
                const isOutOfRange = d.diameter < filterMin || d.diameter > filterMax;
                return (
                  <tr
                    key={`${d.source}-${d.id}`}
                    className={`hover:bg-[var(--bg-hover)] transition-colors group ${isOutOfRange ? 'opacity-40' : ''}`}
                  >
                    <td className="px-3 py-1.5 font-mono text-[var(--text4)] text-[10px]">
                      {currentSessionDroplets.length - idx}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-black font-mono ${isOutOfRange ? 'text-[var(--mac-red)] line-through' : 'text-[var(--text1)]'}`}>
                      {d.diameter.toFixed(1)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {d.source === 'AI' ? (
                          <>
                            <Brain size={9} className="text-[var(--accent)] shrink-0" />
                            <span className="text-[9px] font-bold text-[var(--accent-text)]">AI</span>
                          </>
                        ) : (
                          <>
                            <Edit3 size={9} className="text-[var(--mac-orange)] shrink-0" />
                            <span className="text-[9px] font-bold text-[var(--mac-orange)]">Manual</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-1 py-1.5">
                      <button
                        onClick={() => removeSessionDroplet(d.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text4)] hover:text-[var(--mac-red)] hover:bg-[var(--mac-red)]/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove"
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─── */}
      <div className="h-8 bg-[var(--bg-surface2)] border-t border-[var(--border)] flex items-center px-3 justify-between shrink-0">
        <div className="flex items-center gap-1">
          <Filter size={10} className="text-[var(--text4)]" />
          <span className="text-[9px] font-bold text-[var(--text4)] uppercase">{filterMin}–{filterMax} µm</span>
        </div>
        <span className="text-[9px] font-medium text-[var(--accent-text)]">
          {inRangeCount} WHO match
        </span>
      </div>
    </div>
  );
};

export default SessionDropletTable;
