import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image, Video } from 'lucide-react';

interface DragDropImportProps {
  onImport?: (path: string, type: 'image' | 'video') => void;
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'tiff', 'tif', 'bmp']);
const VIDEO_EXTS = new Set(['mp4', 'avi', 'mov', 'mkv']);

function getFileType(path: string): 'image' | 'video' | null {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (VIDEO_EXTS.has(ext)) return 'video';
  return null;
}

/**
 * DragDropImport — listens for OS file-drop events via Tauri's onDragDropEvent.
 * Uses refs to avoid duplicate listeners from React StrictMode.
 */
const DragDropImport: React.FC<DragDropImportProps> = ({ onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragFileType, setDragFileType] = useState<'image' | 'video' | null>(null);
  const onImportRef = useRef(onImport);
  onImportRef.current = onImport;
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      // Clean up any previous listener before setting up a new one
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }

      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();

        if (cancelled) return;

        const unlisten = await win.onDragDropEvent((event) => {
          if (cancelled) return;

          const payload = event.payload as {
            type: string;
            paths?: string[];
          };

          if (payload.type === 'enter' || payload.type === 'over') {
            const paths = payload.paths ?? [];
            if (paths.length > 0) {
              const t = getFileType(paths[0]);
              setDragFileType(t);
              setIsDragging(t !== null);
            } else {
              setIsDragging(true);
            }
          } else if (payload.type === 'leave' || payload.type === 'cancel') {
            setIsDragging(false);
            setDragFileType(null);
          } else if (payload.type === 'drop') {
            setIsDragging(false);
            const paths = payload.paths ?? [];
            if (paths.length > 0) {
              const path = paths[0];
              const t = getFileType(path);
              if (t) {
                console.log('[DragDrop] drop:', path, t);
                onImportRef.current?.(path, t);
              }
            }
            setDragFileType(null);
          }
        });

        if (cancelled) {
          unlisten();
        } else {
          unlistenRef.current = unlisten;
        }
      } catch (err) {
        console.warn('[DragDrop] Tauri onDragDropEvent unavailable:', err);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []); // Empty deps — ref handles callback updates

  const icon =
    dragFileType === 'image' ? <Image size={32} /> :
    dragFileType === 'video' ? <Video size={32} /> :
    <Upload size={32} />;

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none transition-all duration-150 ${
        isDragging ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: isDragging ? 'rgba(0,0,0,0.82)' : 'transparent' }}
    >
      {isDragging && (
        <div
          className="absolute inset-5 flex items-center justify-center rounded-xl"
          style={{ border: '3px dashed var(--accent)' }}
        >
          <div
            className="bg-[var(--bg-surface)] rounded-2xl p-10 max-w-sm w-full text-center"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '1.5px solid var(--border-strong)' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--bg-active)', color: 'var(--accent-text)' }}
            >
              {icon}
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text1)' }}>
              {dragFileType === 'image' ? 'Drop Image to Import' :
               dragFileType === 'video' ? 'Drop Video to Import' :
               'Drop File to Import'}
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
              Release to start importing
            </p>
            <div className="flex gap-1.5 justify-center flex-wrap" style={{ color: 'var(--text4)' }}>
              {['JPG', 'PNG', 'TIFF', 'BMP', 'MP4', 'AVI', 'MOV'].map(ext => (
                <span key={ext} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-surface2)' }}>
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropImport;
