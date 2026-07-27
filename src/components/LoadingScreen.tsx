import React, { useEffect, useState } from 'react';

const SLIDE_IMAGES = Array.from({ length: 7 }, (_, i) => `./appdrpai/${i + 1}.png`);

interface LoadingScreenProps {
  progress: number;
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDE_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0c10] select-none overflow-hidden">
      {/* Slideshow background */}
      {SLIDE_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === currentSlide ? 0.5 : 0 }}
        />
      ))}

      {/* Gradient overlay — KDE-inspired purple-to-blue */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 40%, rgba(55,30,120,0.4) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 70% 60%, rgba(30,80,180,0.25) 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 30% 70%, rgba(100,40,160,0.2) 0%, transparent 50%),
          rgba(10,12,16,0.7)
        `
      }} />

      {/* Scan line grain */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
          pointerEvents: 'none'
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-10">

        {/* Brand mark — minimal geometric emblem */}
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none" className="animate-[spin_8s_linear_infinite]">
            <circle cx="44" cy="44" r="42" stroke="url(#ringGrad)" strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray="180 84" />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="88" y2="88">
                <stop offset="0%" stopColor="#7c5cbf" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#7c5cbf" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center dot */}
          <div className="absolute w-3 h-3 rounded-full bg-white/90 animate-pulse" style={{ animationDuration: '2s' }} />
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-[22px] font-light tracking-[0.15em] text-white/90 uppercase">
            DropDetect <span className="font-semibold text-white">AI</span>
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">
            Precision Droplet Analysis
          </p>
        </div>

        {/* Glass card with progress */}
        <div className="w-72 backdrop-blur-xl rounded-2xl border border-white/[0.06] px-7 py-5"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {/* Progress bar — KDE-style thin elegant bar */}
          <div className="relative w-full h-[3px] rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7c5cbf, #3b82f6, #60a5fa)',
                boxShadow: '0 0 12px rgba(59,130,246,0.4)'
              }}
            />
          </div>

          {/* Dots indicator — KDE Plasma style */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[20, 40, 60, 80, 100].map((threshold) => (
              <div
                key={threshold}
                className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: progress >= threshold ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
                  boxShadow: progress >= threshold ? '0 0 6px rgba(59,130,246,0.4)' : 'none'
                }}
              />
            ))}
          </div>

          {/* Status message */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-[11px] font-medium tracking-wide text-white/50">
              {message}
            </span>
            <span className="text-[11px] font-semibold text-white/70 tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <p className="text-[9px] tracking-[0.2em] text-white/15 uppercase">
          Initializing System
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;