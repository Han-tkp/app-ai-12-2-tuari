import React, { useEffect, useState } from 'react';

const SLIDE_IMAGES = Array.from({ length: 7 }, (_, i) => `./appdrpai/${i + 1}.png`);

const TIPS = [
  'Analyze droplet sizes in real-time using AI-powered YOLOv8 object detection.',
  'Switch between 4x and 10x objective lenses for different magnification levels.',
  'Export WHO-compliant spray droplet analysis reports to Microsoft Excel.',
  'Use manual annotation tools (Circle, Rect, Line) for precise measurements.',
  'Import images or video files for offline batch analysis.',
  'Auto-save keeps your work safe every 30 seconds — never lose data.',
  'Track droplet statistics with ByteTrack — VMD, Span, and size distribution.',
  'Quick-export session data or export full project with all slides included.',
  'Customize AI confidence threshold, theme, and language in Settings.',
  'Drag and drop media files directly into the workspace for instant analysis.',
  'Apply spread factor correction based on crater size for accurate volume.',
  'Monitor FPS and RAM usage in real-time from the workspace status bar.',
  'Review auto-saved sessions on startup with the recovery dialog.',
  'Switch between Dark, Light, and Warm themes to suit your environment.',
];

const STEPS = ['Init', 'Models', 'Server', 'Calibrate', 'Ready'];

interface LoadingScreenProps {
  progress: number;
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message }) => {
  const activeStep = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDE_IMAGES.length);
    }, 4000);
    return () => clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex(prev => {
        let next;
        do { next = Math.floor(Math.random() * TIPS.length); } while (next === prev && TIPS.length > 1);
        return next;
      });
    }, 5000);
    return () => clearInterval(tipTimer);
  }, []);

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

        {/* ══ Body — slideshow + tip ══ */}
        <div className="relative h-[260px] overflow-hidden">
          {/* Slideshow background */}
          {SLIDE_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: i === currentSlide ? 1 : 0 }}
            />
          ))}
          {/* Darken overlay for text readability */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))' }} />

          {/* Brand — top center */}
          <div className="absolute top-5 left-0 right-0 flex items-center justify-center gap-2 z-10">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="0.5" y="0.5" width="19" height="19" rx="4.5" stroke="white" strokeWidth="1" opacity="0.8"/>
              <circle cx="10" cy="10" r="5" fill="white" opacity="0.3"/>
              <circle cx="10" cy="10" r="2.5" fill="white"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '0.01em', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              DropDetect <span style={{ opacity: 0.85 }}>AI</span>
            </span>
          </div>

          {/* Glass-blur tip card */}
          <div
            className="absolute bottom-5 left-5 right-5 z-10 px-4 py-3 rounded-xl transition-opacity duration-500"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '0.5px solid rgba(255,255,255,0.12)',
            }}
          >
            <p className="m-0 text-center" style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, fontWeight: 400 }}>
              {TIPS[tipIndex]}
            </p>
          </div>
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