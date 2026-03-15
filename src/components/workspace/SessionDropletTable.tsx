import React, { useState, useEffect } from 'react';
import { X, Brain, Edit3, Filter, Trash2, BarChart2, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDraggable } from '../../hooks/useDraggable';

// WHO size categories for distribution
const WHO_BINS = [
  { label: '<10', min: 0,   max: 10,  color: 'var(--mac-red)'    },
  { label: '10–15', min: 10,  max: 15,  color: 'var(--mac-orange)' },
  { label: '15–20', min: 15,  max: 20,  color: 'var(--mac-green)'  },
  { label: '20–25', min: 20,  max: 25,  color: 'var(--accent-text)'},
  { label: '25–30', min: 25,  max: 30,  color: 'var(--mac-teal)'   },
  { label: '>30',   min: 30,  max: Infinity, color: 'var(--mac-red)' },
];

// WHO compliance: 10.00-30.00 (flexible up to 30.06)
const WHO_MIN = 10.00;
const WHO_MAX = 30.00;
const WHO_MAX_FLEXIBLE = 30.06; // Still pass if <= 30.06

const isWhoCompliant = (diameter: number): boolean => {
  return diameter >= WHO_MIN && diameter <= WHO_MAX_FLEXIBLE;
};

const SessionDropletTable: React.FC = () => {
  const {
    currentSessionDroplets,
    isSessionTablePoppedOut, setSessionTablePoppedOut,
    sessionTablePosition, setSessionTablePosition,
    activeSlideId, slides,
    removeSessionDroplet, removeSessionDroplets,
    snapshotSourceFilter, setSnapshotSourceFilter,
  } = useAppStore();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [snapshotSourceFilter]);

  const { onMouseDown } = useDraggable(sessionTablePosition, setSessionTablePosition);
  if (!isSessionTablePoppedOut) return null;

  // Get all droplets from active slide (not just current session)
  const activeSlide = slides.find(s => s.id === activeSlideId);
  const slideDroplets = activeSlide?.droplets || [];
  
  // Combine with current session droplets (for real-time AI data)
  // Show slide data if available, otherwise show session data
  const displayData = slideDroplets.length > 0 
    ? slideDroplets.map((diameter, idx) => ({
        id: idx + 1,
        diameter,
        source: 'Slide' as const
      }))
    : currentSessionDroplets;

  // Source filter
  const filteredData = snapshotSourceFilter === 'all'
    ? displayData
    : displayData.filter(d => d.source.toLowerCase() === snapshotSourceFilter);

  const aiCount      = displayData.filter(d => d.source === 'AI').length;
  const manualCount  = displayData.filter(d => d.source === 'Manual').length;
  const slideCount   = displayData.filter(d => d.source === 'Slide').length;
  const inRangeCount = filteredData.filter(d => isWhoCompliant(d.diameter)).length;
  const total        = filteredData.length;
  const totalAll     = displayData.length;

  // WHO Compliance: Pass if VMD 10-30 and SPAN ≤ 2.0 (based on all data, not filtered)
  const vmd = totalAll > 0
    ? (() => {
        const sorted = [...displayData.map(d => d.diameter)].sort((a, b) => a - b);
        const vols = sorted.map(d => (Math.PI / 6) * Math.pow(d, 3));
        const totalVol = vols.reduce((a, b) => a + b, 0);
        if (!totalVol) return 0;
        const cumVol: number[] = [];
        let running = 0;
        for (const v of vols) { running += v / totalVol; cumVol.push(running); }
        const idx50 = cumVol.findIndex(c => c >= 0.5);
        return sorted[idx50 >= 0 ? idx50 : 0] ?? 0;
      })()
    : 0;
  
  const sessionWhoPass = totalAll >= 10 && vmd >= WHO_MIN && vmd <= WHO_MAX;
  const sessionWhoColor = sessionWhoPass ? 'var(--mac-green)' : 'var(--mac-orange)';
  const sessionWhoText = sessionWhoPass ? 'Pass' : 'Review';

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(d => d.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    // Separate slide IDs from session IDs
    const slideIdsToDelete = filteredData
      .filter(d => d.source === 'Slide' && selectedIds.has(d.id))
      .map(d => d.id);
    const sessionIdsToDelete = filteredData
      .filter(d => d.source !== 'Slide' && selectedIds.has(d.id))
      .map(d => d.id);

    // Remove slide droplets by index
    if (slideIdsToDelete.length > 0) {
      const store = useAppStore.getState();
      const slide = store.slides.find(s => s.id === store.activeSlideId);
      if (slide) {
        // slideIdsToDelete are 1-based indices; remove from highest to lowest to preserve indices
        const indices = slideIdsToDelete.map(id => id - 1).sort((a, b) => b - a);
        const newDroplets = [...slide.droplets];
        indices.forEach(idx => newDroplets.splice(idx, 1));
        useAppStore.setState(state => ({
          slides: state.slides.map(s =>
            s.id === state.activeSlideId
              ? { ...s, droplets: newDroplets }
              : s
          ),
          isDirty: true,
        }));
      }
    }

    // Remove session (AI/Manual) droplets
    if (sessionIdsToDelete.length > 0) {
      removeSessionDroplets(sessionIdsToDelete);
    }

    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  // Compute distribution
  const binCounts = WHO_BINS.map(b =>
    filteredData.filter(d => d.diameter >= b.min && d.diameter < b.max).length
  );
  const maxBin = Math.max(1, ...binCounts);

  return (
    <div
      style={{ left: `${sessionTablePosition.x}px`, top: `${sessionTablePosition.y}px`, position: 'fixed' }}
      className="z-[100] w-[360px] bg-[var(--bg-window)] rounded-[5px] mac-dialog-shadow border border-[var(--border-strong)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto"
    >
      {/* ── Header ─── */}
      <div
        onMouseDown={onMouseDown}
        className="h-9 bg-[var(--bg-surface2)] border-b border-[var(--border)] flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-2">
          <BarChart2 size={13} style={{ color: 'var(--accent-text)' }} />
          <span className="font-instrument text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text1)' }}>
            Session Data
          </span>
          {activeSlide && (
            <span
              className="font-instrument text-[9px] px-1.5 py-0.5 rounded-[2px] border"
              style={{ color: 'var(--accent-text)', borderColor: 'var(--border)', background: 'var(--bg-active)' }}
            >
              {activeSlide.name}
            </span>
          )}
          {total > 0 && (
            <span
              className="font-instrument text-[9px] px-1.5 py-0.5 rounded-[2px] border font-bold"
              style={{ color: sessionWhoColor, borderColor: `${sessionWhoColor}40`, background: `${sessionWhoColor}0f` }}
            >
              WHO: {sessionWhoText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Select mode toggle */}
          {total > 0 && (
            <button
              onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }}
              className="w-5 h-5 rounded-[3px] flex items-center justify-center transition-all"
              style={{ color: isSelectMode ? 'var(--accent-text)' : 'var(--text3)', background: isSelectMode ? 'var(--bg-active)' : '' }}
              title={isSelectMode ? 'Exit select mode' : 'Select multiple'}
            >
              <CheckSquare size={11} />
            </button>
          )}
          {/* Delete selected */}
          {isSelectMode && selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-0.5 px-1.5 h-5 rounded-[3px] text-[9px] font-bold transition-all"
              style={{ background: 'rgba(255,79,106,0.12)', color: 'var(--mac-red)' }}
              title={`Delete ${selectedIds.size} selected`}
            >
              <Trash2 size={9} />
              {selectedIds.size}
            </button>
          )}
          <button
            onClick={() => setSessionTablePoppedOut(false)}
            className="w-5 h-5 rounded-[3px] flex items-center justify-center transition-all"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={e => { (e.target as HTMLElement).closest('button')!.style.background = 'rgba(255,79,106,0.15)'; (e.target as HTMLElement).closest('button')!.style.color = 'var(--mac-red)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).closest('button')!.style.background = ''; (e.target as HTMLElement).closest('button')!.style.color = 'var(--text3)'; }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ── Stats strip ─── */}
      <div className="grid grid-cols-4 border-b" style={{ borderColor: 'var(--separator)' }}>
        <StatCell label="Total" value={totalAll} color="var(--text1)" />
        <StatCell label="AI" value={aiCount} color="var(--accent-text)" dimBg="var(--bg-active)" sep />
        <StatCell label="Manual" value={manualCount} color="var(--mac-orange)" dimBg="rgba(249,115,22,0.06)" sep />
        <StatCell label="Slide" value={slideCount} color="var(--mac-teal)" dimBg="rgba(20,184,166,0.06)" sep />
      </div>

      {/* ── Source filter ─── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b" style={{ borderColor: 'var(--separator)', background: 'var(--bg-surface)' }}>
        <Filter size={9} style={{ color: 'var(--text4)' }} />
        <span className="font-instrument text-[8px] uppercase tracking-[0.1em] mr-1" style={{ color: 'var(--text4)' }}>Source:</span>
        {(['all', 'ai', 'manual'] as const).map(f => (
          <button
            key={f}
            onClick={() => setSnapshotSourceFilter(f)}
            className="font-instrument text-[9px] font-bold px-2 py-0.5 rounded-[3px] transition-all border"
            style={{
              background: snapshotSourceFilter === f ? 'var(--bg-active)' : 'transparent',
              borderColor: snapshotSourceFilter === f ? 'var(--accent)' : 'var(--border)',
              color: snapshotSourceFilter === f ? 'var(--accent-text)' : 'var(--text3)',
            }}
          >
            {f === 'all' ? `All (${totalAll})` : f === 'ai' ? `AI (${aiCount})` : `Manual (${manualCount})`}
          </button>
        ))}
      </div>

      {/* ── Size distribution mini-chart ─── */}
      {total > 0 && (
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--separator)', background: 'var(--bg-surface)' }}>
          <div className="font-instrument text-[8px] uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--text4)' }}>
            Size Distribution
          </div>
          <div className="flex items-end gap-0.5 h-8">
            {WHO_BINS.map((b, i) => {
              const pct = binCounts[i] / maxBin;
              return (
                <div key={b.label} className="flex flex-col items-center flex-1 gap-0.5 group" title={`${b.label} µm: ${binCounts[i]}`}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(2, pct * 100)}%`,
                    background: pct > 0 ? b.color : 'var(--border)',
                    opacity: pct > 0 ? 0.85 : 0.3,
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s',
                  }} />
                  <span className="font-instrument text-[7px] leading-none" style={{ color: 'var(--text4)' }}>{binCounts[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-0.5 px-0.5">
            {WHO_BINS.map(b => (
              <span key={b.label} className="font-instrument text-[6.5px]" style={{ color: 'var(--text4)', flex: 1, textAlign: 'center' }}>{b.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '260px', background: 'var(--bg-surface)' }}>
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-surface2)' }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {isSelectMode && (
                <th className="w-6 px-1 py-1.5">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center w-full">
                    {selectedIds.size === filteredData.length && selectedIds.size > 0
                      ? <CheckSquare size={11} style={{ color: 'var(--accent-text)' }} />
                      : <SquareIcon size={11} style={{ color: 'var(--text4)' }} />
                    }
                  </button>
                </th>
              )}
              <th className="px-2 py-1.5 text-left w-8">
                <span className="font-instrument text-[8px] uppercase tracking-widest" style={{ color: 'var(--text4)' }}>ID</span>
              </th>
              <th className="px-2 py-1.5 text-right">
                <span className="font-instrument text-[8px] uppercase tracking-widest" style={{ color: 'var(--text4)' }}>Size (µm)</span>
              </th>
              <th className="px-2 py-1.5 text-center">
                <span className="font-instrument text-[8px] uppercase tracking-widest" style={{ color: 'var(--text4)' }}>WHO</span>
              </th>
              <th className="px-2 py-1.5 text-center">
                <span className="font-instrument text-[8px] uppercase tracking-widest" style={{ color: 'var(--text4)' }}>Source</span>
              </th>
              <th className="w-8 px-1" />
            </tr>
          </thead>
          <tbody>
            {total === 0 ? (
              <tr>
                <td colSpan={isSelectMode ? 6 : 5} className="px-3 py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <BarChart2 size={20} style={{ color: 'var(--text4)', opacity: 0.4 }} />
                    <span className="font-instrument text-[10px]" style={{ color: 'var(--text4)' }}>No data captured yet</span>
                    <span className="font-instrument text-[9px]" style={{ color: 'var(--text4)', opacity: 0.6 }}>Start AI or take a snapshot</span>
                  </div>
                </td>
              </tr>
            ) : (
              [...filteredData].reverse().map((d, idx) => {
                const isOut = !isWhoCompliant(d.diameter);
                const rowNum = total - idx;
                const isSelected = selectedIds.has(d.id);
                return (
                  <tr
                    key={`${d.source}-${d.id}-${idx}`}
                    className="group transition-colors border-b border-[var(--separator)] hover:bg-[var(--bg-hover)]"
                    style={{
                      background: isSelected ? 'var(--bg-active)' : rowNum % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface2)',
                    }}
                    onClick={isSelectMode ? () => toggleSelect(d.id) : undefined}
                  >
                    {isSelectMode && (
                      <td className="w-6 px-1 py-1.5 text-center">
                        {isSelected
                          ? <CheckSquare size={11} style={{ color: 'var(--accent-text)' }} />
                          : <SquareIcon size={11} style={{ color: 'var(--text4)' }} />
                        }
                      </td>
                    )}
                    <td className="px-2 py-1.5 text-left font-instrument text-[9px]" style={{ color: 'var(--text4)' }}>
                      {rowNum}
                    </td>
                    <td className="px-2 py-1.5 text-right font-instrument font-semibold text-[10.5px]" style={{ color: isOut ? 'var(--mac-red)' : 'var(--accent-text)' }}>
                      {d.diameter.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span
                        className="font-instrument text-[9px] font-bold px-1.5 py-0.5 rounded-[2px]"
                        style={{
                          background: isOut ? 'rgba(255,79,106,0.1)' : 'rgba(34,197,94,0.1)',
                          color: isOut ? 'var(--mac-red)' : 'var(--mac-green)',
                        }}
                      >
                        {isOut ? '✗' : '✓'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {d.source === 'AI' ? (
                          <Brain size={9} style={{ color: 'var(--accent-text)' }} />
                        ) : d.source === 'Manual' ? (
                          <Edit3 size={9} style={{ color: 'var(--mac-orange)' }} />
                        ) : (
                          <BarChart2 size={9} style={{ color: 'var(--mac-teal)' }} />
                        )}
                        <span
                          className="font-instrument text-[9px] font-bold"
                          style={{ color: d.source === 'AI' ? 'var(--accent-text)' : d.source === 'Manual' ? 'var(--mac-orange)' : 'var(--mac-teal)' }}
                        >
                          {d.source}
                        </span>
                      </div>
                    </td>
                    <td className="px-1 py-1 w-8">
                      {!isSelectMode && (
                        <button
                          onClick={() => {
                            if (d.source === 'Slide') {
                              // Remove from slide droplets — splice inside updater to avoid stale state
                              const deleteIdx = d.id - 1; // d.id is 1-based index
                              useAppStore.setState(state => {
                                const slide = state.slides.find(s => s.id === state.activeSlideId);
                                if (!slide) return state;
                                const newDroplets = [...slide.droplets];
                                newDroplets.splice(deleteIdx, 1);
                                return {
                                  slides: state.slides.map(s =>
                                    s.id === state.activeSlideId
                                      ? { ...s, droplets: newDroplets }
                                      : s
                                  ),
                                  isDirty: true,
                                };
                              });
                            } else {
                              removeSessionDroplet(d.id);
                            }
                          }}
                          title="Remove"
                          className="w-5 h-5 flex items-center justify-center rounded-[3px] opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: 'var(--text4)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,79,106,0.12)'; (e.currentTarget as HTMLElement).style.color = 'var(--mac-red)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─── */}
      <div
        className="h-8 flex items-center px-3 justify-between shrink-0"
        style={{ background: 'var(--bg-surface2)', borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-1.5">
          <Filter size={9} style={{ color: 'var(--text4)' }} />
          <span className="font-instrument text-[9px] uppercase" style={{ color: 'var(--text4)' }}>
            WHO: {WHO_MIN.toFixed(2)}–{WHO_MAX.toFixed(2)} µm
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: inRangeCount > 0 ? 'var(--mac-green)' : 'var(--text4)' }} />
          <span className="font-instrument text-[9px] font-bold" style={{ color: inRangeCount > 0 ? 'var(--mac-green)' : 'var(--text4)' }}>
            {inRangeCount} / {total} in range
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Sub-component ──────────────────────────────────────────────────────────────
const StatCell: React.FC<{
  label: string; value: number; color: string; dimBg?: string; sep?: boolean;
}> = ({ label, value, color, dimBg, sep }) => (
  <div
    className="flex flex-col items-center py-2 gap-0.5"
    style={{
      background: dimBg || 'var(--bg-surface)',
      borderLeft: sep ? '1px solid var(--separator)' : undefined,
    }}
  >
    <span className="font-instrument text-[8px] uppercase tracking-[0.12em]" style={{ color: 'var(--text4)' }}>
      {label}
    </span>
    <span className="font-instrument text-[18px] font-bold leading-none tabular-nums" style={{ color }}>
      {value}
    </span>
  </div>
);

export default SessionDropletTable;
