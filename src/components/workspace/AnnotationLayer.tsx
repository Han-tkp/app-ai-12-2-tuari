import React, { useState } from 'react';
import { Stage, Layer, Circle, Rect, Line, Text, Group } from 'react-konva';
import { useAppStore, Annotation } from '../../store/useAppStore';
import { v4 as uuidv4 } from 'uuid';

const AnnotationLayer: React.FC<{ width: number; height: number; scale: number }> = ({ width, height, scale }) => {
  const { 
    isManualEditActive, activeTool, annotations, 
    addAnnotation, annotationColor, lineThickness,
    objectiveLens
  } = useAppStore();

  const [newAnnotation, setNewAnnotation] = useState<Annotation | null>(null);

  const getUmPerPx = () => {
    return objectiveLens === '10x' ? 0.27926 : 0.69213;
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
      setNewAnnotation({ 
        ...newAnnotation, 
        points: [newAnnotation.x, newAnnotation.y, x, y],
        diameter_um: Math.sqrt(Math.pow(x - newAnnotation.x, 2) + Math.pow(y - newAnnotation.y, 2)) * getUmPerPx()
      });
    }
  };

  const handleMouseUp = () => {
    if (newAnnotation) {
      addAnnotation(newAnnotation);
      setNewAnnotation(null);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-auto">
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
              <Text x={ann.x} y={ann.y - 20} text={`${ann.diameter_um.toFixed(1)} µm`} fill={ann.color} fontSize={12} fontStyle="bold" />
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
