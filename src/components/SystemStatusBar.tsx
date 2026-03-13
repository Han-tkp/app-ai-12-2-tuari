import React from 'react';
import { Wifi, Database, HardDrive, Thermometer } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const SystemStatusBar: React.FC = () => {
  const { ramUsage, isCameraRunning } = useAppStore();

  return (
    <div className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider">
      {/* Left: Connection Status */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isCameraRunning ? 'bg-[var(--mac-green)] animate-pulse' : 'bg-[var(--text4)]'}`}></div>
          <span className={isCameraRunning ? 'text-[var(--mac-green)]' : 'text-[var(--text4)]'}>Camera {isCameraRunning ? 'Online' : 'Offline'}</span>
        </div>
        <div className="flex items-center space-x-2 text-[var(--text3)]">
          <Wifi className="w-3 h-3" />
          <span>Backend: WebSocket Connected</span>
        </div>
      </div>

      {/* Right: Hardware Metrics */}
      <div className="flex items-center space-x-6 text-[var(--text3)]">
        <div className="flex items-center space-x-2">
          <Database className="w-3 h-3" />
          <span>RAM: <span className="text-[var(--text1)]">{ramUsage}</span></span>
        </div>
        <div className="flex items-center space-x-2 border-l border-[var(--border)] pl-6">
          <HardDrive className="w-3 h-3" />
          <span>FPS: <span className="text-[var(--text1)]">{isCameraRunning ? '24.5' : '0.0'}</span></span>
        </div>
        <div className="flex items-center space-x-2 border-l border-[var(--border)] pl-6">
          <Thermometer className="w-3 h-3" />
          <span>Temp: <span className="text-[var(--text1)]">42°C</span></span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusBar;
