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
 * DragDropImport — listens for OS file-drop events via Electron window.electron.onFileDrop
 * and HTML5 drag-and-drop.
 */
const DragDropImport: React.FC<DragDropImportProps> = ({ onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragFileType, setDragFileType] = useState<'image' | 'video' | null>(null);
  const onImportRef = useRef(onImport);
  onImportRef.current = onImport;

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
        setDragFileType(null);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragFileType(null);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        let filePath = (file as any).path;
        
        if (!filePath && window.electron?.getFilePath) {
          filePath = window.electron.getFilePath(file);
        }
        
        if (!filePath) filePath = file.name;

        const t = getFileType(filePath);
        if (t && filePath) {
          console.log('[DragDrop] HTML5 drop:', filePath, t);
          onImportRef.current?.(filePath, t);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    let unlistenFileDrop: (() => void) | null = null;
    if (window.electron?.onFileDrop) {
      unlistenFileDrop = window.electron.onFileDrop((paths) => {
        setIsDragging(false);
        setDragFileType(null);
        if (paths && paths.length > 0) {
          const path = paths[0];
          const t = getFileType(path);
          if (t) {
            console.log('[DragDrop] Electron drop:', path, t);
            onImportRef.current?.(path, t);
          }
        }
      });
    }

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
      if (unlistenFileDrop) {
        unlistenFileDrop();
      }
    };
  }, []);

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
