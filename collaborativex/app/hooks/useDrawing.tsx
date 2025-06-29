import { useState, useCallback, useRef } from 'react';
import { WhiteboardElement, PathElement, Point } from '../types/canvas';
import { generateUniqueId, getCanvasCoordinates } from '../utils/canvasUtils';

interface UseDrawingProps {
  elements: WhiteboardElement[];
  setElements: React.Dispatch<React.SetStateAction<WhiteboardElement[]>>;
  tool: string | null;
  strokeColor: string;
  lineWidth: number;
  zoomLevel: number;
  panOffset: Point;
}

export const useDrawing = ({
  elements,
  setElements,
  tool,
  strokeColor,
  lineWidth,
  zoomLevel,
  panOffset
}: UseDrawingProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDrawStart = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !tool || ['stickyNote', 'text'].includes(tool)) return;

    const point = getCanvasCoordinates(
      e.clientX,
      e.clientY,
      canvasRef.current,
      zoomLevel,
      panOffset
    );

    setIsDrawing(true);
    setStartPoint(point);
    
    if (['pen', 'eraser', 'highlighter'].includes(tool)) {
      setCurrentPath([point]);
    }
  }, [tool, zoomLevel, panOffset]);

  const handleDrawMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const point = getCanvasCoordinates(
      e.clientX,
      e.clientY,
      canvasRef.current,
      zoomLevel,
      panOffset
    );

    if (['pen', 'eraser', 'highlighter'].includes(tool || '')) {
      setCurrentPath(prev => [...prev, point]);
    }
  }, [isDrawing, tool, zoomLevel, panOffset]);

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || !tool) return;

    if (['pen', 'eraser', 'highlighter'].includes(tool) && currentPath.length > 1) {
      const newElement: PathElement = {
        id: generateUniqueId(),
        type: 'path',
        points: currentPath,
        color: tool === 'eraser' ? '#FFFFFF' : strokeColor,
        width: tool === 'highlighter' ? lineWidth * 2 : lineWidth,
        tool: tool as 'pen' | 'eraser' | 'highlighter'
      };

      setElements(prev => [...prev, newElement]);
    }

    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
  }, [isDrawing, tool, currentPath, strokeColor, lineWidth, setElements]);

  return {
    isDrawing,
    currentPath,
    startPoint,
    handleDrawStart,
    handleDrawMove,
    handleDrawEnd,
    canvasRef
  };
};
