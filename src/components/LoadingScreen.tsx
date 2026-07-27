import React, { useEffect, useState } from 'react';

// ── Decorative shape components ──────────────────────────────────────────
const DecoTriangle = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M16 4L28 26H4L16 4Z" fill="currentColor" opacity="0.15" />
    <path d="M16 8L24 24H8L16 8Z" fill="currentColor" opacity="0.1" />
  </svg>
);

const DecoCube = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={style}>
    <rect x="2" y="10" width="16" height="16" rx="2" fill="currentColor" opacity="0.08" />
    <rect x="6" y="6" width="16" height="16" rx="2" fill="currentColor" opacity="0.12" />
    <rect x="10" y="2" width="16" height="16" rx="2" fill="currentColor" opacity="0.08" />
  </svg>
);

const DecoCircles = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={style}>
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
    <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
    <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.1" />
  </svg>
);

// ── Steps ────────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Initializing' },
  { label: 'Models' },
  { label: 'Server' },
  { label: 'Calibrate' },
  { label: 'Ready' },
];

// ── Component ────────────────────────────────────────────────────────────
interface LoadingScreenProps {
  progress: number;
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message }) => {
  const activeStep = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
    >
      {/* Installer Card */}
      <div
        className="w-[580px] overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-window)',
          border: '0.5px solid var(--border)',
          borderRadius: '12px',
        }}
      >
        {/* ══ Title Bar ══ */}
        <div
          className="flex items-center justify-between px-[14px] py-[8px]"
          style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="var(--accent)" strokeWidth="1.5" />
              <circle cx="7" cy="7" r="1.5" fill="var(--accent)" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>
              DropDetect AI Setup
            </span>
          </div>
          <div className="flex gap-[10px]" style={{ color: 'var(--text4)', fontSize: 14 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ cursor: 'default' }}>
              <rect x="2" y="6.5" width="10" height="1" rx="0.5" fill="currentColor" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ cursor: 'default' }}>
              <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ cursor: 'default' }}>
              <line x1="2.5" y1="2.5" x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="11.5" y1="2.5" x2="2.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
        </div>

        {/* ══ Body ══ */}
        <div className="relative px-8 py-12 text-center" style={{ background: 'var(--bg-window)' }}>
          {/* Decorative icons */}
          <div className="absolute" style={{ top: 16, left: 16, color: 'var(--accent-text)' }}>
            <DecoTriangle />
          </div>
          <div className="absolute" style={{ bottom: 16, right: 16, color: 'var(--text4)' }}>
            <DecoCube />
          </div>
          <div className="absolute" style={{ top: '40%', right: 24, color: 'var(--text4)' }}>
            <DecoCircles />
          </div>

          {/* Logo / Brand */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="20" height="20" rx="5" stroke="var(--accent)" strokeWidth="1.5" />
              <path d="M11 6L15 16H7L11 6Z" fill="var(--accent)" opacity="0.3" />
              <circle cx="11" cy="11" r="2.5" fill="var(--accent)" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text1)', letterSpacing: '0.02em' }}>
              DropDetect <span style={{ color: 'var(--accent-text)' }}>AI</span>
            </span>
          </div>

          <h2
            className="m-0"
            style={{ fontSize: 17, fontWeight: 600, color: 'var(--text1)', marginBottom: 10 }}
          >
            Preparing your workspace
          </h2>
          <p
            className="m-0"
            style={{
              maxWidth: 400,
              margin: '0 auto',
              fontSize: 13,
              color: 'var(--text2)',
              lineHeight: 1.7,
            }}
          >
            Initializing core systems and loading AI detection models.
            <br />
            This may take a few moments on first launch.
          </p>
        </div>

        {/* ══ Progress Section ══ */}
        <div
          className="px-5 py-3"
          style={{ borderTop: '0.5px solid var(--border)', background: 'var(--bg-window)' }}
        >
          <p className="m-0 mb-2" style={{ fontSize: 12, color: 'var(--text3)' }}>
            {message}
          </p>
          <div className="flex items-center gap-[10px]">
            <div
              className="flex-1"
              style={{
                height: 5,
                background: 'var(--bg-surface)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'var(--accent)',
                  borderRadius: 4,
                }}
              />
            </div>
            <span
              className="tabular-nums shrink-0"
              style={{ fontSize: 12, color: 'var(--text3)', minWidth: 32, textAlign: 'right' }}
            >
              {progress}%
            </span>
          </div>
        </div>

        {/* ══ Footer — Steps + Button ══ */}
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{
            borderTop: '0.5px solid var(--border)',
            background: 'var(--bg-surface)',
          }}
        >
          {/* Step indicators */}
          <div className="flex gap-3 flex-wrap" style={{ fontSize: 11 }}>
            {STEPS.map((step, i) => {
              const isActive = i === activeStep;
              const isDone = i < activeStep;
              return (
                <span
                  key={step.label}
                  className="transition-colors duration-300"
                  style={{
                    color: isDone ? 'var(--accent-text)' : isActive ? 'var(--text1)' : 'var(--text4)',
                    fontWeight: isDone || isActive ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              );
            })}
          </div>

          {/* Start / Waiting button */}
          <button
            className="border-none px-4 py-1.5 text-[12px] font-medium transition-opacity"
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent, #fff)',
              borderRadius: 6,
              opacity: progress >= 100 ? 1 : 0.5,
              cursor: progress >= 100 ? 'pointer' : 'default',
            }}
            disabled={progress < 100}
          >
            {progress >= 100 ? 'Start' : 'Waiting...'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;