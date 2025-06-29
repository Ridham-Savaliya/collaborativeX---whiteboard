import { useState, useCallback, useRef } from 'react';
import { Point } from '../types/canvas';

export const usePanAndZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<Point | null>(null);

  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => {
      const newZoom = prev + delta;
      return Math.max(0.25, Math.min(4.0, newZoom));
    });
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !panStart.current) return;

    const dx = (e.clientX - panStart.current.x) / zoomLevel;
    const dy = (e.clientY - panStart.current.y) / zoomLevel;
    
    setPanOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    panStart.current = { x: e.clientX, y: e.clientY };
  }, [isPanning, zoomLevel]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount = 50) => {
    setPanOffset(prev => {
      switch (direction) {
        case 'up': return { ...prev, y: prev.y + amount };
        case 'down': return { ...prev, y: prev.y - amount };
        case 'left': return { ...prev, x: prev.x + amount };
        case 'right': return { ...prev, x: prev.x - amount };
        default: return prev;
      }
    });
  }, []);

  return {
    zoomLevel,
    panOffset,
    isPanning,
    handleZoom,
    handlePan,
    handlePanStart,
    handlePanMove,
    handlePanEnd
  };
};
