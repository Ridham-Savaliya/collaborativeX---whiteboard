/**
 * Custom hook for managing viewport transformations and calculations
 * Handles zoom, pan, and coordinate transformations efficiently
 */

import { useState, useCallback, useMemo } from 'react';
import { Point, Transform, ViewportInfo } from '../types/WhiteboardTypes';

interface ViewportHook {
  transform: Transform;
  setTransform: React.Dispatch<React.SetStateAction<Transform>>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  getCanvasCoordinates: (clientX: number, clientY: number, canvasRect: DOMRect) => Point;
  getScreenCoordinates: (canvasX: number, canvasY: number) => Point;
  isPointInViewport: (point: Point, buffer?: number) => boolean;
  getViewportInfo: (canvasRect: DOMRect) => ViewportInfo;
}

export const useViewport = (): ViewportHook => {
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1.0,
  });

  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, 4.0),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.25, 0.25),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1.0 });
  }, []);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setTransform(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const getCanvasCoordinates = useCallback((
    clientX: number,
    clientY: number,
    canvasRect: DOMRect
  ): Point => {
    return {
      x: (clientX - canvasRect.left - transform.x * transform.scale) / transform.scale,
      y: (clientY - canvasRect.top - transform.y * transform.scale) / transform.scale,
    };
  }, [transform]);

  const getScreenCoordinates = useCallback((canvasX: number, canvasY: number): Point => {
    return {
      x: canvasX * transform.scale + transform.x * transform.scale,
      y: canvasY * transform.scale + transform.y * transform.scale,
    };
  }, [transform]);

  const isPointInViewport = useCallback((point: Point, buffer: number = 100): boolean => {
    const screenPoint = getScreenCoordinates(point.x, point.y);
    return (
      screenPoint.x >= -buffer &&
      screenPoint.y >= -buffer &&
      screenPoint.x <= window.innerWidth + buffer &&
      screenPoint.y <= window.innerHeight + buffer
    );
  }, [getScreenCoordinates]);

  const getViewportInfo = useCallback((canvasRect: DOMRect): ViewportInfo => {
    return {
      canvasRect,
      viewport: {
        x: -transform.x,
        y: -transform.y,
        width: canvasRect.width / transform.scale,
        height: canvasRect.height / transform.scale,
      },
    };
  }, [transform]);

  return {
    transform,
    setTransform,
    zoomIn,
    zoomOut,
    resetZoom,
    pan,
    getCanvasCoordinates,
    getScreenCoordinates,
    isPointInViewport,
    getViewportInfo,
  };
};
