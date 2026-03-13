import React from 'react';
import { useAppStore } from '../../store/useAppStore';

const PROFILE_COLOR: Record<string, string> = {
  low: 'var(--mac-orange)',
  mid: '#f5a623',
  high: 'var(--mac-green)',
};

const TopDashboard: React.FC = () => {
  const { 
    targetSize, vmd, accumulated, span, outOfBounds, hardwareProfile, currentSessionDroplets
  } = useAppStore();

  return (
    <div className="flex h-full items-center px-4 transition-colors">
      <div className="flex items-center gap-2 pr-4 border-r border-[var(--separator)] h-full shrink-0">
        <div className="bg-[var(--bg-surface2)] border border-[var(--border)] px-2.5 py-1 rounded-[7px] text-[12px] font-bold text-[var(--text3)] font-mono">
          N/A
        </div>
        <div className="flex flex-col">
          <span className="text-[9.5px] text-[var(--text4)] uppercase tracking-widest font-semibold leading-none mb-1">Current Slide</span>
          <span className="text-[11.5px] text-[var(--text3)] font-medium leading-none">—</span>
        </div>
        <div className="w-[0.5px] h-6 bg-[var(--separator)] mx-2"></div>
        <div className="flex flex-col">
          <span className="text-[9.5px] text-[var(--text4)] uppercase tracking-widest font-semibold leading-none mb-1">Status</span>
          <span className="text-[11.5px] text-[var(--text3)] font-medium leading-none">—</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-evenly px-4">
        <MetricItem label="Target Size" value={targetSize?.toString() || "0"} color="var(--mac-orange)" />
        <MetricSep />
        <MetricItem label="VMD (Dv0.5)" value={(vmd || 0).toFixed(2)} color="var(--mac-teal)" />
        <MetricSep />
        <MetricItem label="In-Frame" value={currentSessionDroplets?.length?.toString() || "0"} />
        <MetricSep />
        <MetricItem label="Accumulated" value={accumulated?.toString() || "0"} />
        <MetricSep />
        <MetricItem label="Span" value={(span || 0).toFixed(2)} />
        <MetricSep />
        <MetricItem label="Out-of-Bounds" value={(outOfBounds || 0).toFixed(1) + "%"} color="var(--mac-red)" />
      </div>

      <div className="flex items-center gap-1.5 bg-[var(--bg-active)] border px-3 py-1 rounded-full shrink-0 ml-4 shadow-sm" style={{ borderColor: `${PROFILE_COLOR[hardwareProfile] ?? 'var(--mac-teal)'}4d` }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: PROFILE_COLOR[hardwareProfile] ?? 'var(--mac-teal)' }}></div>
        <span className="font-black italic text-[10px] uppercase tracking-widest" style={{ color: PROFILE_COLOR[hardwareProfile] ?? 'var(--mac-teal)' }}>
          {hardwareProfile}
        </span>
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-center">
    <span className="text-[9.5px] text-[var(--text4)] uppercase tracking-[0.08em] font-black leading-none mb-1.5">{label}</span>
    <span className={`text-[18px] font-medium font-mono leading-tight tracking-tighter`} style={{ color: color || 'var(--text1)' }}>
      {value}
    </span>
  </div>
);

const MetricSep = () => <div className="w-[0.5px] h-7 bg-[var(--separator)]"></div>;

export default TopDashboard;
