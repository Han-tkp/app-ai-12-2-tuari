import React, { useEffect, useState } from 'react';

const SLIDE_IMAGES = Array.from({ length: 7 }, (_, i) => `./appdrpai/${i + 1}.png`);

interface LoadingScreenProps {
  progress: number;
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextReady, setNextReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDE_IMAGES.length);
      setNextReady(false);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black select-none overflow-hidden">
      {/* Full-screen background slideshow */}
      {SLIDE_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === currentSlide ? 1 : 0 }}
        />
      ))}
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7))' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-64 flex flex-col items-center gap-3">
          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/20">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out bg-white/80"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status Message & Percentage */}
          <div className="flex w-full justify-between items-center px-1">
            <span className="text-[11px] font-medium text-white/70">
              {message}
            </span>
            <span className="text-[11px] font-bold text-white/90">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;