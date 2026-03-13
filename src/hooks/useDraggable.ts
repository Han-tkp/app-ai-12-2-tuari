import { useState, useEffect, useCallback } from 'react';

/**
 * Shared hook for draggable floating panels (ManualEditTable, SessionDropletTable).
 * Returns an onMouseDown handler to attach to the drag handle element.
 */
export function useDraggable(
  position: { x: number; y: number },
  onMove: (pos: { x: number; y: number }) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const stableOnMove = useCallback(onMove, [onMove]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      stableOnMove({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, stableOnMove]);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  return { onMouseDown };
}
