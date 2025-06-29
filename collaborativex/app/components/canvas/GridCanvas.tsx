import React, { memo, useCallback, useEffect } from 'react';
import { Transform } from '../types/WhiteboardTypes';

interface GridCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  context: CanvasRenderingContext2D | null;
  transform: Transform;
  dimensions: { width: number; height: number };
  gridSize?: number;
  gridColor?: string;
  className?: string;
}

export const GridCanvas = memo<GridCanvasProps>(({
  canvasRef,
  context,
  transform,
  dimensions,
  gridSize = 30,
  gridColor = '', // Vibrant purple
  className = '',
}) => {
  const drawGrid = useCallback(() => {
    if (!context || !canvasRef.current) return;
    console.log('Drawing grid with color:', gridColor); // D
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Clear canvas without filling background
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(dpr * transform.scale, dpr * transform.scale);
    context.translate(transform.x, transform.y);
    canvas.style.backgroundColor = 'transparent';
    // Set grid style
    context.strokeStyle = gridColor;

    context.lineWidth = 0.5 / transform.scale;

    // Calculate visible area with buffer
    const canvasWidth = canvas.width / (dpr * transform.scale);
    const canvasHeight = canvas.height / (dpr * transform.scale);
    const buffer = gridSize * 2;

    const startX = Math.floor((-transform.x - buffer) / gridSize) * gridSize;
    const startY = Math.floor((-transform.y - buffer) / gridSize) * gridSize;
    const endX = startX + canvasWidth + buffer * 2;
    const endY = startY + canvasHeight + buffer * 2;

    // Draw vertical lines
    context.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      context.moveTo(x, startY);
      context.lineTo(x, endY);
    }
    context.stroke();

    // Draw horizontal lines
    context.beginPath();
    for (let y = startY; y <= endY; y += gridSize) {
      context.moveTo(startX, y);
      context.lineTo(endX, y);
    }
    context.stroke();

    context.restore();
  }, [context, transform, gridSize, gridColor, canvasRef]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 pointer-events-none z-0 ${className}`}
      role="presentation"
      aria-hidden="true"
      width={dimensions.width}
      height={dimensions.height}
    />
  );
});

GridCanvas.displayName = 'GridCanvas';
