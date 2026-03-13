import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Trash2, Ruler, X, Minimize2 } from 'lucide-react';
import { useDraggable } from '../../hooks/useDraggable';

const ManualEditTable: React.FC = () => {
  const {
    annotations, deleteAnnotation, clearAnnotations,
    isManualEditActive, isManualEditPoppedOut, setManualEditPoppedOut,
    manualEditPosition, setManualEditPosition
  } = useAppStore();

  const { onMouseDown } = useDraggable(manualEditPosition, setManualEditPosition);

  if (!isManualEditActive || !isManualEditPoppedOut) return null;

  return (
    <div
      onMouseDown={onMouseDown}
      style={{ 
        left: `${manualEditPosition.x}px`, 
        top: `${manualEditPosition.y}px`,
        position: 'fixed'
      }}
      className="w-[400px] bg-[var(--bg-sidebar)] backdrop-blur-2xl border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-[500] pointer-events-auto cursor-default"
    >
      {/* Table Header */}
      <div className="bg-[var(--bg-surface2)] px-4 py-3 border-b border-[var(--border)] flex items-center justify-between cursor-move">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Ruler size={16} />
          <span className="text-[12px] font-black uppercase tracking-widest">Manual Measurements</span>
          <span className="bg-[var(--accent)] text-white text-[10px] px-2 py-0.5 rounded-full ml-1 font-mono font-bold">{annotations.length}</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setManualEditPoppedOut(false)}
            className="p-1.5 rounded-lg text-[var(--text4)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
            title="Dock to Sidebar"
          >
            <Minimize2 size={16} />
          </button>
          <button 
            onClick={() => setManualEditPoppedOut(false)}
            className="p-1.5 rounded-lg text-[var(--text4)] hover:text-[var(--mac-red)] hover:bg-[var(--mac-red)]/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[var(--bg-sidebar)] z-10">
            <tr className="text-[10px] text-[var(--text4)] uppercase font-black tracking-widest border-b border-[var(--separator)]">
              <th className="px-4 py-2.5 w-16 text-center">No.</th>
              <th className="px-4 py-2.5">Tool</th>
              <th className="px-4 py-2.5 text-right">Size (μm)</th>
              <th className="px-4 py-2.5 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--separator)]">
            {annotations.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-[12px] text-[var(--text4)] italic">
                  No measurements. Use tools to start.
                </td>
              </tr>
            ) : (
              [...annotations].reverse().map((ann, index) => (
                <tr key={ann.id} className="text-[13px] hover:bg-[var(--bg-hover)] transition-colors group">
                  <td className="px-4 py-2.5 text-center font-mono text-[var(--text3)]">{annotations.length - index}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: ann.color }}></div>
                      <span className="capitalize font-semibold text-[var(--text2)]">{ann.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-black font-mono text-[var(--accent-text)]">
                    {ann.diameter_um.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button 
                      onClick={() => deleteAnnotation(ann.id)}
                      className="p-1.5 rounded-lg text-[var(--text4)] hover:text-[var(--mac-red)] hover:bg-[var(--mac-red)]/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {annotations.length > 0 && (
        <div className="px-4 py-3 bg-[var(--bg-surface2)] border-t border-[var(--border)] flex justify-between items-center">
           <div className="text-[11px] text-[var(--text3)] font-medium">
              Avg: <span className="text-[var(--text1)] font-bold">{(annotations.reduce((acc, curr) => acc + curr.diameter_um, 0) / annotations.length).toFixed(2)} µm</span>
           </div>
           <button 
            onClick={clearAnnotations}
            className="text-[11px] font-bold text-[var(--mac-red)] hover:opacity-80 transition-all uppercase tracking-tight"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualEditTable;
