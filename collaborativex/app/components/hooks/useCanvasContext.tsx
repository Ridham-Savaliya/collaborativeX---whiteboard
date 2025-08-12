/**
 * Fixed canvas context hook with proper initialization
 * Provides optimized canvas operations with proper error handling
 */

import { useRef, useCallback, useState } from 'react';

interface CanvasContextHook {
  gridCanvasRef: React.RefObject<HTMLCanvasElement>;
  contentCanvasRef: React.RefObject<HTMLCanvasElement>;
  gridContext: CanvasRenderingContext2D | null;
  contentContext: CanvasRenderingContext2D | null;
  setupCanvas: (width: number, height: number) => void;
  clearCanvas: (context: CanvasRenderingContext2D) => void;
  saveContext: (context: CanvasRenderingContext2D) => void;
  restoreContext: (context: CanvasRenderingContext2D) => void;
}

export const useCanvasContext = (): CanvasContextHook => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const contentCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gridContext, setGridContext] = useState<CanvasRenderingContext2D | null>(null);
  const [contentContext, setContentContext] = useState<CanvasRenderingContext2D | null>(null);

  const setupCanvas = useCallback((width: number, height: number) => {
    const gridCanvas = gridCanvasRef.current;
    const contentCanvas = contentCanvasRef.current;
    
    if (!gridCanvas || !contentCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    
    // Setup grid canvas
    gridCanvas.width = width * dpr;
    gridCanvas.height = height * dpr;
    gridCanvas.style.width = `${width}px`;
    gridCanvas.style.height = `${height}px`;

    // Setup content canvas
    contentCanvas.width = width * dpr;
    contentCanvas.height = height * dpr;
    contentCanvas.style.width = `${width}px`;
    contentCanvas.style.height = `${height}px`;

    // Get contexts with optimized settings
    const gridCtx = gridCanvas.getContext('2d', { alpha: false });
    const contentCtx = contentCanvas.getContext('2d', { alpha: true });

    if (gridCtx && contentCtx) {
      // Optimize rendering settings
      gridCtx.imageSmoothingEnabled = false;
      contentCtx.imageSmoothingEnabled = true;
      contentCtx.imageSmoothingQuality = 'high';
      
      // Set line properties for better rendering
      contentCtx.lineCap = 'round';
      contentCtx.lineJoin = 'round';
      gridCtx.lineCap = 'round';
      gridCtx.lineJoin = 'round';

      setGridContext(gridCtx);
      setContentContext(contentCtx);
    }
  }, []);

  const clearCanvas = useCallback((context: CanvasRenderingContext2D) => {
    if (!context.canvas) return;
    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height);
  }, []);

  const saveContext = useCallback((context: CanvasRenderingContext2D) => {
    context.save();
  }, []);

  const restoreContext = useCallback((context: CanvasRenderingContext2D) => {
    context.restore();
  }, []);

  return {
    gridCanvasRef,
    contentCanvasRef,
    gridContext,
    contentContext,
    setupCanvas,
    clearCanvas,
    saveContext,
    restoreContext,
  };
};
