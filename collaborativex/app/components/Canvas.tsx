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
  type:
    | 'rectangle'
    | 'circle'
    | 'line'
    | 'triangle'
    | 'diamond'
    | 'star'
    | 'arrow'
    | 'heart'
    | 'pentagon'
    | 'hexagon'
    | 'heptagon'
    | 'octagon'
    | 'cross'
    | 'smiley'
    | 'cloud';
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
  selectedShapeType?:
    | 'rectangle'
    | 'circle'
    | 'line'
    | 'triangle'
    | 'diamond'
    | 'star'
    | 'arrow'
    | 'heart'
    | 'pentagon'
    | 'hexagon'
    | 'heptagon'
    | 'octagon'
    | 'cross'
    | 'smiley'
    | 'cloud'
    | null;
  elements: WhiteboardElement[];
  onElementComplete: (element: WhiteboardElement) => void;
  selectedElementId: string | null;
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [currentDrawingElement, setCurrentDrawingElement] = useState<WhiteboardElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

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
    if (context) {
      const dpr = window.devicePixelRatio || 1;
      context.clearRect(0, 0, context.canvas.width / dpr, context.canvas.height / dpr);

      // Separate elements into non-highlighter and highlighter for rendering order
      const nonHighlighterElements = elements.filter((el) => el.type !== 'path' || el.tool !== 'highlighter');
      const highlighterElements = elements.filter((el) => el.type === 'path' && el.tool === 'highlighter');

      // Draw non-highlighter elements first (shapes, pen, eraser)
      [...nonHighlighterElements, currentDrawingElement]
        .filter((element): element is WhiteboardElement => !!element)
        .forEach((element) => {
          context.globalCompositeOperation = 'source-over';
          context.globalAlpha = 1.0;
          context.strokeStyle = element.color;
          context.lineWidth = 'lineWidth' in element ? element.lineWidth : element.width;

          if (element.type === 'path') {
            if (element.points.length < 2) return;
            context.beginPath();
            context.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
              context.lineTo(element.points[i].x, element.points[i].y);
            }
            context.strokeStyle = element.tool === 'eraser' ? '#FFFFFF' : element.color;
            context.lineWidth = element.width;
            if (element.tool === 'eraser') {
              context.globalCompositeOperation = 'destination-out';
            }
            context.stroke();
          } else {
            drawShape(context, element);
            if (element.id === selectedElementId) {
              drawSelectionBox(context, element);
            }
          }
        });

      // Draw highlighter paths last (on top of shapes/pen/eraser)
      highlighterElements.forEach((element) => {
        if (element.type === 'path' && element.points.length >= 2) {
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
        }
      });

      // If current drawing element is a highlighter, draw it last
      if (currentDrawingElement?.type === 'path' && currentDrawingElement.tool === 'highlighter') {
        context.beginPath();
        context.moveTo(currentDrawingElement.points[0].x, currentDrawingElement.points[0].y);
        for (let i = 1; i < currentDrawingElement.points.length; i++) {
          context.lineTo(currentDrawingElement.points[i].x, currentDrawingElement.points[i].y);
        }
        context.strokeStyle = currentDrawingElement.color;
        context.lineWidth = currentDrawingElement.width;
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 0.3;
        context.stroke();
      }

      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1.0;
    }
  }, [context, elements, currentDrawingElement, selectedElementId]);

  const drawShape = (context: CanvasRenderingContext2D, element: ShapeElement) => {
    context.beginPath();
    context.strokeStyle = element.color;
    context.lineWidth = element.lineWidth;

    const { x, y, width, height } = element;

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
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        context.moveTo(centerX, centerY - outerRadius);
        for (let i = 0; i < numPoints; i++) {
          const outerAngle = Math.PI / 2 + (i * 2 * Math.PI) / numPoints;
          const innerAngle = Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / numPoints;
          context.lineTo(centerX + outerRadius * Math.cos(outerAngle), centerY - outerRadius * Math.sin(outerAngle));
          context.lineTo(centerX + innerRadius * Math.cos(innerAngle), centerY - innerRadius * Math.sin(innerAngle));
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
        const sides = element.type === 'pentagon' ? 5 : element.type === 'hexagon' ? 6 : element.type === 'heptagon' ? 7 : 8;
        const radius = Math.min(Math.abs(width), Math.abs(height)) / 2;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        context.moveTo(centerX + radius * Math.cos(0), centerY + radius * Math.sin(0));
        for (let i = 1; i <= sides; i++) {
          context.lineTo(centerX + radius * Math.cos((i * 2 * Math.PI) / sides), centerY + radius * Math.sin((i * 2 * Math.PI) / sides));
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
        context.moveTo(smileyCenterX + smileyRadius * 0.6, smileyCenterY + smileyRadius * 0.2);
        context.arc(smileyCenterX, smileyCenterY + smileyRadius * 0.2, smileyRadius * 0.6, 0, Math.PI, false);
        const eyeRadius = smileyRadius * 0.1;
        context.moveTo(smileyCenterX - smileyRadius * 0.3 + eyeRadius, smileyCenterY - smileyRadius * 0.3);
        context.arc(smileyCenterX - smileyRadius * 0.3, smileyCenterY - smileyRadius * 0.3, eyeRadius, 0, Math.PI * 2, true);
        context.moveTo(smileyCenterX + smileyRadius * 0.3 + eyeRadius, smileyCenterY - smileyRadius * 0.3);
        context.arc(smileyCenterX + smileyRadius * 0.3, smileyCenterY - smileyRadius * 0.3, eyeRadius, 0, Math.PI * 2, true);
        break;
      case 'cloud':
        const cloudX = x;
        const cloudY = y;
        const cloudWidth = width;
        const cloudHeight = height;
        const segment = cloudWidth / 6;
        context.moveTo(cloudX + segment, cloudY + cloudHeight);
        context.arc(cloudX + segment, cloudY + cloudHeight * 0.8, cloudHeight * 0.3, Math.PI / 2, Math.PI * 1.5);
        context.arc(cloudX + segment * 2, cloudY + cloudHeight * 0.6, cloudHeight * 0.4, Math.PI, Math.PI * 2);
        context.arc(cloudX + segment * 4, cloudY + cloudHeight * 0.6, cloudHeight * 0.5, Math.PI, Math.PI * 2);
        context.arc(cloudX + segment * 5, cloudY + cloudHeight * 0.8, cloudHeight * 0.3, Math.PI * 1.5, Math.PI / 2);
        context.closePath();
        break;
      default:
        console.warn(`Unknown shape type: ${element.type}`);
        break;
    }
    context.stroke();
  };

  const drawSelectionBox = (context: CanvasRenderingContext2D, element: ShapeElement) => {
    context.strokeStyle = '#00FFFF';
    context.lineWidth = 2;
    context.setLineDash([6, 3]);
    context.strokeRect(element.x, element.y, element.width, element.height);
    context.setLineDash([]);

    const handleSize = RESIZE_HANDLE_SIZE;
    const halfHandle = handleSize / 2;
    context.fillStyle = '#00FFFF';
    context.strokeStyle = '#000000';
    context.lineWidth = 1;

    context.fillRect(element.x - halfHandle, element.y - halfHandle, handleSize, handleSize);
    context.strokeRect(element.x - halfHandle, element.y - halfHandle, handleSize, handleSize);
    context.fillRect(element.x + element.width - halfHandle, element.y - halfHandle, handleSize, handleSize);
    context.strokeRect(element.x + element.width - halfHandle, element.y - halfHandle, handleSize, handleSize);
    context.fillRect(element.x - halfHandle, element.y + element.height - halfHandle, handleSize, handleSize);
    context.strokeRect(element.x - halfHandle, element.y + element.height - halfHandle, handleSize, handleSize);
    context.fillRect(element.x + element.width - halfHandle, element.y + element.height - halfHandle, handleSize, handleSize);
    context.strokeRect(element.x + element.width - halfHandle, element.y + element.height - halfHandle, handleSize, handleSize);
  };

  const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'stickyNote' || tool === 'text' || selectedElementId !== null) return;
    const { x, y } = getMousePosition(event);
    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      setCurrentDrawingElement({
        id: `path-${Date.now()}-${Math.random()}`,
        type: 'path',
        points: [{ x, y }],
        color: tool === 'highlighter' ? `${strokeColor}80` : strokeColor,
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
    if (!isDrawing || !currentDrawingElement || tool === 'stickyNote' || tool === 'text' || selectedElementId !== null) return;
    const { x, y } = getMousePosition(event);

    if (currentDrawingElement.type === 'path') {
      setCurrentDrawingElement((prevElement) => {
        if (!prevElement || prevElement.type !== 'path') return null;
        return {
          ...prevElement,
          points: [...prevElement.points, { x, y }],
        };
      });
    } else {
      setCurrentDrawingElement((prevElement) => {
        if (!prevElement || prevElement.type === 'path') return null;
        const startX = prevElement.x;
        const startY = prevElement.y;
        return {
          ...prevElement,
          width: x - startX,
          height: y - startY,
        };
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
      if (currentDrawingElement.type === 'path') {
        if (currentDrawingElement.points.length > 1) {
          onElementComplete(currentDrawingElement);
        }
      } else {
        if (Math.abs(currentDrawingElement.width) > 5 && Math.abs(currentDrawingElement.height) > 5) {
          onElementComplete(currentDrawingElement);
        }
      }
    }
    setIsDrawing(false);
    setCurrentDrawingElement(null);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && context) {
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        const newWidth = canvas.parentElement?.clientWidth || width;
        const newHeight = canvas.parentElement?.clientHeight || height;

        canvas.width = newWidth * dpr;
        canvas.height = newHeight * dpr;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;

        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.lineJoin = 'round';
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [context, width, height]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor =
        tool === 'highlighter'
          ? 'crosshair'
          : tool === 'eraser'
          ? 'crosshair'
          : tool === 'stickyNote'
          ? 'copy'
          : tool === 'text'
          ? 'text'
          : tool === 'pen'
          ? 'default'
          : tool === 'shape'
          ? 'crosshair'
          : 'default';
    }
  }, [tool]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      className="bg-white border border-gray-300 rounded-md shadow-lg absolute"
      style={{ width: `${width}px`, height: `${height}px`, zIndex: 10 }}
    />
  );
};

export default Canvas;
