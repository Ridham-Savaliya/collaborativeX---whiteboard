/**
 * Custom hook for optimized event handling with debouncing and throttling
 * Prevents excessive re-renders and provides smooth user interactions
 */

import { useCallback, useRef } from 'react';
import { throttle, debounce } from 'lodash';

interface OptimizedEventHandlers {
  throttledMouseMove: (callback: (e: React.MouseEvent) => void, delay?: number) => (e: React.MouseEvent) => void;
  debouncedSave: (callback: () => void, delay?: number) => () => void;
  requestAnimationFrame: (callback: () => void) => void;
  cancelAnimationFrame: () => void;
}

export const useOptimizedEventHandlers = (): OptimizedEventHandlers => {
  const animationFrameId = useRef<number | null>(null);

  const throttledMouseMove = useCallback((
    callback: (e: React.MouseEvent) => void,
    delay: number = 16 // ~60fps
  ) => {
    return throttle(callback, delay, { leading: true, trailing: true });
  }, []);

  const debouncedSave = useCallback((
    callback: () => void,
    delay: number = 500
  ) => {
    return debounce(callback, delay, { leading: false, trailing: true });
  }, []);

  const requestAnimationFrameCallback = useCallback((callback: () => void) => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(callback);
  }, []);

  const cancelAnimationFrameCallback = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  return {
    throttledMouseMove,
    debouncedSave,
    requestAnimationFrame: requestAnimationFrameCallback,
    cancelAnimationFrame: cancelAnimationFrameCallback,
  };
};
