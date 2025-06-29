




// ```typescript
import React, { memo, useCallback, useEffect } from 'react';
import { WhiteboardElement, PathElement, ShapeElement } from '../types/WhiteboardTypes';

interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  context: CanvasRenderingContext2D | null;
  elements: WhiteboardElement[];
  currentElement: WhiteboardElement | null;
  transform: { x: number; y: number; scale: number };
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  className?: string;
  gridColor?: string;
}

const drawElement = (
  context: CanvasRenderingContext2D,
  element: WhiteboardElement,
  transform: { x: number; y: number; scale: number }
): void => {
  if (!context || !element) return;

  context.save();
  try {
    if (element.type === 'path') {
      drawPath(context, element as PathElement, transform);
    } else if (element.type !== 'text') {
      drawShape(context, element as ShapeElement, transform);
    }
  } catch (error) {
    console.error('Error drawing element:', error, element);
  } finally {
    context.restore();
  }
};

const drawPath = (
  context: CanvasRenderingContext2D,
  path: PathElement,
  transform: { x: number; y: number; scale: number }
): void => {
  if (!path.points || path.points.length < 2) return;

  context.beginPath();
  context.strokeStyle = path.color;
  context.lineWidth = path.width / transform.scale;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  switch (path.tool) {
    case 'eraser':
      context.globalCompositeOperation = 'destination-out';
      break;
    case 'highlighter':
      context.globalCompositeOperation = 'multiply';
      context.globalAlpha = 0.5;
      break;
    default:
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1.0;
  }

  context.moveTo(path.points[0].x, path.points[0].y);
  for (let i = 1; i < path.points.length; i++) {
    context.lineTo(path.points[i].x, path.points[i].y);
  }
  
  context.stroke();
  
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1.0;
};

const drawShape = (
  context: CanvasRenderingContext2D,
  shape: ShapeElement,
  transform: { x: number; y: number; scale: number }
): void => {
  context.beginPath();
  context.strokeStyle = shape.color;
  context.lineWidth = shape.lineWidth / transform.scale;
  context.fillStyle = 'transparent';
  context.lineCap = 'round';
  context.lineJoin = 'round';

  const { x, y, width, height } = shape;

  switch (shape.type) {
    case 'rectangle':
      context.rect(x, y, width, height);
      break;
    case 'circle':
      context.ellipse(
        x + width / 2,
        y + height / 2,
        Math.abs(width / 2),
        Math.abs(height / 2),
        0,
        0,
        Math.PI * 2
      );
      break;
    case 'line':
      context.moveTo(x, y);
      context.lineTo(x + width, y + height);
      break;
    case 'triangle':
      context.moveTo(x + width / 2, y);
      context.lineTo(x, y + height);
      context.lineTo(x + width, y + height);
      context.closePath();
      break;
    case 'diamond':
      context.moveTo(x + width / 2, y);
      context.lineTo(x + width, y + height / 2);
      context.lineTo(x + width / 2, y + height);
      context.lineTo(x, y + height / 2);
      context.closePath();
      break;
    case 'star':
      drawStar(context, x + width / 2, y + height / 2, Math.min(width, height) / 2);
      break;
    case 'heart':
      drawHeart(context, x, y, width, height);
      break;
    default:
      drawComplexShape(context, shape);
  }

  context.stroke();
};

const drawStar = (
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void => {
  const spikes = 5;
  const outerRadius = radius;
  const innerRadius = radius / 2.5;
  let rot = (Math.PI / 2) * 3;

  context.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    context.lineTo(
      cx + Math.cos(rot) * outerRadius,
      cy + Math.sin(rot) * outerRadius
    );
    rot += Math.PI / spikes;
    context.lineTo(
      cx + Math.cos(rot) * innerRadius,
      cy + Math.sin(rot) * innerRadius
    );
    rot += Math.PI / spikes;
  }
  context.closePath();
};

const drawHeart = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  const cx = x + width / 2;
  const cy = y + height / 4;
  
  context.moveTo(cx, cy + height / 2);
  context.bezierCurveTo(
    cx - width / 2, cy + height / 2,
    cx - width / 2, cy - height / 4,
    cx, cy - height / 4
  );
  context.bezierCurveTo(
    cx + width / 2, cy - height / 4,
    cx + width / 2, cy + height / 2,
    cx, cy + height / 2
  );
  context.closePath();
};

const drawComplexShape = (
  context: CanvasRenderingContext2D,
  shape: ShapeElement
): void => {
  const { x, y, width, height } = shape;
  
  if (shape.type.includes('arrow')) {
    let dx = width;
    let dy = height;
    
    switch (shape.type) {
      case 'arrowRight':
        dx = width; dy = 0;
        break;
      case 'arrowLeft':
        dx = -width; dy = 0;
        break;
      case 'arrowUp':
        dx = 0; dy = -height;
        break;
      case 'arrowDown':
        dx = 0; dy = height;
        break;
    }
    
    const endX = x + dx;
    const endY = y + dy;
    const angle = Math.atan2(dy, dx);
    const arrowSize = 10;
    
    context.moveTo(x, y);
    context.lineTo(endX, endY);
    
    context.moveTo(endX, endY);
    context.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    context.moveTo(endX, endY);
    context.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
  }
};

export const DrawingCanvas = memo<DrawingCanvasProps>(({
  canvasRef,
  context,
  elements,
  currentElement,
  transform,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  className = '',
  gridColor = 'transparent', // Default to transparent to avoid black background
}) => {
  const redrawCanvas = useCallback(() => {
    if (!context || !canvasRef.current) {
      console.warn('Missing context or canvasRef');
      return;
    }

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas dimensions based on DPR
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    context.scale(dpr, dpr);

    // Clear canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply grid color (transparent by default)
    if (gridColor) {
      context.fillStyle = gridColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply transform
    context.save();
    context.scale(transform.scale, transform.scale);
    context.translate(transform.x, transform.y);

    // Draw elements
    elements.forEach(element => {
      drawElement(context, element, transform);
    });

    // Draw current element if it exists
    if (currentElement) {
      drawElement(context, currentElement, transform);
    }

    context.restore();
  }, [context, elements, currentElement, transform, canvasRef, gridColor]);

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current && context) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      context.scale(dpr, dpr);
      redrawCanvas();
    }
  }, [canvasRef, context, redrawCanvas]);

  // Redraw on changes to elements, currentElement, or transform
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 touch-none z-10 ${className}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ backgroundColor: 'transparent' }}
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
