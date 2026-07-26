import React, { useEffect, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [message, setMessage] = useState('Initializing Core Systems...');

  useEffect(() => {
    if (progress > 80) {
      setMessage('Loading AI Models (YOLOv8)...');
    } else if (progress > 60) {
      setMessage('Starting Local Server (Port 8000)...');
    } else if (progress > 30) {
      setMessage('Establishing Backend Connections...');
    }
    
    if (progress === 100) {
      setMessage('Ready!');
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-window)] text-[var(--text1)] select-none">
      
      {/* Background glow */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-[100px] opacity-20"
        style={{ background: 'var(--accent)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Icon */}
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-8 relative"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--mac-purple) 100%)',
            boxShadow: '0 0 40px rgba(138, 43, 226, 0.3)'
          }}
        >
          <Bot size={40} color="white" className="animate-pulse" />
          
          {/* Spinner ring around logo */}
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20" />
          <div 
            className="absolute inset-0 rounded-2xl border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" 
            style={{ animationDuration: '2s' }}
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold font-instrument tracking-tight mb-2">DropDetect AI</h1>
        <p className="text-[13px] font-medium mb-12" style={{ color: 'var(--text3)' }}>
          Precision Droplet Analysis System
        </p>

        {/* Progress Bar Container */}
        <div className="w-64 flex flex-col items-center gap-3">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--mac-purple))'
              }}
            />
          </div>
          
          {/* Status Message & Percentage */}
          <div className="flex w-full justify-between items-center px-1">
            <span className="text-[11px] font-medium animate-pulse" style={{ color: 'var(--text2)' }}>
              {message}
            </span>
            <span className="text-[11px] font-bold font-instrument" style={{ color: 'var(--accent-text)' }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* First time network warning (only visible when it takes long) */}
        <div 
          className="absolute -bottom-24 w-80 text-center transition-opacity duration-1000"
          style={{ opacity: progress > 10 && progress < 90 ? 1 : 0 }}
        >
          <p className="text-[10px]" style={{ color: 'var(--text4)' }}>
            Note: If prompted by Windows Firewall, please click "Allow access" to enable local AI communication.
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoadingScreen;
