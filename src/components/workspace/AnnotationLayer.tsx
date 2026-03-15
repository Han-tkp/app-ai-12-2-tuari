import React, { useState } from 'react';
import { Stage, Layer, Circle, Rect, Line, Text, Group } from 'react-konva';
import { useAppStore, Annotation } from '../../store/useAppStore';
import { v4 as uuidv4 } from 'uuid';

const AnnotationLayer: React.FC<{ width: number; height: number; scale: number }> = ({ width, height, scale }) => {
  const {
    isManualEditActive, activeTool, annotations,
    addAnnotation, annotationColor, lineThickness,
    objectiveLens,
  } = useAppStore();

  const [newAnnotation, setNewAnnotation] = useState<Annotation | null>(null);

  // Backend processes at 640×480, annotations are on canvas (width×height).
  // Image is displayed via object-contain (4:3 in 16:9 container).
  const BACKEND_W = 640;
  const BACKEND_H = 480;
  const displayScale = Math.min(width / BACKEND_W, height / BACKEND_H);
  const displayW = BACKEND_W * displayScale;
  const displayH = BACKEND_H * displayScale;
  const offsetX = (width - displayW) / 2;
  const offsetY = (height - displayH) / 2;

  const getUmPerPx = () => {
    const backendUmPerPx = objectiveLens === '10x' ? 0.27926 : 0.69213;
    return backendUmPerPx / displayScale;
  };

  const handleMouseDown = (e: any) => {
    if (!isManualEditActive || activeTool === 'select') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const x = pos.x / scale;
    const y = pos.y / scale;

    const id = uuidv4();
    const initialAnnotation: Annotation = {
      id,
      type: activeTool as Annotation['type'],
      x,
      y,
      color: annotationColor,
      diameter_um: 0,
      points: activeTool === 'line' ? [x, y, x, y] : undefined,
      radius: activeTool === 'circle' ? 0 : undefined,
      width: activeTool === 'rect' ? 0 : undefined,
      height: activeTool === 'rect' ? 0 : undefined,
    };
    setNewAnnotation(initialAnnotation);
  };

  const handleMouseMove = (e: any) => {
    if (!newAnnotation) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const x = pos.x / scale;
    const y = pos.y / scale;

    if (newAnnotation.type === 'circle') {
      const radius = Math.sqrt(Math.pow(x - newAnnotation.x, 2) + Math.pow(y - newAnnotation.y, 2));
      setNewAnnotation({ ...newAnnotation, radius, diameter_um: radius * 2 * getUmPerPx() });
    } else if (newAnnotation.type === 'rect') {
      const w = x - newAnnotation.x;
      const h = y - newAnnotation.y;
      setNewAnnotation({
        ...newAnnotation,
        width: w,
        height: h,
        diameter_um: (Math.abs(w) + Math.abs(h)) / 2 * getUmPerPx()
      });
    } else if (newAnnotation.type === 'line') {
      // Line = true manual measurement — no spread factor
      setNewAnnotation({
        ...newAnnotation,
        points: [newAnnotation.x, newAnnotation.y, x, y],
        diameter_um: Math.sqrt(Math.pow(x - newAnnotation.x, 2) + Math.pow(y - newAnnotation.y, 2)) * getUmPerPx()
      });
    }
  };

  const handleMouseUp = () => {
    if (!newAnnotation) return;

    if (newAnnotation.type === 'line') {
      // Line = manual measurement → add as persistent annotation
      addAnnotation(newAnnotation);
    } else {
      // Circle/Rect = AI-assisted detection → send ROI to backend
      const ann = newAnnotation;
      let roiX: number, roiY: number, roiW: number, roiH: number;

      if (ann.type === 'circle' && ann.radius && ann.radius > 3) {
        roiX = (ann.x - ann.radius - offsetX) / displayScale;
        roiY = (ann.y - ann.radius - offsetY) / displayScale;
        roiW = (ann.radius * 2) / displayScale;
        roiH = (ann.radius * 2) / displayScale;
      } else if (ann.type === 'rect' && ann.width !== undefined && ann.height !== undefined
                 && (Math.abs(ann.width) > 3 || Math.abs(ann.height) > 3)) {
        const x1 = Math.min(ann.x, ann.x + ann.width);
        const y1 = Math.min(ann.y, ann.y + ann.height);
        roiX = (x1 - offsetX) / displayScale;
        roiY = (y1 - offsetY) / displayScale;
        roiW = Math.abs(ann.width) / displayScale;
        roiH = Math.abs(ann.height) / displayScale;
      } else {
        // Too small — ignore
        setNewAnnotation(null);
        return;
      }

      window.dispatchEvent(new CustomEvent('send-backend-command', {
        detail: {
          action: 'detect_roi',
          x: roiX,
          y: roiY,
          width: roiW,
          height: roiH,
        }
      }));
    }

    setNewAnnotation(null);
  };

  return (
    <div className={`absolute inset-0 ${isManualEditActive ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <Stage
        width={width * scale}
        height={height * scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isManualEditActive && activeTool !== 'select' ? 'crosshair' : 'default' }}
      >
        <Layer scaleX={scale} scaleY={scale}>
          {annotations.map((ann) => (
            <Group key={ann.id}>
              {ann.type === 'circle' && <Circle x={ann.x} y={ann.y} radius={ann.radius} stroke={ann.color} strokeWidth={lineThickness} />}
              {ann.type === 'rect' && <Rect x={ann.x} y={ann.y} width={ann.width} height={ann.height} stroke={ann.color} strokeWidth={lineThickness} />}
              {ann.type === 'line' && <Line points={ann.points} stroke={ann.color} strokeWidth={lineThickness} />}
              <Text
                x={ann.x} y={ann.y - 20}
                text={ann.detectionId
                  ? `#${ann.detectionId} ${ann.diameter_um.toFixed(1)} µm`
                  : `${ann.diameter_um.toFixed(1)} µm`
                }
                fill={ann.color} fontSize={12} fontStyle="bold"
              />
            </Group>
          ))}
          {newAnnotation && (
            <Group>
              {newAnnotation.type === 'circle' && <Circle x={newAnnotation.x} y={newAnnotation.y} radius={newAnnotation.radius} stroke={newAnnotation.color} strokeWidth={lineThickness} dash={[5, 5]} />}
              {newAnnotation.type === 'rect' && <Rect x={newAnnotation.x} y={newAnnotation.y} width={newAnnotation.width} height={newAnnotation.height} stroke={newAnnotation.color} strokeWidth={lineThickness} dash={[5, 5]} />}
              {newAnnotation.type === 'line' && <Line points={newAnnotation.points} stroke={newAnnotation.color} strokeWidth={lineThickness} dash={[5, 5]} />}
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default AnnotationLayer;
