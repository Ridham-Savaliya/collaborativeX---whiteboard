
'use client';
import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { throttle, debounce } from 'lodash';
import NavBar from './RightNavbar';
import { WhiteboardElement, PathElement, ShapeElement, TextElement, StickyNote, Point } from './Types';

interface CanvasProps {
  strokeColor: string;
  lineWidth: number;
  tool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null;
  shapeType:
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
  stickyNotes: StickyNote[];
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  textFontSize: number;
  saveToHistory: (elements: WhiteboardElement[]) => void;
  historyIndex: number;
  history: WhiteboardElement[][];
}

interface StickyNoteProps {
  note: StickyNote;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeNoteId: string | null;
  editingNoteId: string | null;
  handleStickyNoteMouseDown: (e: React.MouseEvent<HTMLDivElement>, noteId: string) => void;
  handleStickyNoteDoubleClick: (e: React.MouseEvent<HTMLDivElement>, noteId: string) => void;
  handleStickyNoteTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>, noteId: string) => void;
  handleFinishEditing: () => void;
  handleDeleteStickyNote: (noteId: string) => void;
  handleResizeStart: (e: React.MouseEvent<HTMLDivElement>, noteId: string, direction: string) => void;
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
}

const StickyNoteComponent = memo(
  ({
    note,
    zoomLevel,
    panOffset,
    activeNoteId,
    editingNoteId,
    handleStickyNoteMouseDown,
    handleStickyNoteDoubleClick,
    handleStickyNoteTextChange,
    handleFinishEditing,
    handleDeleteStickyNote,
    handleResizeStart,
    setStickyNotes,
  }: StickyNoteProps) => {
    const noteColors = [
      { bg: '#FEF7CD', text: '#000000' }, // Yellow
      { bg: '#D3E4FD', text: '#000000' }, // Blue
      { bg: '#E5DEFF', text: '#000000' }, // Purple
      { bg: '#F2FCE2', text: '#000000' }, // Green
      { bg: '#FFDEE2', text: '#000000' }, // Pink
      { bg: '#FDE1D3', text: '#000000' }, // Orange
    ];

    return (
      <div
        key={note.id}
        data-note-id={note.id}
        className={`sticky-note-element absolute shadow-md rounded-md overflow-visible transition-shadow duration-200 ${
          activeNoteId === note.id ? 'z-20 shadow-lg' : 'z-10'
        }`}
        style={{
          width: `${note.width * zoomLevel}px`,
          height: `${note.height * zoomLevel}px`,
          backgroundColor: note.bgColor,
          fontSize: `${14 * zoomLevel}px`,
          transition: editingNoteId === note.id ? 'none' : 'box-shadow 0.2s ease-in-out, transform 0.1s ease-in-out',
          boxShadow: activeNoteId === note.id ? '0 4px 20px rgba(151, 44, 240, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.15)',
          transform: `translate(${note.x * zoomLevel + panOffset.x * zoomLevel}px, ${note.y * zoomLevel + panOffset.y * zoomLevel}px)`,
          border: '1px solid rgba(0,0,0,0.1)',
        }}
        onMouseDown={(e) => handleStickyNoteMouseDown(e, note.id)}
        onDoubleClick={(e) => handleStickyNoteDoubleClick(e, note.id)}
      >
        <div
          className={`h-full w-full rounded-md flex flex-col ${activeNoteId === note.id ? 'ring-2 ring-purple-500' : ''}`}
        >
          <div className="p-2 h-full flex flex-col">
            <div className="flex justify-between mb-1">
              <div className="flex space-x-1">
                {activeNoteId === note.id && editingNoteId === note.id && (
                  noteColors.map((color, index) => (
                    <button
                      key={index}
                      className={`w-4 h-4 rounded-full border ${
                        note.bgColor === color.bg ? 'ring-1 ring-black' : ''
                      }`}
                      style={{ backgroundColor: color.bg }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStickyNotes((prev) =>
                          prev.map((n) => (n.id === note.id ? { ...n, bgColor: color.bg, textColor: color.text } : n))
                        );
                      }}
                    />
                  ))
                )}
              </div>
              <button
                className="hover:bg-black/10 rounded-full p-1 opacity-50 hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStickyNote(note.id);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {editingNoteId === note.id ? (
              <>
                <textarea
                  className="flex-1 bg-transparent border-none resize-none focus:outline-none p-1 overflow-auto"
                  style={{ color: note.textColor, fontSize: `${14 * zoomLevel}px` }}
                  value={note.text}
                  onChange={(e) => handleStickyNoteTextChange(e, note.id)}
                  autoFocus
                  onBlur={handleFinishEditing}
                  onFocus={(e) => {
                    if (e.target.value === 'Double-click to edit' || e.target.value === '') {
                      e.target.select();
                    }
                  }}
                  placeholder="Enter text here"
                  rows={5}
                />
              </>
            ) : (
              <div
                className="flex-1 p-1 overflow-auto cursor-move whitespace-pre-wrap"
                style={{ color: note.textColor, fontSize: `${14 * zoomLevel}px` }}
              >
                {note.text || 'Double-click to edit'}
              </div>
            )}
          </div>
        </div>

        {activeNoteId === note.id && !editingNoteId && (
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full transform translate-x-1/2 translate-y-1/2 cursor-se-resize z-30 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'se')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 bg-purple-500 rounded-full transform -translate-x-1/2 translate-y-1/2 cursor-sw-resize z-30 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'sw')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 bg-purple-500 rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-ne-resize z-30 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'ne')}
            />
            <div
              className="absolute top-0 left-0 w-4 h-4 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-nw-resize z-30 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'nw')}
            />
          </>
        )}
      </div>
    );
  }
);

StickyNoteComponent.displayName = 'StickyNoteComponent';

const Canvas: React.FC<CanvasProps> = ({
  strokeColor,
  lineWidth,
  tool,
  shapeType,
  stickyNotes,
  setStickyNotes,
  textFontSize,
  saveToHistory,
  historyIndex,
  history,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [isResizingNote, setIsResizingNote] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const tempNoteState = useRef<StickyNote | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<Point | null>(null);
  const stickyNoteColors = [
    '#FEF7CD', // Yellow
    '#D3E4FD', // Blue
    '#E5DEFF', // Purple
    '#F2FCE2', // Green
    '#FFDEE2', // Pink
    '#FDE1D3', // Orange
  ];

  // Debounced saveToHistory
  const debouncedSaveToHistory = useCallback(
    debounce((elements: WhiteboardElement[]) => {
      saveToHistory(elements);
    }, 100),
    [saveToHistory]
  );

  // Handle spacebar for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingTextId && !editingNoteId) {
        setIsPanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
        setPanStart(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingTextId, editingNoteId]);

  // Initialize canvas with proper dimensions
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up canvas context
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      setContext(ctx);
    }
  }, [strokeColor, lineWidth]);

  // Handle canvas resize and DPR
  useEffect(() => {
    if (!canvasRef.current || !context) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasDimensions.width * dpr;
    canvas.height = canvasDimensions.height * dpr;

    canvas.style.width = `${canvasDimensions.width}px`;
    canvas.style.height = `${canvasDimensions.height}px`;

    context.scale(dpr * zoomLevel, dpr * zoomLevel);
    redrawCanvas();
  }, [canvasDimensions, zoomLevel, context]);

  // Redraw when elements change
  useEffect(() => {
    redrawCanvas();
  }, [elements]);

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Draw single element
  const drawElement = useCallback(
    (element: WhiteboardElement) => {
      if (!context) return;

      if (element.type === 'stickyNote') return;

      if (element.type === 'text') {
        const textElement = element as TextElement;
        context.font = `${textElement.fontSize * zoomLevel}px sans-serif`;
        context.fillStyle = textElement.color;
        context.fillText(textElement.text, textElement.x + panOffset.x, textElement.y + panOffset.y);
        return;
      }

      const pathElement = element as PathElement;
      if (pathElement.type === 'path' && pathElement.points && pathElement.points.length > 1) {
        context.beginPath();
        context.moveTo(pathElement.points[0].x + panOffset.x, pathElement.points[0].y + panOffset.y);

        context.strokeStyle = pathElement.color;
        context.lineWidth = pathElement.width;

        if (pathElement.tool === 'eraser') {
          context.globalCompositeOperation = 'destination-out';
        } else if (pathElement.tool === 'highlighter') {
          context.globalCompositeOperation = 'multiply';
          context.globalAlpha = 0.5;
        } else {
          context.globalCompositeOperation = 'source-over';
          context.globalAlpha = 1.0;
        }

        for (let i = 1; i < pathElement.points.length; i++) {
          context.lineTo(pathElement.points[i].x + panOffset.x, pathElement.points[i].y + panOffset.y);
        }
        context.stroke();

        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1.0;
      } else if ('type' in element && element.type !== 'path' && element.type !== 'stickyNote' && element.type !== 'text') {
        const shapeElement = element as ShapeElement;
        context.beginPath();
        context.strokeStyle = shapeElement.color;
        context.lineWidth = shapeElement.lineWidth;
        context.fillStyle = 'transparent';

        switch (shapeElement.type) {
          case 'rectangle':
            context.rect(
              shapeElement.x + panOffset.x,
              shapeElement.y + panOffset.y,
              shapeElement.width,
              shapeElement.height
            );
            break;
          case 'circle':
            context.ellipse(
              shapeElement.x + shapeElement.width / 2 + panOffset.x,
              shapeElement.y + shapeElement.height / 2 + panOffset.y,
              Math.abs(shapeElement.width / 2),
              Math.abs(shapeElement.height / 2),
              0,
              0,
              Math.PI * 2
            );
            break;
          case 'line':
            context.moveTo(shapeElement.x + panOffset.x, shapeElement.y + panOffset.y);
            context.lineTo(
              shapeElement.x + shapeElement.width + panOffset.x,
              shapeElement.y + shapeElement.height + panOffset.y
            );
            break;
          case 'triangle':
            context.moveTo(shapeElement.x + shapeElement.width / 2 + panOffset.x, shapeElement.y + panOffset.y);
            context.lineTo(shapeElement.x + panOffset.x, shapeElement.y + shapeElement.height + panOffset.y);
            context.lineTo(
              shapeElement.x + shapeElement.width + panOffset.x,
              shapeElement.y + shapeElement.height + panOffset.y
            );
            context.closePath();
            break;
          case 'diamond':
            context.moveTo(shapeElement.x + shapeElement.width / 2 + panOffset.x, shapeElement.y + panOffset.y);
            context.lineTo(
              shapeElement.x + shapeElement.width + panOffset.x,
              shapeElement.y + shapeElement.height / 2 + panOffset.y
            );
            context.lineTo(
              shapeElement.x + shapeElement.width / 2 + panOffset.x,
              shapeElement.y + shapeElement.height + panOffset.y
            );
            context.lineTo(shapeElement.x + panOffset.x, shapeElement.y + shapeElement.height / 2 + panOffset.y);
            context.closePath();
            break;
          // ... keep existing code for other shape types
        }

        context.stroke();
      }
    },
    [context, zoomLevel, panOffset]
  );

  // Helper function to draw a regular polygon
  const drawPolygon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) => {
    if (sides < 3) return;

    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const vertexX = x + radius * Math.cos(angle);
      const vertexY = y + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(vertexX, vertexY);
      } else {
        ctx.lineTo(vertexX, vertexY);
      }
    }
    ctx.closePath();
  };

  // Redraw the entire canvas
  const redrawCanvas = useCallback(() => {
    if (!context || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(dpr * zoomLevel, dpr * zoomLevel);
    context.translate(panOffset.x, panOffset.y);

    // Draw grid
    context.strokeStyle = '#80008030';
    context.lineWidth = 0.5 / zoomLevel;
    const gridSize = 30;
    const canvasWidth = canvas.width / (dpr * zoomLevel);
    const canvasHeight = canvas.height / (dpr * zoomLevel);

    for (let x = -panOffset.x % gridSize; x <= canvasWidth; x += gridSize) {
      context.beginPath();
      context.moveTo(x, -panOffset.y);
      context.lineTo(x, canvasHeight - panOffset.y);
      context.stroke();
    }

    for (let y = -panOffset.y % gridSize; y <= canvasHeight; y += gridSize) {
      context.beginPath();
      context.moveTo(-panOffset.x, y);
      context.lineTo(canvasWidth - panOffset.x, y);
      context.stroke();
    }

    for (const element of elements) {
      drawElement(element);
    }

    if (currentElement) {
      drawElement(currentElement);
    }

    context.restore();
  }, [context, elements, drawElement, currentElement, zoomLevel, panOffset]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    if (history.length > 0 && historyIndex >= 0) {
      setElements(history[historyIndex]);
    }
  }, [history, historyIndex]);

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoomLevel - panOffset.x,
      y: (clientY - rect.top) / zoomLevel - panOffset.y,
    };
  };

  // Handle mouse down for drawing, panning, or manipulating sticky notes
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;

    if (isDraggingNote || isResizingNote || editingTextId) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    if (isPanning) {
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const clickedNoteId = isOverStickyNote(e);
    if (clickedNoteId) {
      if (activeNoteId !== clickedNoteId) {
        setActiveNoteId(clickedNoteId);
      }
      return;
    } else {
      setActiveNoteId(null);
      if (editingNoteId !== null) {
        setEditingNoteId(null);
      }
    }

    if (tool === 'stickyNote') {
      const id = generateId();
      // Choose a random color from stickyNoteColors
      const randomColor = stickyNoteColors[Math.floor(Math.random() * stickyNoteColors.length)];
      
      const newNote: StickyNote = {
        id,
        type: 'stickyNote',
        x,
        y,
        width: 200,
        height: 200,
        text: '',
        textColor: '#000000',
        bgColor: randomColor,
      };
      
      setStickyNotes((prev) => [...prev, newNote]);
      setActiveNoteId(id);
      setEditingNoteId(id); // Start in editing mode
      
      // Add a timeout to ensure the sticky note has been rendered before focusing
      setTimeout(() => {
        const textarea = document.querySelector(`[data-note-id="${id}"] textarea`) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
        }
      }, 50);
      
      debouncedSaveToHistory(elements);
      return;
    }

    if (tool === 'text') {
      const newTextId = generateId();
      setEditingTextId(newTextId);
      setTextInputValue('');
      const newElement: TextElement = {
        id: newTextId,
        type: 'text',
        x,
        y,
        text: '',
        color: strokeColor,
        fontSize: textFontSize,
      };
      setElements((prev) => [...prev, newElement]);
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.style.left = `${e.clientX}px`;
          textInputRef.current.style.top = `${e.clientY + 5}px`;
          textInputRef.current.style.display = 'block';
          textInputRef.current.focus();
        }
      }, 50);
      return;
    }

    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      setIsDrawing(true);

      const newElement: PathElement = {
        id: generateId(),
        type: 'path',
        points: [{ x, y }],
        color: tool === 'eraser' ? '#FFFFFF' : tool === 'highlighter' ? strokeColor : strokeColor,
        width: tool === 'highlighter' ? 15 : lineWidth,
        tool,
      };
      setCurrentElement(newElement);
    } else if (tool === 'shape' && shapeType) {
      setIsDrawing(true);
      setStartPoint({ x, y });

      const newElement: ShapeElement = {
        id: generateId(),
        type: shapeType,
        x,
        y,
        width: 0,
        height: 0,
        color: strokeColor,
        lineWidth,
      };
      setCurrentElement(newElement);
    }
  };

  // Throttled mouse move handler
  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!context) return;

      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

      if (isPanning && panStart) {
        const dx = (e.clientX - panStart.x) / zoomLevel;
        const dy = (e.clientY - panStart.y) / zoomLevel;
        setPanOffset((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
        redrawCanvas();
        return;
      }

      if (isDraggingNote && activeNoteId && tempNoteState.current) {
        tempNoteState.current = {
          ...tempNoteState.current,
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        };
        setStickyNotes((prev) =>
          prev.map((note) => (note.id === activeNoteId ? { ...tempNoteState.current! } : note))
        );
        return;
      }

      if (isResizingNote && activeNoteId && resizeDirection && tempNoteState.current) {
        let newX = tempNoteState.current.x;
        let newY = tempNoteState.current.y;
        let newWidth = tempNoteState.current.width;
        let newHeight = tempNoteState.current.height;
        const MIN_SIZE = 100;

        switch (resizeDirection) {
          case 'se':
            newWidth = Math.max(MIN_SIZE, x - tempNoteState.current.x);
            newHeight = Math.max(MIN_SIZE, y - tempNoteState.current.y);
            break;
          case 'sw':
            newWidth = Math.max(MIN_SIZE, tempNoteState.current.x + tempNoteState.current.width - x);
            newX = Math.min(tempNoteState.current.x + tempNoteState.current.width - MIN_SIZE, x);
            newHeight = Math.max(MIN_SIZE, y - tempNoteState.current.y);
            break;
          case 'ne':
            newWidth = Math.max(MIN_SIZE, x - tempNoteState.current.x);
            newHeight = Math.max(MIN_SIZE, tempNoteState.current.y + tempNoteState.current.height - y);
            newY = Math.min(tempNoteState.current.y + tempNoteState.current.height - MIN_SIZE, y);
            break;
          case 'nw':
            newWidth = Math.max(MIN_SIZE, tempNoteState.current.x + tempNoteState.current.width - x);
            newX = Math.min(tempNoteState.current.x + tempNoteState.current.width - MIN_SIZE, x);
            newHeight = Math.max(MIN_SIZE, tempNoteState.current.y + tempNoteState.current.height - y);
            newY = Math.min(tempNoteState.current.y + tempNoteState.current.height - MIN_SIZE, y);
            break;
        }

        tempNoteState.current = { ...tempNoteState.current, x: newX, y: newY, width: newWidth, height: newHeight };
        setStickyNotes((prev) =>
          prev.map((note) => (note.id === activeNoteId ? { ...tempNoteState.current! } : note))
        );
        return;
      }

      if (!isDrawing || !currentElement) return;

      if ('points' in currentElement) {
        const updatedElement = {
          ...currentElement,
          points: [...currentElement.points, { x, y }],
        };
        setCurrentElement(updatedElement);
      } else if (startPoint && 'width' in currentElement) {
        const updatedElement = {
          ...currentElement,
          width: x - startPoint.x,
          height: y - startPoint.y,
        };
        setCurrentElement(updatedElement);
      }

      redrawCanvas();
    }, 8),
    [
      context,
      isPanning,
      panStart,
      isDraggingNote,
      isResizingNote,
      activeNoteId,
      resizeDirection,
      dragOffset,
      isDrawing,
      currentElement,
      startPoint,
      zoomLevel,
      panOffset,
      redrawCanvas,
    ]
  );

  // Handle mouse up for completing drawing, panning, or manipulating sticky notes
  const handleMouseUp = () => {
    if (isPanning) {
      setPanStart(null);
      return;
    }

    if (isDraggingNote || isResizingNote) {
      if (tempNoteState.current && activeNoteId) {
        setStickyNotes((prev) =>
          prev.map((note) => (note.id === activeNoteId ? { ...tempNoteState.current! } : note))
        );
        debouncedSaveToHistory(elements);
      }
      setIsDraggingNote(false);
      setIsResizingNote(false);
      setResizeDirection(null);
      tempNoteState.current = null;
      return;
    }

    if (!isDrawing || !currentElement) return;

    setIsDrawing(false);
    setStartPoint(null);

    if ('points' in currentElement) {
      if (currentElement.points && currentElement.points.length > 1) {
        const newElements = [...elements, currentElement];
        setElements(newElements);
        debouncedSaveToHistory(newElements);
      }
    } else if ('width' in currentElement) {
      const shape = currentElement as ShapeElement;
      if (shape.width !== 0 || shape.height !== 0) {
        const fixedShape = {
          ...shape,
          x: shape.width < 0 ? shape.x + shape.width : shape.x,
          y: shape.height < 0 ? shape.y + shape.height : shape.y,
          width: Math.abs(shape.width),
          height: Math.abs(shape.height),
        };

        const newElements = [...elements, fixedShape];
        setElements(newElements);
        debouncedSaveToHistory(newElements);
      }
    }

    setCurrentElement(null);
    redrawCanvas();
  };

  // Check if mouse is over a sticky note
  const isOverStickyNote = (e: React.MouseEvent<HTMLCanvasElement>): string | null => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    for (const note of stickyNotes) {
      if (x >= note.x && x <= note.x + note.width && y >= note.y && y <= note.y + note.height) {
        return note.id;
      }
    }

    return null;
  };

  // Handle sticky note mouse down
  const handleStickyNoteMouseDown = (e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    e.stopPropagation();

    setActiveNoteId(noteId);

    const note = stickyNotes.find((n) => n.id === noteId);
    if (!note) {
      console.error('Note not found:', noteId);
      return;
    }

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    setDragOffset({
      x: x - note.x,
      y: y - note.y,
    });

    tempNoteState.current = { ...note };
    setIsDraggingNote(true);
  };

  // Handle sticky note resize start
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, noteId: string, direction: string) => {
    e.stopPropagation();
    e.preventDefault();

    setActiveNoteId(noteId);
    setIsResizingNote(true);
    setResizeDirection(direction);

    const note = stickyNotes.find((n) => n.id === noteId);
    if (!note) {
      console.error('Note not found for resizing:', noteId);
      return;
    }

    tempNoteState.current = { ...note };

    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }
  };

  // Handle sticky note double click
  const handleStickyNoteDoubleClick = (e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    e.stopPropagation();
    setEditingNoteId(noteId);
    setTimeout(() => {
      const textarea = document.querySelector(`[data-note-id="${noteId}"] textarea`) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
      }
    }, 10);
  };

  // Handle sticky note text change
  const handleStickyNoteTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, noteId: string) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, text: e.target.value } : note))
    );
  };

  // Handle finishing editing sticky note
  const handleFinishEditing = () => {
    setEditingNoteId(null);
    debouncedSaveToHistory(elements);
  };

  // Handle text input change
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInputValue(e.target.value);
  };

  // Handle finishing text editing
  const handleFinishTextEditing = () => {
    if (editingTextId) {
      const finalText = textInputValue.trim();
      const newElements = finalText
        ? elements.map((el) =>
            el.id === editingTextId && el.type === 'text' ? { ...el, text: finalText } : el
          )
        : elements.filter((el) => el.id !== editingTextId);
      setElements(newElements);
      debouncedSaveToHistory(newElements);
    }
    setEditingTextId(null);
    setTextInputValue('');
    if (textInputRef.current) {
      textInputRef.current.style.display = 'none';
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 4.0));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  };

  // Handle deleting a sticky note
  const handleDeleteStickyNote = (noteId: string) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (activeNoteId === noteId) setActiveNoteId(null);
    if (editingNoteId === noteId) setEditingNoteId(null);
    debouncedSaveToHistory(elements);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-gray-50 overflow-hidden select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className={`touch-none ${isPanning ? 'cursor-grab' : tool === 'stickyNote' || tool === 'text' ? 'cursor-cell' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />

      <textarea
        ref={textInputRef}
        className="absolute bg-white/80 border-2 rounded-lg shadow-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
        style={{
          display: 'none',
          width: `${200 * zoomLevel}px`,
          height: `${50 * zoomLevel}px`,
          fontSize: `${textFontSize * zoomLevel}px`,
          color: strokeColor,
          borderColor: strokeColor,
          top: '0px',
          left: '0px',
        }}
        value={textInputValue}
        onChange={handleTextInputChange}
        onBlur={handleFinishTextEditing}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFinishTextEditing();
          }
        }}
        placeholder="Enter text"
      />

      {stickyNotes.map((note) => (
        <StickyNoteComponent
          key={note.id}
          note={note}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          activeNoteId={activeNoteId}
          editingNoteId={editingNoteId}
          handleStickyNoteMouseDown={handleStickyNoteMouseDown}
          handleStickyNoteDoubleClick={handleStickyNoteDoubleClick}
          handleStickyNoteTextChange={handleStickyNoteTextChange}
          handleFinishEditing={handleFinishEditing}
          handleDeleteStickyNote={handleDeleteStickyNote}
          handleResizeStart={handleResizeStart}
          setStickyNotes={setStickyNotes}
        />
      ))}

      <div className="absolute bottom-5 right-5 flex items-center bg-purple-600 text-white rounded-md shadow-lg z-30">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-l-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={zoomLevel <= 0.25}
          aria-label="Zoom out"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
        <span className="px-3 border-l border-r border-purple-500 text-sm select-none">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-r-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={zoomLevel >= 4.0}
          aria-label="Zoom in"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
      </div>

      <NavBar />
    </div>
  );
};

export default Canvas;
