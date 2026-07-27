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
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none">
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
      <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55))' }} />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <svg width="32" height="32" viewBox="0 0 512 512" fill="none">
            <rect x="16" y="16" width="480" height="480" rx="80" stroke="white" strokeWidth="24" opacity="0.85"/>
            <circle cx="248" cy="248" r="136" stroke="white" strokeWidth="20" opacity="0.8"/>
            <circle cx="268" cy="268" r="40" fill="white" opacity="0.7"/>
            <circle cx="190" cy="204" r="28" fill="white" opacity="0.55"/>
            <circle cx="200" cy="310" r="18" fill="white" opacity="0.45"/>
            <circle cx="312" cy="196" r="16" fill="white" opacity="0.4"/>
            <line x1="348" y1="358" x2="420" y2="430" stroke="white" strokeWidth="24" strokeLinecap="round" opacity="0.6"/>
          </svg>
          <div>
            <span className="block text-2xl font-bold tracking-tight" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
              DropDetect <span style={{ opacity: 0.8 }}>AI</span>
            </span>
            <span className="block text-xs font-medium tracking-widest uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Spray Droplet Analysis Platform
            </span>
          </div>
        </div>

        {/* Glass-blur tip card */}
        <div
          className="max-w-[480px] w-full px-5 py-4 rounded-2xl transition-opacity duration-500 mb-10"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,255,255,0.12)',
          }}
        >
          <p className="m-0 text-center text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 400 }}>
            {TIPS[tipIndex]}
          </p>
        </div>

        {/* Progress */}
        <div className="w-[400px] max-w-full mb-4">
          <p className="m-0 mb-2 text-xs font-medium text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {message}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1" style={{ height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' }}>
              <div className="h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, background: '#fff', borderRadius: 4, opacity: 0.85 }} />
            </div>
            <span className="tabular-nums shrink-0 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)', minWidth: 32, textAlign: 'right' }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Steps + Start */}
        <div className="flex items-center justify-between w-[400px] max-w-full">
          <div className="flex gap-4">
            {STEPS.map((step, i) => (
              <span key={step} className="transition-all duration-300 text-[11px] font-medium" style={{
                color: i < activeStep ? 'rgba(255,255,255,0.9)' : i === activeStep ? '#fff' : 'rgba(255,255,255,0.3)',
                textShadow: i <= activeStep ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}>
                {step}
              </span>
            ))}
          </div>

          <button
            className="border-none px-5 py-1.5 text-[12px] font-semibold rounded-lg transition-all"
            style={{
              background: progress >= 100 ? '#fff' : 'rgba(255,255,255,0.1)',
              color: progress >= 100 ? '#000' : 'rgba(255,255,255,0.35)',
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