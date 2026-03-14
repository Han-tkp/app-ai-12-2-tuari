import React from 'react';
import { useAppStore } from '../../store/useAppStore';

const PROFILE_COLOR: Record<string, string> = {
  low:  'var(--mac-orange)',
  mid:  'var(--mac-yellow)',
  high: 'var(--mac-green)',
};

const STATUS_COLOR: Record<string, string> = {
  Completed: 'var(--mac-green)',
  Pending:   'var(--mac-orange)',
  Retake:    'var(--mac-red)',
};

const TopDashboard: React.FC = () => {
  const {
    targetSize, vmd, accumulated, span, outOfBounds,
    hardwareProfile, currentSessionDroplets,
    activeSlideId, slides,
  } = useAppStore();

  const activeSlide  = slides.find(s => s.id === activeSlideId);
  const oobHigh      = (outOfBounds || 0) > 10;
  const statusColor  = STATUS_COLOR[activeSlide?.status ?? ''] ?? 'var(--text4)';
  const profileColor = PROFILE_COLOR[hardwareProfile] ?? 'var(--text3)';

  // WHO Compliance: VMD 10-30 µm, SPAN ≤ 2.0, Count ≥ 200
  const whoPass = vmd >= 10 && vmd <= 30 && span <= 2.0;
  const whoColor = whoPass ? 'var(--mac-green)' : 'var(--mac-red)';
  const whoIcon = whoPass ? '✓' : '✗';

  return (
    <div className="flex h-full items-stretch">

      {/* ── Active slide info ── */}
      <div
        className="flex items-center gap-4 px-4 shrink-0"
        style={{ borderRight: '1px solid var(--separator)' }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text4)', letterSpacing: '0.07em' }}>Slide</span>
          <span className="text-[12px] font-semibold leading-none" style={{ color: 'var(--text1)' }}>
            {activeSlide ? activeSlide.name : '—'}
          </span>
        </div>
        <div className="w-px h-6" style={{ background: 'var(--separator)' }} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text4)', letterSpacing: '0.07em' }}>Status</span>
          <div className="flex items-center gap-1">
            {activeSlide && (
              <div className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: statusColor }} />
            )}
            <span className="text-[11px] font-semibold leading-none" style={{ color: statusColor }}>
              {activeSlide?.status ?? '—'}
            </span>
          </div>
        </div>
        <div className="w-px h-6" style={{ background: 'var(--separator)' }} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text4)', letterSpacing: '0.07em' }}>Drops</span>
          <span className="font-instrument text-[12px] font-bold leading-none" style={{ color: 'var(--accent-text)' }}>
            {activeSlide ? activeSlide.droplets.length : '—'}
          </span>
        </div>
      </div>

      {/* ── Main metrics ── */}
      <div className="flex flex-1 items-center justify-evenly px-2">
        <MetricCell label="Target" value={targetSize?.toString() || '0'} unit="µm" />
        <Divider />
        <MetricCell label="VMD (Dv0.5)" value={(vmd || 0).toFixed(2)} unit="µm" highlight />
        <Divider />
        <MetricCell label="In-Frame" value={currentSessionDroplets?.length?.toString() || '0'} />
        <Divider />
        <MetricCell label="Accumulated" value={accumulated?.toString() || '0'} />
        <Divider />
        <MetricCell label="Span" value={(span || 0).toFixed(3)} />
        <Divider />
        <MetricCell
          label="Out-of-Bounds"
          value={(outOfBounds || 0).toFixed(1)}
          unit="%"
          warn={oobHigh}
        />
        <Divider />
        <div className="flex flex-col items-center px-2">
          <span
            className="text-[8.5px] font-semibold uppercase leading-none mb-1.5"
            style={{ color: 'var(--text4)', letterSpacing: '0.07em' }}
          >
            WHO Compliance
          </span>
          <div className="flex items-center gap-1">
            <span
              className="font-instrument text-[20px] font-bold leading-none"
              style={{ color: whoColor }}
            >
              {whoIcon}
            </span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: whoColor }}
            >
              {whoPass ? 'Pass' : 'Fail'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Profile badge ── */}
      <div
        className="flex items-center gap-2 px-4 shrink-0"
        style={{ borderLeft: '1px solid var(--separator)' }}
      >
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border"
          style={{
            borderColor: `${profileColor}40`,
            background: `${profileColor}0f`,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
            style={{ background: profileColor }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: profileColor }}
          >
            {hardwareProfile}
          </span>
        </div>
      </div>

    </div>
  );
};

const MetricCell: React.FC<{
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  warn?: boolean;
}> = ({ label, value, unit, highlight, warn }) => {
  const color = warn ? 'var(--mac-red)' : highlight ? 'var(--accent-text)' : 'var(--text1)';
  return (
    <div className="flex flex-col items-center px-2">
      <span
        className="text-[8.5px] font-semibold uppercase leading-none mb-1.5"
        style={{ color: 'var(--text4)', letterSpacing: '0.07em' }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span
          className="font-instrument text-[20px] font-bold leading-none tabular-nums"
          style={{ color }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[9px] ml-0.5" style={{ color: 'var(--text4)' }}>{unit}</span>
        )}
      </div>
    </div>
  );
};

const Divider = () => (
  <div className="shrink-0" style={{ width: '1px', height: '24px', background: 'var(--separator)' }} />
);

export default TopDashboard;
