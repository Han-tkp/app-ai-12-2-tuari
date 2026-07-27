import React, { useEffect, useState } from 'react';

const STEPS = ['Init', 'Models', 'Server', 'Calibrate', 'Ready'];

interface LoadingScreenProps {
  progress: number;
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message }) => {
  const activeStep = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
      style={{ background: 'color-mix(in srgb, var(--bg-window) 85%, transparent)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-[540px] overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-window)', border: '0.5px solid var(--border)', borderRadius: 12 }}
      >
        {/* ══ Title bar ══ */}
        <div
          className="flex items-center justify-between px-3.5 py-2"
          style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="var(--accent)" strokeWidth="1.2" />
              <circle cx="6" cy="6" r="1.5" fill="var(--accent)" />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>DropDetect AI Setup</span>
          </div>
          <div className="flex gap-2.5" style={{ color: 'var(--text4)', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="5.5" width="10" height="1" rx="0.5" fill="currentColor"/></svg>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/></svg>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1"/></svg>
          </div>
        </div>

        {/* ══ Body ══ */}
        <div className="relative px-8 py-14 text-center">
          <div className="absolute" style={{ top: 14, left: 16, color: 'var(--text4)', opacity: 0.4, fontSize: 24 }}>△</div>
          <div className="absolute" style={{ bottom: 14, right: 16, color: 'var(--text4)', opacity: 0.3, fontSize: 24 }}>◇</div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="0.5" y="0.5" width="19" height="19" rx="4.5" stroke="var(--accent)" strokeWidth="1"/>
              <circle cx="10" cy="10" r="5" fill="var(--accent)" opacity="0.25"/>
              <circle cx="10" cy="10" r="2.5" fill="var(--accent)"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', letterSpacing: '0.01em' }}>
              DropDetect <span style={{ color: 'var(--accent-text)' }}>AI</span>
            </span>
          </div>

          <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text1)', marginBottom: 8 }}>
            Preparing your workspace
          </h2>
          <p className="m-0" style={{ maxWidth: 380, margin: '0 auto', fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
            Initializing core systems and loading AI detection models.
            <br />This may take a few moments on first launch.
          </p>
        </div>

        {/* ══ Progress ══ */}
        <div className="px-5 py-3" style={{ borderTop: '0.5px solid var(--border)' }}>
          <p className="m-0 mb-2" style={{ fontSize: 11, color: 'var(--text3)' }}>{message}</p>
          <div className="flex items-center gap-2.5">
            <div className="flex-1" style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div className="h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, background: 'var(--accent)', borderRadius: 4 }} />
            </div>
            <span className="tabular-nums shrink-0" style={{ fontSize: 11, color: 'var(--text3)', minWidth: 30, textAlign: 'right' }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* ══ Footer ══ */}
        <div className="flex items-center justify-between px-5 py-2.5"
          style={{ borderTop: '0.5px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex gap-3 flex-wrap" style={{ fontSize: 10 }}>
            {STEPS.map((step, i) => (
              <span key={step} className="transition-colors duration-300" style={{
                color: i < activeStep ? 'var(--accent-text)' : i === activeStep ? 'var(--text1)' : 'var(--text4)',
                fontWeight: i <= activeStep ? 600 : 400,
              }}>
                {step}
              </span>
            ))}
          </div>

          <button
            className="border-none px-4 py-1.5 text-[11px] font-medium rounded-md transition-all"
            style={{
              background: progress >= 100 ? 'var(--accent)' : 'var(--bg-surface2)',
              color: progress >= 100 ? '#fff' : 'var(--text4)',
              cursor: progress >= 100 ? 'pointer' : 'default',
            }}
            disabled={progress < 100}
          >
            {progress >= 100 ? 'Start' : '...'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;