'use client';

import React, { useRef, useEffect, useState } from 'react';

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

type WhiteboardElement = PathElement | ShapeElement;

interface CanvasProps {
  width: number;
  height: number;
  strokeColor?: string;
  lineWidth?: number;
  tool?: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text';
  selectedShapeType?: string | null;
  elements: WhiteboardElement[];
  onElementComplete: (element: WhiteboardElement) => void;
  selectedElementId: string | null;
  onResizeStart?: (event: React.MouseEvent, elementId: string, handle: 'tl' | 'tr' | 'bl' | 'br') => void;
}

const RESIZE_HANDLE_SIZE = 8;

const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
  strokeColor = '#000000',
  lineWidth = 5,
  tool = 'pen',
  selectedShapeType = null,
  elements,
  onElementComplete,
  selectedElementId,
  onResizeStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [currentDrawingElement, setCurrentDrawingElement] = useState<WhiteboardElement | null>(null);

  const isPathElement = (element: WhiteboardElement): element is PathElement => {
    return element.type === 'path';
  };

  const isShapeElement = (element: WhiteboardElement): element is ShapeElement => {
    return element.type !== 'path';
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
      }
    }
  }, [width, height]);

  useEffect(() => {
    if (!context) return;
    const dpr = window.devicePixelRatio || 1;
    context.clearRect(0, 0, context.canvas.width / dpr, context.canvas.height / dpr);

    [...elements, currentDrawingElement]
      .filter((element): element is WhiteboardElement => !!element)
      .filter((element) => !isPathElement(element) || element.tool !== 'highlighter')
      .forEach((element) => {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1.0;
        context.strokeStyle = element.color;
        context.lineWidth = isPathElement(element) ? element.width : element.lineWidth;

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
        } else {
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

      [...elements, currentDrawingElement]
        .filter((element): element is WhiteboardElement => !!element)
        .filter((element) => isPathElement(element) && element.tool === 'highlighter')
        .forEach((element) => {
          if (!isPathElement(element) || element.points.length < 2) return;
          context.beginPath();
          context.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            context.lineTo(element.points[i].x, element.points[i].y);
          }
          context.strokeStyle = element.color;
          context.lineWidth = element.width;
          context.globalCompositeOperation = 'source-over';
          context.globalAlpha = 0.3;
          context.stroke();
        });

      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1.0;
  }, [context, elements, currentDrawingElement, selectedElementId]);

  const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const isPointInResizeHandle = (
    x: number,
    y: number,
    element: ShapeElement,
    handle: 'tl' | 'tr' | 'bl' | 'br'
  ): boolean => {
    const handleSize = RESIZE_HANDLE_SIZE;
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
    const { x, y } = getMousePosition(event);

    if (selectedElementId !== null && onResizeStart) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && !isPathElement(selectedElement)) {
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
        type: selectedShapeType,
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

  const endDrawing = () => {
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
      } else {
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

  return (
 <div
  className="relative rounded-lg shadow-lg w-full"
  style={{
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: '#f3e8ff', // Container background
  }}
>
<div className='absolute z-50 bg-transparent'>
    {/* Canvas - MUST have a HIGHER zIndex than the grid div */}
  <canvas
    ref={canvasRef}
    onMouseDown={startDrawing}
    onMouseMove={draw}
    onMouseUp={endDrawing}
    onMouseLeave={endDrawing}
    className="rounded-lg shadow-md"
    style={{
      width: `${width}px`,
      height: `${height}px`,
      zIndex: 50,
      
    }}
  />
</div>

  {/* Grid div - MUST have a LOWER zIndex than the canvas */}
  <div
    className="pointer-events-none absolute top-0 left-0 right-0 bottom-0 z-10"
    style={{
      backgroundImage:
        'linear-gradient(to right, rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 2px, transparent 2px)',
      backgroundSize: '40px 40px',
      zIndex: 10,
    }}
  />
</div>
  );
};

export default Canvas;

