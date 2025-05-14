'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface PathElement {
  id: string;
  type: 'path';
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
}

interface ShapeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'heart' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon' | 'cross' | 'smiley' | 'cloud';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
}

interface StickyNoteElement {
  id: string;
  type: 'stickyNote';
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  text: string;
}

type WhiteboardElement = PathElement | ShapeElement | StickyNoteElement;

interface CanvasProps {
  width: number;
  height: number;
  strokeColor?: string;
  lineWidth?: number;
  tool?: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null;
  selectedShapeType?: string | null;
  elements: WhiteboardElement[];
  setElements: React.Dispatch<React.SetStateAction<WhiteboardElement[]>>;
  onElementComplete: (element: WhiteboardElement) => void;
  selectedElementId: string | null;
  onResizeStart?: (event: React.MouseEvent, elementId: string, handle: 'tl' | 'tr' | 'bl' | 'br') => void;
}

const RESIZE_HANDLE_SIZE = 8;

// StickyNote Component (Moved from Sidebar.tsx to Canvas.tsx)
const StickyNoteComponent: React.FC<{
  element: StickyNoteElement;
  onUpdate: (updatedElement: StickyNoteElement) => void;
  onClose: (id: string) => void;
}> = ({ element, onUpdate, onClose }) => {
  const [position, setPosition] = useState(element.position);
  const [size, setSize] = useState(element.size);
  const [color, setColor] = useState(element.color);
  const [text, setText] = useState(element.text);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      setPosition(newPosition);
      onUpdate({ ...element, position: newPosition });
    } else if (isResizing) {
      const newSize = {
        width: Math.max(100, e.clientX - position.x),
        height: Math.max(100, e.clientY - position.y),
      };
      setSize(newSize);
      onUpdate({ ...element, size: newSize });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position, element, onUpdate]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onUpdate({ ...element, color: newColor });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onUpdate({ ...element, text: newText });
  };

  return (
    <div
      className="absolute border-2 border-gray-300 rounded-lg shadow-lg p-2 flex flex-col z-50"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor: color,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Close Button - Positioned outside resize area */}
      <button
        onClick={() => onClose(element.id)}
        className="absolute -top-3 -right-3 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200"
        style={{ zIndex: 10 }}
      >
        <X size={14} />
      </button>

      {/* Text Area */}
      <textarea
        value={text}
        onChange={handleTextChange}
        onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when typing
        className="flex-1 w-full h-[calc(100%-2rem)] p-2 text-sm border-none rounded outline-none resize-none bg-opacity-80 bg-white"
        placeholder="Type here..."
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
      />

      {/* Color Selector - Positioned at the bottom */}
      <div className="mt-2 flex justify-end">
        <input
          type="color"
          value={color}
          onChange={handleColorChange}
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when changing color
          className="w-8 h-8 rounded-full cursor-pointer"
        />
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
  strokeColor = '#000000',
  lineWidth = 5,
  tool = 'pen',
  selectedShapeType = null,
  elements,
  setElements,
  onElementComplete,
  selectedElementId,
  onResizeStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [currentDrawingElement, setCurrentDrawingElement] = useState<WhiteboardElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width, height });

  const isPathElement = (element: WhiteboardElement): element is PathElement => {
    return element.type === 'path';
  };

  const isShapeElement = (element: WhiteboardElement): element is ShapeElement => {
    return ['rectangle', 'circle', 'line', 'triangle', 'diamond', 'star', 'arrow', 'heart', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'cross', 'smiley', 'cloud'].includes(element.type);
  };

  const isStickyNoteElement = (element: WhiteboardElement): element is StickyNoteElement => {
    return element.type === 'stickyNote';
  };

  // Handle window resize to make canvas fill the container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({
          width: containerWidth,
          height: containerHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize canvas with the correct pixel ratio
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasDimensions.width * dpr;
    canvas.height = canvasDimensions.height * dpr;
    canvas.style.width = `${canvasDimensions.width}px`;
    canvas.style.height = `${canvasDimensions.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setContext(ctx);
    }
  }, [canvasDimensions]);

  // Redraw canvas on changes (excluding sticky notes, which are rendered as DOM elements)
  const redrawCanvas = useCallback(() => {
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    context.clearRect(0, 0, context.canvas.width / dpr, context.canvas.height / dpr);

    // Apply zoom and offset
    context.save();
    context.scale(zoomLevel, zoomLevel);
    context.translate(offset.x, offset.y);

    // First draw all non-highlighter elements (excluding sticky notes)
    [...elements, currentDrawingElement]
      .filter((element): element is WhiteboardElement => !!element)
      .filter((element) => !isStickyNoteElement(element))
      .filter((element) => !isPathElement(element) || element.tool !== 'highlighter')
      .forEach((element) => {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1.0;
        context.strokeStyle = element.color;
        context.lineWidth = isPathElement(element) ? element.width / zoomLevel : (element as ShapeElement).lineWidth / zoomLevel;

        if (isPathElement(element)) {
          if (element.points.length < 2) return;
          context.beginPath();
          context.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            context.lineTo(element.points[i].x, element.points[i].y);
          }
          context.strokeStyle = element.tool === 'eraser' ? '#FFFFFF' : element.color;
          context.globalCompositeOperation = element.tool === 'eraser' ? 'destination-out' : 'source-over';
          context.stroke();
        } else if (isShapeElement(element)) {
          context.beginPath();
          const x = element.x;
          const y = element.y;
          const width = element.width;
          const height = element.height;

          switch (element.type) {
            case 'rectangle':
              context.rect(x, y, width, height);
              break;
            case 'circle':
              const centerX = x + width / 2;
              const centerY = y + height / 2;
              const radius = Math.sqrt(width * width + height * height) / 2;
              context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              break;
            case 'line':
              context.moveTo(x, y);
              context.lineTo(x + width, y + height);
              break;
            case 'triangle':
              context.moveTo(x + width / 2, y);
              context.lineTo(x + width, y + height);
              context.lineTo(x, y + height);
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
              const outerRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
              const innerRadius = outerRadius / 2.5;
              const numPoints = 5;
              const centerX_star = x + width / 2;
              const centerY_star = y + height / 2;
              context.moveTo(centerX_star, centerY_star - outerRadius);
              for (let i = 0; i < numPoints; i++) {
                const outerAngle = Math.PI / 2 + (i * 2 * Math.PI) / numPoints;
                const innerAngle = Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / numPoints;
                context.lineTo(
                  centerX_star + outerRadius * Math.cos(outerAngle),
                  centerY_star - outerRadius * Math.sin(outerAngle)
                );
                context.lineTo(
                  centerX_star + innerRadius * Math.cos(innerAngle),
                  centerY_star - innerRadius * Math.sin(innerAngle)
                );
              }
              context.closePath();
              break;
            case 'arrow':
              context.moveTo(x, y + height * 0.4);
              context.lineTo(x + width * 0.6, y + height * 0.4);
              context.lineTo(x + width * 0.6, y);
              context.lineTo(x + width, y + height / 2);
              context.lineTo(x + width * 0.6, y + height);
              context.lineTo(x + width * 0.6, y + height * 0.6);
              context.lineTo(x, y + height * 0.6);
              context.closePath();
              break;
            case 'pentagon':
            case 'hexagon':
            case 'heptagon':
            case 'octagon':
              const sides = element.type === 'pentagon' ? 5
                : element.type === 'hexagon' ? 6
                : element.type === 'heptagon' ? 7
                : 8;
              const polygonRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
              const polygonCenterX = x + width / 2;
              const polygonCenterY = y + height / 2;
              context.moveTo(
                polygonCenterX + polygonRadius * Math.cos(0),
                polygonCenterY + polygonRadius * Math.sin(0)
              );
              for (let i = 1; i <= sides; i++) {
                context.lineTo(
                  polygonCenterX + polygonRadius * Math.cos((i * 2 * Math.PI) / sides),
                  polygonCenterY + polygonRadius * Math.sin((i * 2 * Math.PI) / sides)
                );
              }
              context.closePath();
              break;
            case 'cross':
              context.rect(x + width * 0.4, y, width * 0.2, height);
              context.rect(x, y + height * 0.4, width, height * 0.2);
              break;
            case 'smiley':
              const smileyRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
              const smileyCenterX = x + width / 2;
              const smileyCenterY = y + height / 2;
              context.arc(smileyCenterX, smileyCenterY, smileyRadius, 0, Math.PI * 2, true);
              context.moveTo(
                smileyCenterX + smileyRadius * 0.6,
                smileyCenterY + smileyRadius * 0.2
              );
              context.arc(
                smileyCenterX,
                smileyCenterY + smileyRadius * 0.2,
                smileyRadius * 0.6,
                0,
                Math.PI,
                false
              );
              const eyeRadius = smileyRadius * 0.1;
              context.moveTo(
                smileyCenterX - smileyRadius * 0.3 + eyeRadius,
                smileyCenterY - smileyRadius * 0.3
              );
              context.arc(
                smileyCenterX - smileyRadius * 0.3,
                smileyCenterY - smileyRadius * 0.3,
                eyeRadius,
                0,
                Math.PI * 2,
                true
              );
              context.moveTo(
                smileyCenterX + smileyRadius * 0.3 + eyeRadius,
                smileyCenterY - smileyRadius * 0.3
              );
              context.arc(
                smileyCenterX + smileyRadius * 0.3,
                smileyCenterY - smileyRadius * 0.3,
                eyeRadius,
                0,
                Math.PI * 2,
                true
              );
              break;
            case 'heart':
              const heartWidth = Math.abs(width);
              const heartHeight = Math.abs(height);
              const heartX = x + (width < 0 ? width : 0);
              const heartY = y + (height < 0 ? height : 0);
              const topCurveHeight = heartHeight * 0.3;

              context.moveTo(heartX + heartWidth / 2, heartY + topCurveHeight);
              context.bezierCurveTo(
                heartX + heartWidth / 2, heartY,
                heartX, heartY,
                heartX, heartY + topCurveHeight
              );
              context.bezierCurveTo(
                heartX, heartY + (heartHeight + topCurveHeight) / 2,
                heartX + heartWidth / 2, heartY + heartHeight,
                heartX + heartWidth / 2, heartY + heartHeight
              );
              context.bezierCurveTo(
                heartX + heartWidth / 2, heartY + heartHeight,
                heartX + heartWidth, heartY + (heartHeight + topCurveHeight) / 2,
                heartX + heartWidth, heartY + topCurveHeight
              );
              context.bezierCurveTo(
                heartX + heartWidth, heartY,
                heartX + heartWidth / 2, heartY,
                heartX + heartWidth / 2, heartY + topCurveHeight
              );
              context.closePath();
              break;
            case 'cloud':
              const cloudX = x;
              const cloudY = y;
              const cloudWidth = width;
              const cloudHeight = height;
              const segment = cloudWidth / 6;

              context.moveTo(cloudX + segment, cloudY + cloudHeight);
              context.arc(
                cloudX + segment,
                cloudY + cloudHeight * 0.8,
                cloudHeight * 0.3,
                Math.PI / 2,
                Math.PI * 1.5
              );
              context.arc(
                cloudX + segment * 2,
                cloudY + cloudHeight * 0.6,
                cloudHeight * 0.4,
                Math.PI,
                Math.PI * 2
              );
              context.arc(
                cloudX + segment * 4,
                cloudY + cloudHeight * 0.6,
                cloudHeight * 0.5,
                Math.PI,
                Math.PI * 2
              );
              context.arc(
                cloudX + segment * 5,
                cloudY + cloudHeight * 0.8,
                cloudHeight * 0.3,
                Math.PI * 1.5,
                Math.PI / 2
              );
              context.closePath();
              break;
            default:
              console.warn(`Unknown shape type: ${element.type}`);
              break;
          }
          context.stroke();
        }
      });

    // Then draw all highlighter elements on top
    [...elements, currentDrawingElement]
      .filter((element): element is WhiteboardElement => !!element)
      .filter((element) => !isStickyNoteElement(element))
      .filter((element) => isPathElement(element) && element.tool === 'highlighter')
      .forEach((element) => {
        if (!isPathElement(element) || element.points.length < 2) return;
        context.beginPath();
        context.moveTo(element.points[0].x, element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
          context.lineTo(element.points[i].x, element.points[i].y);
        }
        context.strokeStyle = element.color;
        context.lineWidth = element.width / zoomLevel;
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 0.3;
        context.stroke();
      });

    // Draw selection handles if an element is selected
    if (selectedElementId && onResizeStart) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && isShapeElement(selectedElement)) {
        const shapeElement = selectedElement as ShapeElement;

        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;

        // Draw selection border
        context.strokeStyle = '#1e90ff';
        context.lineWidth = 1 / zoomLevel;
        context.setLineDash([5 / zoomLevel, 5 / zoomLevel]);
        context.strokeRect(
          shapeElement.x - 5 / zoomLevel,
          shapeElement.y - 5 / zoomLevel,
          shapeElement.width + 10 / zoomLevel,
          shapeElement.height + 10 / zoomLevel
        );
        context.setLineDash([]);

        // Draw resize handles
        const handleSize = RESIZE_HANDLE_SIZE / zoomLevel;
        const halfHandle = handleSize / 2;
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#1e90ff';
        context.lineWidth = 1 / zoomLevel;

        // Top-left handle
        context.fillRect(
          shapeElement.x - halfHandle,
          shapeElement.y - halfHandle,
          handleSize,
          handleSize
        );
        context.strokeRect(
          shapeElement.x - halfHandle,
          shapeElement.y - halfHandle,
          handleSize,
          handleSize
        );

        // Top-right handle
        context.fillRect(
          shapeElement.x + shapeElement.width - halfHandle,
          shapeElement.y - halfHandle,
          handleSize,
          handleSize
        );
        context.strokeRect(
          shapeElement.x + shapeElement.width - halfHandle,
          shapeElement.y - halfHandle,
          handleSize,
          handleSize
        );

        // Bottom-left handle
        context.fillRect(
          shapeElement.x - halfHandle,
          shapeElement.y + shapeElement.height - halfHandle,
          handleSize,
          handleSize
        );
        context.strokeRect(
          shapeElement.x - halfHandle,
          shapeElement.y + shapeElement.height - halfHandle,
          handleSize,
          handleSize
        );

        // Bottom-right handle
        context.fillRect(
          shapeElement.x + shapeElement.width - halfHandle,
          shapeElement.y + shapeElement.height - halfHandle,
          handleSize,
          handleSize
        );
        context.strokeRect(
          shapeElement.x + shapeElement.width - halfHandle,
          shapeElement.y + shapeElement.height - halfHandle,
          handleSize,
          handleSize
        );
      }
    }

    context.restore();
  }, [context, elements, currentDrawingElement, selectedElementId, zoomLevel, offset, onResizeStart]);

  // Redraw canvas when relevant state changes
  useEffect(() => {
    if (context) {
      requestAnimationFrame(redrawCanvas);
    }
  }, [context, elements, currentDrawingElement, selectedElementId, zoomLevel, offset, redrawCanvas]);

  const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / zoomLevel - offset.x,
      y: (event.clientY - rect.top) / zoomLevel - offset.y,
    };
  };

  const getTouchPosition = (event: React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas || !event.touches[0]) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.touches[0].clientX - rect.left) / zoomLevel - offset.x,
      y: (event.touches[0].clientY - rect.top) / zoomLevel - offset.y,
    };
  };

  const isPointInResizeHandle = (
    x: number,
    y: number,
    element: ShapeElement,
    handle: 'tl' | 'tr' | 'bl' | 'br'
  ): boolean => {
    const handleSize = RESIZE_HANDLE_SIZE / zoomLevel;
    const halfHandle = handleSize / 2;
    switch (handle) {
      case 'tl':
        return (
          x >= element.x - halfHandle &&
          x <= element.x + halfHandle &&
          y >= element.y - halfHandle &&
          y <= element.y + halfHandle
        );
      case 'tr':
        return (
          x >= element.x + element.width - halfHandle &&
          x <= element.x + element.width + halfHandle &&
          y >= element.y - halfHandle &&
          y <= element.y + halfHandle
        );
      case 'bl':
        return (
          x >= element.x - halfHandle &&
          x <= element.x + halfHandle &&
          y >= element.y + element.height - halfHandle &&
          y <= element.y + element.height + halfHandle
        );
      case 'br':
        return (
          x >= element.x + element.width - halfHandle &&
          x <= element.x + element.width + halfHandle &&
          y >= element.y + element.height - halfHandle &&
          y <= element.y + element.height + halfHandle
        );
    }
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'stickyNote' || tool === 'text') return;

    if (event.button === 1 || (isSpacePressed && event.button === 0)) {
      setIsPanning(true);
      setLastPanPosition({ x: event.clientX, y: event.clientY });
      return;
    }

    if (event.button !== 0) return;

    const { x, y } = getMousePosition(event);

    if (selectedElementId !== null && onResizeStart) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && isShapeElement(selectedElement)) {
        const shapeElement = selectedElement as ShapeElement;
        const handles: ('tl' | 'tr' | 'bl' | 'br')[] = ['tl', 'tr', 'bl', 'br'];
        for (const handle of handles) {
          if (isPointInResizeHandle(x, y, shapeElement, handle)) {
            onResizeStart(event, selectedElementId, handle);
            return;
          }
        }
      }
    }

    setIsDrawing(true);
    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      setCurrentDrawingElement({
        id: `path-${Date.now()}-${Math.random()}`,
        type: 'path',
        points: [{ x, y }],
        color: strokeColor,
        width: lineWidth,
        tool,
      });
    } else if (tool === 'shape' && selectedShapeType) {
      setCurrentDrawingElement({
        id: `shape-${Date.now()}-${Math.random()}`,
        type: selectedShapeType as any,
        x,
        y,
        width: 0,
        height: 0,
        color: strokeColor,
        lineWidth,
      });
    }
  };

  const startTouchDrawing = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (tool === 'stickyNote' || tool === 'text') return;

    event.preventDefault();

    if (event.touches.length === 2) {
      setIsPanning(true);
      setLastPanPosition({
        x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
        y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
      });
      return;
    }

    const touchPos = getTouchPosition(event);
    if (!touchPos) return;
    const { x, y } = touchPos;

    if (selectedElementId !== null && onResizeStart) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && isShapeElement(selectedElement)) {
        const shapeElement = selectedElement as ShapeElement;
        const handles: ('tl' | 'tr' | 'bl' | 'br')[] = ['tl', 'tr', 'bl', 'br'];
        for (const handle of handles) {
          if (isPointInResizeHandle(x, y, shapeElement, handle)) {
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: event.touches[0].clientX,
              clientY: event.touches[0].clientY,
            }) as any;
            onResizeStart(mouseEvent, selectedElementId, handle);
            return;
          }
        }
      }
    }

    setIsDrawing(true);
    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      setCurrentDrawingElement({
        id: `path-${Date.now()}-${Math.random()}`,
        type: 'path',
        points: [{ x, y }],
        color: strokeColor,
        width: lineWidth,
        tool,
      });
    } else if (tool === 'shape' && selectedShapeType) {
      setCurrentDrawingElement({
        id: `shape-${Date.now()}-${Math.random()}`,
        type: selectedShapeType as any,
        x,
        y,
        width: 0,
        height: 0,
        color: strokeColor,
        lineWidth,
      });
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && lastPanPosition) {
      const dx = (event.clientX - lastPanPosition.x) / zoomLevel;
      const dy = (event.clientY - lastPanPosition.y) / zoomLevel;
      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setLastPanPosition({ x: event.clientX, y: event.clientY });
      return;
    }

    if (
      !isDrawing ||
      !currentDrawingElement ||
      tool === 'stickyNote' ||
      tool === 'text' ||
      selectedElementId !== null
    ) return;

    const { x, y } = getMousePosition(event);

    if (isPathElement(currentDrawingElement)) {
      setCurrentDrawingElement({
        ...currentDrawingElement,
        points: [...currentDrawingElement.points, { x, y }],
      });
    } else {
      setCurrentDrawingElement({
        ...currentDrawingElement,
        width: x - currentDrawingElement.x,
        height: y - currentDrawingElement.y,
      });
    }
  };

  const touchDraw = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    if (isPanning && lastPanPosition && event.touches.length === 2) {
      const currentX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const currentY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

      const dx = (currentX - lastPanPosition.x) / zoomLevel;
      const dy = (currentY - lastPanPosition.y) / zoomLevel;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setLastPanPosition({ x: currentX, y: currentY });
      return;
    }

    if (
      !isDrawing ||
      !currentDrawingElement ||
      tool === 'stickyNote' || 
      tool === 'text' ||
      selectedElementId !== null
    ) return;

    const touchPos = getTouchPosition(event);
    if (!touchPos) return;
    const { x, y } = touchPos;

    if (isPathElement(currentDrawingElement)) {
      setCurrentDrawingElement({
        ...currentDrawingElement,
        points: [...currentDrawingElement.points, { x, y }],
      });
    } else {
      setCurrentDrawingElement({
        ...currentDrawingElement,
        width: x - currentDrawingElement.x,
        height: y - currentDrawingElement.y,
      });
    }
  };

  const endDrawing = () => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPosition(null);
      return;
    }

    if (selectedElementId !== null) {
      setIsDrawing(false);
      setCurrentDrawingElement(null);
      return;
    }

    if (isDrawing && currentDrawingElement) {
      if (isPathElement(currentDrawingElement)) {
        if (currentDrawingElement.points.length > 1) {
          onElementComplete(currentDrawingElement);
        }
      } else if (isShapeElement(currentDrawingElement)) {
        if (
          Math.abs(currentDrawingElement.width) > 5 &&
          Math.abs(currentDrawingElement.height) > 5
        ) {
          onElementComplete(currentDrawingElement);
        }
      }
    }
    setIsDrawing(false);
    setCurrentDrawingElement(null);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, prev - 0.1));
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2) {
      event.preventDefault();

      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      const currentDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      if ((event as any).previousTouchDistance) {
        const previousDistance = (event as any).previousTouchDistance;
        const delta = currentDistance - previousDistance;

        if (Math.abs(delta) > 5) {
          const zoomDelta = delta * 0.005;
          setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + zoomDelta)));
        }
      }

      (event as any).previousTouchDistance = currentDistance;

      touchDraw(event);
    } else if (isDrawing) {
      touchDraw(event);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleStickyNoteUpdate = (updatedElement: StickyNoteElement) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === updatedElement.id ? updatedElement : el
      )
    );
  };

  const handleStickyNoteClose = (id: string) => {
    setElements((prevElements) => prevElements.filter((el) => el.id !== id));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-lg shadow-lg overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(to right bottom, rgba(255, 255, 255, 0.8), rgba(243, 232, 255, 0.9))',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startTouchDrawing}
          onTouchMove={handleTouchMove}
          onTouchEnd={endDrawing}
          className="rounded-lg shadow-md canvas-element transition-all duration-300 w-full h-full"
          style={{
            touchAction: 'none',
            cursor: isSpacePressed ? 'grab' : isPanning ? 'grabbing' : 'default',
          }}
        />
      </div>

      {/* Render Sticky Notes as DOM Elements */}
      {elements
        .filter(isStickyNoteElement)
        .map((element) => (
          <StickyNoteComponent
            key={element.id}
            element={element}
            onUpdate={handleStickyNoteUpdate}
            onClose={handleStickyNoteClose}
          />
        ))}

      <div
        className="pointer-events-none absolute inset-0 z-0 transition-all duration-300"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(147, 51, 234, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(147, 51, 234, 0.1) 1px, transparent 1px)',
          backgroundSize: `${40 * zoomLevel}px ${40 * zoomLevel}px`,
          backgroundPosition: `${offset.x * zoomLevel}px ${offset.y * zoomLevel}px`,
          opacity: 0.7,
          transition: 'background-size 0.3s ease-out, background-position 0.3s ease-out',
        }}
      />

      <div
        className="absolute bottom-4 right-4 z-60 flex flex-col items-center gap-2 backdrop-blur-lg bg-white/20 rounded-lg shadow-lg p-2 pointer-events-auto transition-all duration-300 ease-in-out hover:bg-white/30"
        style={{ boxShadow: '0 4px 12px rgba(147, 51, 234, 0.15)' }}
      >
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="relative h-28 w-10 flex items-center justify-center">
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoomLevel}
            onChange={handleZoomChange}
            className="absolute w-28 h-2 appearance-none bg-purple-200 rounded-lg outline-none cursor-pointer transform -rotate-90 origin-center slider-thumb"
            style={{
              accentColor: '#9333ea',
            }}
          />
        </div>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="text-sm font-medium text-purple-800 bg-white/70 px-2 py-1 rounded-full">{`${Math.round(zoomLevel * 100)}%`}</div>
      </div>
    </div>
  );
};

export default Canvas;
