import React from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Minimize2, Maximize2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDraggable } from '../../hooks/useDraggable';

const VideoControls: React.FC = () => {
  const {
    isVideoLoaded, isVideoPlaying, videoSpeed,
    videoCurrentFrame, videoTotalFrames, videoFps,
    videoControlsMode, setVideoControlsMode,
    videoControlsPosition, setVideoControlsPosition,
  } = useAppStore();

  const { onMouseDown } = useDraggable(videoControlsPosition, setVideoControlsPosition);

  if (!isVideoLoaded) return null;

  const sendCommand = (action: string, extra: Record<string, any> = {}) => {
    window.dispatchEvent(new CustomEvent('send-backend-command', {
      detail: { action, ...extra }
    }));
  };

  const togglePlayPause = () => {
    if (isVideoPlaying) {
      sendCommand('video_pause');
      useAppStore.getState().setVideoState({ isVideoPlaying: false });
    } else {
      sendCommand('video_play');
      useAppStore.getState().setVideoState({ isVideoPlaying: true });
    }
  };

  const handleStop = () => {
    sendCommand('video_stop');
    useAppStore.getState().setVideoState({ isVideoPlaying: false, videoCurrentFrame: 0 });
  };

  const handleSeek = (offset: number) => {
    sendCommand('video_seek', { offset });
  };

  const handleSpeedChange = (speed: number) => {
    sendCommand('video_set_speed', { speed });
    useAppStore.getState().setVideoState({ videoSpeed: speed });
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetFrame = Math.round(ratio * videoTotalFrames);
    sendCommand('video_seek_to', { frame: targetFrame });
  };

  const formatTime = (frame: number) => {
    const fps = videoFps || 30;
    const totalSeconds = Math.floor(frame / fps);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = videoTotalFrames > 0 ? (videoCurrentFrame / videoTotalFrames) * 100 : 0;
  const stepFrames = Math.round(videoFps || 30); // 1 second

  // ── Mini mode ──────────────────────────────────────────────
  if (videoControlsMode === 'mini') {
    return (
      <div
        className="fixed z-[90] flex items-center rounded-lg border overflow-hidden"
        style={{
          left: `${videoControlsPosition.x}px`,
          top: `${videoControlsPosition.y}px`,
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="flex items-center gap-1 px-2 py-1.5 cursor-move"
          onMouseDown={onMouseDown}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isVideoPlaying ? 'bg-[var(--mac-green)] animate-pulse' : 'bg-[var(--text4)]'}`} />
          <span className="text-[9px] font-bold" style={{ color: 'var(--text3)' }}>
            {formatTime(videoCurrentFrame)}
          </span>
        </div>
        <button
          onClick={togglePlayPause}
          className="px-2 py-1.5 hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--accent-text)' }}
        >
          {isVideoPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={() => setVideoControlsMode('full')}
          className="px-1.5 py-1.5 hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text4)' }}
        >
          <Maximize2 size={10} />
        </button>
      </div>
    );
  }

  // ── Full mode ──────────────────────────────────────────────
  const speedOptions = [0.25, 0.5, 1, 2];

  return (
    <div
      className="fixed z-[90] w-[280px] rounded-lg border overflow-hidden"
      style={{
        left: `${videoControlsPosition.x}px`,
        top: `${videoControlsPosition.y}px`,
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-strong)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="h-7 flex items-center justify-between px-3 cursor-move border-b"
        style={{ background: 'var(--bg-titlebar)', borderColor: 'var(--border)' }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isVideoPlaying ? 'bg-[var(--mac-green)] animate-pulse' : 'bg-[var(--text4)]'}`} />
          <span className="text-[10px] font-bold" style={{ color: 'var(--text2)' }}>
            Video Player
          </span>
        </div>
        <button
          onClick={() => setVideoControlsMode('mini')}
          className="p-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text3)' }}
          title="Minimize"
        >
          <Minimize2 size={11} />
        </button>
      </div>

      {/* Transport Controls */}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-center gap-1.5 mb-2.5">
          <button
            onClick={() => handleSeek(-stepFrames * 5)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text3)' }}
            title="Back 5s"
          >
            <SkipBack size={13} />
          </button>
          <button
            onClick={() => handleSeek(-stepFrames)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text2)' }}
            title="Back 1s"
          >
            <SkipBack size={15} />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            title={isVideoPlaying ? 'Pause' : 'Play'}
          >
            {isVideoPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button
            onClick={handleStop}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text3)' }}
            title="Stop"
          >
            <Square size={13} />
          </button>
          <button
            onClick={() => handleSeek(stepFrames)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text2)' }}
            title="Forward 1s"
          >
            <SkipForward size={15} />
          </button>
          <button
            onClick={() => handleSeek(stepFrames * 5)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text3)' }}
            title="Forward 5s"
          >
            <SkipForward size={13} />
          </button>
        </div>

        {/* Progress Bar */}
        <div
          className="relative h-1.5 bg-[var(--bg-surface2)] rounded-full mb-1.5 cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-75"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              left: `calc(${progress}% - 5px)`,
              background: 'var(--accent)',
              boxShadow: '0 0 4px rgba(0,0,0,0.4)',
            }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between mb-2.5">
          <span className="text-[9px] font-mono" style={{ color: 'var(--text4)' }}>
            {formatTime(videoCurrentFrame)}
          </span>
          <span className="text-[9px] font-mono" style={{ color: 'var(--text4)' }}>
            {videoCurrentFrame} / {videoTotalFrames}
          </span>
          <span className="text-[9px] font-mono" style={{ color: 'var(--text4)' }}>
            {formatTime(videoTotalFrames)}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold uppercase mr-1" style={{ color: 'var(--text4)' }}>
            Speed
          </span>
          {speedOptions.map(s => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`flex-1 h-6 rounded-md text-[10px] font-bold transition-all border ${
                videoSpeed === s
                  ? 'border-[var(--accent)] text-white'
                  : 'border-[var(--border)] hover:border-[var(--text4)]'
              }`}
              style={{
                background: videoSpeed === s ? 'var(--accent)' : 'var(--bg-surface2)',
                color: videoSpeed === s ? '#fff' : 'var(--text3)',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
