import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { throttle, debounce } from 'lodash';
import NavBar from './RightNavbar';
import { WhiteboardElement, PathElement, ShapeElement, TextElement, StickyNote, Point } from './Types';
import CanvasToolbar from './CanvasToolbar';

interface CanvasProps {
  strokeColor: string;
  lineWidth: number;
  tool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null;
  shapeType: string | null;
  stickyNotes: StickyNote[];
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  textFontSize: number;
  saveToHistory: (state: { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }) => void;
  historyIndex: number;
  history: { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }[];
  textStyles: { bold: boolean; italic: boolean; underline: boolean; fontFamily: string };
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
  showColorPicker: (noteId: string, x: number, y: number) => void;
  textStyles: { bold: boolean; italic: boolean; underline: boolean; fontFamily: string };
  textFontSize: number;
}

interface TextComponentProps {
  textElement: TextElement;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeTextId: string | null;
  editingTextId: string | null;
  handleTextMouseDown: (e: React.MouseEvent<HTMLDivElement>, textId: string) => void;
  handleTextDoubleClick: (e: React.MouseEvent<HTMLDivElement>, textId: string) => void;
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>, textId: string) => void;
  handleFinishTextEditing: () => void;
  setElements: React.Dispatch<React.SetStateAction<WhiteboardElement[]>>;
  textStyles: { bold: boolean; italic: boolean; underline: boolean; fontFamily: string };
  textFontSize: number;
}

const generateUniqueId = (): string => `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

const isValidId = (id: string | undefined): boolean => id !== undefined && id !== null && id !== '';

const colorPalette = [
  { bg: '#FEF7CD', text: '#000000' },
  { bg: '#D3E4FD', text: '#000000' },
  { bg: '#E5DEFF', text: '#000000' },
  { bg: '#F2FCE2', text: '#000000' },
  { bg: '#FFDEE2', text: '#000000' },
  { bg: '#FDE1D3', text: '#000000' },
  { bg: '#FFD700', text: '#000000' },
  { bg: '#98FB98', text: '#000000' },
  { bg: '#FFB6C1', text: '#000000' },
  { bg: '#ADD8E6', text: '#000000' },
  { bg: '#FFFACD', text: '#000000' },
  { bg: '#E6E6FA', text: '#000000' },
  { bg: '#FFFFFF', text: '#000000' },
  { bg: '#D3D3D3', text: '#000000' },
  { bg: '#A9A9A9', text: '#FFFFFF' },
  { bg: '#000000', text: '#FFFFFF' },
];

const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1).padStart(6, '0')}`;
};

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
    showColorPicker,
    textStyles,
    textFontSize,
  }: StickyNoteProps) => {
    if (!isValidId(note.id)) {
      console.error('Invalid note ID', note);
      return null;
    }

    const adjustedX = note.x * zoomLevel + panOffset.x;
    const adjustedY = note.y * zoomLevel + panOffset.y;

    return (
      <div
        data-note-id={note.id}
        className={`absolute rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
          activeNoteId === note.id
            ? 'z-1 shadow-2xl ring-2 ring-purple-400 transform scale-105'
            : 'z-0 shadow-lg hover:shadow-xl'
        }`}
        style={{
          width: `${note.width * zoomLevel}px`,
          height: `${note.height * zoomLevel}px`,
          background: `linear-gradient(145deg, ${note.bgColor}, ${darkenColor(note.bgColor, 10)})`,
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          border: '1px solid rgba(0,0,0,0.1)',
        }}
        onMouseDown={(e) => handleStickyNoteMouseDown(e, note.id)}
        onDoubleClick={(e) => handleStickyNoteDoubleClick(e, note.id)}
      >
        <div className="h-full w-full flex flex-col">
          <div className="flex justify-between items-center p-2 bg-gradient-to-r from-black/5 to-transparent">
            <button
              className="relative group bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full p-1.5 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 transform hover:scale-110 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                showColorPicker(note.id, rect.right + 8, rect.top);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={note.bgColor}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="absolute hidden group-hover:block text-xs text-white bg-gray-800 rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2">
                Change Color
              </span>
            </button>
            <button
              className="relative group bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full p-1.5 hover:from-red-600 hover:to-red-800 transition-all duration-200 transform hover:scale-110 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStickyNote(note.id);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span className="absolute hidden group-hover:block text-xs text-white bg-gray-800 rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2">
                Delete
              </span>
            </button>
          </div>
          <div className="flex-1 p-3">
            {editingNoteId === note.id ? (
              <textarea
                className="w-full h-full bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-md p-2 transition-all duration-200 whitespace-normal break-words"
                style={{
                  color: note.textColor,
                  fontSize: `${textFontSize * zoomLevel}px`,
                  fontWeight: textStyles.bold ? 'bold' : 'normal',
                  fontStyle: textStyles.italic ? 'italic' : 'normal',
                  textDecoration: textStyles.underline ? 'underline' : 'none',
                  fontFamily: textStyles.fontFamily,
                }}
                value={note.text}
                onChange={(e) => handleStickyNoteTextChange(e, note.id)}
                autoFocus
                onBlur={handleFinishEditing}
                placeholder="Enter text here"
                rows={5}
              />
            ) : (
              <div
                className="w-full h-full overflow-y-auto overflow-x-hidden cursor-move whitespace-normal break-words select-text"
                style={{
                  color: note.textColor,
                  fontSize: `${textFontSize * zoomLevel}px`,
                  fontWeight: textStyles.bold ? 'bold' : 'normal',
                  fontStyle: textStyles.italic ? 'italic' : 'normal',
                  textDecoration: textStyles.underline ? 'underline' : 'none',
                  fontFamily: textStyles.fontFamily,
                }}
              >
                {note.text || 'Double-click to edit'}
              </div>
            )}
          </div>
        </div>
        {activeNoteId === note.id && !editingNoteId && (
          <>
            <div
              className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 translate-y-1/2 cursor-se-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'se')}
            />
            <div
              className="absolute bottom-0 left-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 translate-y-1/2 cursor-sw-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'sw')}
            />
            <div
              className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-ne-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'ne')}
            />
            <div
              className="absolute top-0 left-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-nw-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, 'nw')}
            />
          </>
        )}
      </div>
    );
  }
);

StickyNoteComponent.displayName = 'StickyNoteComponent';

const TextComponent = memo(
  ({
    textElement,
    zoomLevel,
    panOffset,
    activeTextId,
    editingTextId,
    handleTextMouseDown,
    handleTextDoubleClick,
    handleTextChange,
    handleFinishTextEditing,
    setElements,
    textStyles,
    textFontSize,
  }: TextComponentProps) => {
    if (!isValidId(textElement.id)) {
      console.error('Invalid text element ID', textElement);
      return null;
    }

    const adjustedX = textElement.x * zoomLevel + panOffset.x;
    const adjustedY = textElement.y * zoomLevel + panOffset.y;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (editingTextId === textElement.id && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, [editingTextId, textElement.id]);

    return (
      <div
        data-text-id={textElement.id}
        className={`absolute shadow-md rounded-md overflow-visible transition-shadow duration-200 ${
          activeTextId === textElement.id ? 'z-20 shadow-xl ring-2 ring-purple-500' : 'z-10'
        }`}
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          cursor: editingTextId === textElement.id ? 'text' : 'move',
        }}
        onMouseDown={(e) => handleTextMouseDown(e, textElement.id)}
        onDoubleClick={(e) => handleTextDoubleClick(e, textElement.id)}
      >
        {editingTextId === textElement.id ? (
          <textarea
            ref={textareaRef}
            className="bg-transparent border-none resize-none focus:outline-none p-1 rounded-md overflow-y-auto overflow-x-hidden whitespace-pre-wrap"
            style={{
              color: textElement.color,
              fontSize: `${textFontSize * zoomLevel}px`,
              fontWeight: textStyles.bold ? 'bold' : 'normal',
              fontStyle: textStyles.italic ? 'italic' : 'normal',
              textDecoration: textStyles.underline ? 'underline' : 'none',
              fontFamily: textStyles.fontFamily,
              minWidth: '100px',
              minHeight: '30px',
            }}
            value={textElement.text}
            onChange={(e) => handleTextChange(e, textElement.id)}
            onBlur={handleFinishTextEditing}
            placeholder="Enter text here"
          />
        ) : (
          <div
            className="p-1 rounded-md overflow-y-auto overflow-x-hidden cursor-move whitespace-pre-wrap"
            style={{
              color: textElement.color,
              fontSize: `${textFontSize * zoomLevel}px`,
              fontWeight: textStyles.bold ? 'bold' : 'normal',
              fontStyle: textStyles.italic ? 'italic' : 'normal',
              textDecoration: textStyles.underline ? 'underline' : 'none',
              fontFamily: textStyles.fontFamily,
            }}
          >
            {textElement.text || 'Double-click to edit'}
          </div>
        )}
        {activeTextId === textElement.id && !editingTextId && (
          <button
            className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              setElements((prev) => prev.filter((el) => el.id !== textElement.id));
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

TextComponent.displayName = 'TextComponent';

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
  textStyles,
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
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isResizingNote, setIsResizingNote] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [colorPicker, setColorPicker] = useState<{ noteId: string; x: number; y: number } | null>(null);
  const stickyNoteColors = ['#FEF7CD', '#D3E4FD', '#E5DEFF', '#F2FCE2', '#FFDEE2', '#FDE1D3'];
  const tempNoteState = useRef<StickyNote | null>(null);
  const tempTextState = useRef<TextElement | null>(null);
  const newTextIdRef = useRef<string | null>(null);

  const idCounter = useRef(0);
  const generateId = useCallback(() => {
    idCounter.current += 1;
    return `${Date.now().toString(36)}-${idCounter.current}-${Math.random().toString(36).substring(2, 10)}`;
  }, []);

  const debouncedSaveToHistory = useCallback(
    debounce((elements: WhiteboardElement[], stickyNotes: StickyNote[]) => {
      saveToHistory({ elements, stickyNotes });
    }, 100),
    [saveToHistory]
  );

  const uniqueStickyNotes = React.useMemo(() => {
    const seenIds = new Set<string>();
    return stickyNotes
      .filter((note) => {
        if (!note || !isValidId(note.id)) {
          console.warn('Invalid sticky note', note);
          return false;
        }
        return true;
      })
      .map((note) => {
        const noteCopy = { ...note };
        if (seenIds.has(noteCopy.id)) {
          noteCopy.id = generateId();
        }
        seenIds.add(noteCopy.id);
        return noteCopy;
      });
  }, [stickyNotes, generateId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingTextId && !editingNoteId) setIsPanning(true);
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

  useEffect(() => {
    if (history.length > 0 && historyIndex >= 0 && historyIndex < history.length) {
      const { elements = [], stickyNotes = [] } = history[historyIndex] || {};
      setElements(Array.isArray(elements) ? elements : []);
      setStickyNotes(Array.isArray(stickyNotes) ? stickyNotes : []);
    } else {
      console.warn('Invalid history or historyIndex:', { history, historyIndex });
      setElements([]);
      setStickyNotes([]);
    }
  }, [history, historyIndex, setStickyNotes]);

  const drawElement = useCallback(
    (element: WhiteboardElement) => {
      if (!context || !element) return;
      if (element.type === 'stickyNote' || element.type === 'text') return;
      const pathElement = element as PathElement;
      if (pathElement.type === 'path' && pathElement.points?.length > 1) {
        context.beginPath();
        context.moveTo(pathElement.points[0].x * zoomLevel + panOffset.x, pathElement.points[0].y * zoomLevel + panOffset.y);
        context.strokeStyle = pathElement.color;
        context.lineWidth = pathElement.width * zoomLevel;
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
          context.lineTo(pathElement.points[i].x * zoomLevel + panOffset.x, pathElement.points[i].y * zoomLevel + panOffset.y);
        }
        context.stroke();
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1.0;
      } else if (element.type !== 'path') {
        const shapeElement = element as ShapeElement;
        context.beginPath();
        context.strokeStyle = shapeElement.color;
        context.lineWidth = shapeElement.lineWidth * zoomLevel;
        context.fillStyle = 'transparent';
        const x = shapeElement.x * zoomLevel + panOffset.x;
        const y = shapeElement.y * zoomLevel + panOffset.y;
        const width = shapeElement.width * zoomLevel;
        const height = shapeElement.height * zoomLevel;
        switch (shapeElement.type) {
          case 'rectangle':
            context.rect(x, y, width, height);
            break;
          case 'circle':
            context.ellipse(x + width / 2, y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2);
            break;
          case 'line':
            context.moveTo(x, y);
            context.lineTo(x + width, y + height);
            break;
          case 'triangle':
            context.moveTo(x + width / 2, y);
            context.lineTo(x, y + height);
            context.lineTo(x + width, y + height);
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
            const spikes = 5;
            const outerRadius = Math.min(width, height) / 2;
            const innerRadius = outerRadius / 2.5;
            const cx = x + width / 2;
            const cy = y + height / 2;
            let rot = (Math.PI / 2) * 3;
            context.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
              context.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
              rot += Math.PI / spikes;
              context.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
              rot += Math.PI / spikes;
            }
            context.closePath();
            break;
          case 'arrow':
            const headLength = Math.min(width, height) * 0.3;
            context.moveTo(x, y + height / 2);
            context.lineTo(x + width - headLength, y + height / 2);
            context.lineTo(x + width - headLength, y);
            context.lineTo(x + width, y + height / 2);
            context.lineTo(x + width - headLength, y + height);
            context.lineTo(x + width - headLength, y + height / 2);
            context.lineTo(x, y + height / 2);
            context.closePath();
            break;
          case 'heart':
            const cxh = x + width / 2;
            const cyh = y + height / 4;
            context.moveTo(cxh, cyh + height / 2);
            context.bezierCurveTo(cxh - width / 2, cyh + height / 2, cxh - width / 2, cyh - height / 4, cxh, cyh - height / 4);
            context.bezierCurveTo(cxh + width / 2, cyh - height / 4, cxh + width / 2, cyh + height / 2, cxh, cyh + height / 2);
            context.closePath();
            break;
          case 'pentagon':
            context.moveTo(x + width / 2, y);
            for (let i = 1; i <= 5; i++) {
              context.lineTo(
                x + (width / 2) * (1 + Math.cos((Math.PI * 2 * i) / 5 - Math.PI / 2)),
                y + (height / 2) * (1 + Math.sin((Math.PI * 2 * i) / 5 - Math.PI / 2))
              );
            }
            context.closePath();
            break;
          case 'hexagon':
            context.moveTo(x + width / 2, y);
            for (let i = 1; i <= 6; i++) {
              context.lineTo(
                x + (width / 2) * (1 + Math.cos((Math.PI * 2 * i) / 6 - Math.PI / 2)),
                y + (height / 2) * (1 + Math.sin((Math.PI * 2 * i) / 6 - Math.PI / 2))
              );
            }
            context.closePath();
            break;
          case 'heptagon':
            context.moveTo(x + width / 2, y);
            for (let i = 1; i <= 7; i++) {
              context.lineTo(
                x + (width / 2) * (1 + Math.cos((Math.PI * 2 * i) / 7 - Math.PI / 2)),
                y + (height / 2) * (1 + Math.sin((Math.PI * 2 * i) / 7 - Math.PI / 2))
              );
            }
            context.closePath();
            break;
          case 'octagon':
            context.moveTo(x + width / 2, y);
            for (let i = 1; i <= 8; i++) {
              context.lineTo(
                x + (width / 2) * (1 + Math.cos((Math.PI * 2 * i) / 8 - Math.PI / 2)),
                y + (height / 2) * (1 + Math.sin((Math.PI * 2 * i) / 8 - Math.PI / 2))
              );
            }
            context.closePath();
            break;
          case 'cross':
            context.moveTo(x + width / 2, y);
            context.lineTo(x + width / 2, y + height);
            context.moveTo(x, y + height / 2);
            context.lineTo(x + width, y + height / 2);
            break;
          case 'smiley':
            context.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
            context.moveTo(x + width / 3, y + height / 3);
            context.arc(x + width / 3, y + height / 3, width / 10, 0, Math.PI * 2);
            context.moveTo(x + (2 * width) / 3, y + height / 3);
            context.arc(x + (2 * width) / 3, y + height / 3, width / 10, 0, Math.PI * 2);
            context.moveTo(x + width / 2, y + (2 * height) / 3);
            context.arc(x + width / 2, y + height / 2, width / 4, 0, Math.PI, false);
            break;
          case 'cloud':
            context.moveTo(x + width / 4, y + height);
            context.bezierCurveTo(x, y + height, x, y + height / 2, x + width / 4, y + height / 2);
            context.bezierCurveTo(x + width / 8, y + height / 4, x + (3 * width) / 8, y + height / 4, x + width / 2, y + height / 2);
            context.bezierCurveTo(x + (5 * width) / 8, y + height / 4, x + (7 * width) / 8, y + height / 4, x + (3 * width) / 4, y + height / 2);
            context.bezierCurveTo(x + width, y + height / 2, x + width, y + height, x + (3 * width) / 4, y + height);
            context.closePath();
            break;
        }
        context.stroke();
      }
    },
    [context, zoomLevel, panOffset]
  );

  const redrawCanvas = useCallback(() => {
    if (!context || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(dpr * zoomLevel, dpr * zoomLevel);
    context.translate(panOffset.x, panOffset.y);

    const canvasWidth = canvas.width / (dpr * zoomLevel);
    const canvasHeight = canvas.height / (dpr * zoomLevel);
    const gridSize = 30;

    context.strokeStyle = '#80008030';
    context.lineWidth = 0.5 / zoomLevel;

    const startX = Math.floor((-panOffset.x) / gridSize) * gridSize;
    const startY = Math.floor((-panOffset.y) / gridSize) * gridSize;
    const endX = startX + canvasWidth + gridSize;
    const endY = startY + canvasHeight + gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      context.beginPath();
      context.moveTo(x, startY);
      context.lineTo(x, endY);
      context.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      context.beginPath();
      context.moveTo(startX, y);
      context.lineTo(endX, y);
      context.stroke();
    }

    if (Array.isArray(elements)) {
      for (const element of elements) drawElement(element);
    }
    if (currentElement) drawElement(currentElement);
    context.restore();
  }, [context, elements, drawElement, currentElement, zoomLevel, panOffset]);

  useEffect(() => {
    redrawCanvas();
  }, [elements, context, currentElement, zoomLevel, panOffset, redrawCanvas]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x * zoomLevel) / zoomLevel,
      y: (clientY - rect.top - panOffset.y * zoomLevel) / zoomLevel,
    };
  };

  const getScreenCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const showColorPicker = (noteId: string, x: number, y: number) => {
    setColorPicker({ noteId, x, y });
  };

  const handleColorSelect = (noteId: string, bgColor: string, textColor: string) => {
    setStickyNotes((prev) => {
      const newNotes = prev.map((note) =>
        note.id === noteId ? { ...note, bgColor, textColor } : note
      ).filter((note) => isValidId(note.id));
      debouncedSaveToHistory(elements, newNotes);
      return newNotes;
    });
    setColorPicker(null);
  };

  const isOverStickyNote = (e: React.MouseEvent<HTMLCanvasElement>): string | null => {
    const { x: screenX, y: screenY } = getScreenCoordinates(e.clientX, e.clientY);
    for (const note of uniqueStickyNotes) {
      if (!isValidId(note.id)) continue;
      const noteX = note.x * zoomLevel + panOffset.x;
      const noteY = note.y * zoomLevel + panOffset.y;
      const noteWidth = note.width * zoomLevel;
      const noteHeight = note.height * zoomLevel;
      if (screenX >= noteX && screenX <= noteX + noteWidth && screenY >= noteY && screenY <= noteY + noteHeight) {
        return note.id;
      }
    }
    return null;
  };

  const isOverTextElement = (e: React.MouseEvent<HTMLCanvasElement>): string | null => {
    const { x: screenX, y: screenY } = getScreenCoordinates(e.clientX, e.clientY);
    for (const element of elements) {
      if (element.type === 'text') {
        const textElement = element as TextElement;
        const adjustedX = textElement.x * zoomLevel + panOffset.x;
        const adjustedY = textElement.y * zoomLevel + panOffset.y;
        const textWidth = (textElement.text.length || 10) * (textFontSize * zoomLevel * 0.6);
        const textHeight = textFontSize * zoomLevel * 1.2;
        if (
          screenX >= adjustedX &&
          screenX <= adjustedX + textWidth &&
          screenY >= adjustedY - textHeight &&
          screenY <= adjustedY
        ) {
          return textElement.id;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || colorPicker) return;
    if (isDraggingNote || isResizingNote || isDraggingText || editingTextId || editingNoteId) return;
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(e.clientX, e.clientY);
    if (isPanning) {
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    const clickedNoteId = isOverStickyNote(e);
    if (clickedNoteId) {
      if (activeNoteId !== clickedNoteId) setActiveNoteId(clickedNoteId);
      return;
    } else {
      setActiveNoteId(null);
      if (editingNoteId !== null) setEditingNoteId(null);
    }
    const clickedTextId = isOverTextElement(e);
    if (clickedTextId) {
      setActiveTextId(clickedTextId);
      const textElement = elements.find((el) => el.id === clickedTextId && el.type === 'text') as TextElement;
      if (textElement) {
        tempTextState.current = { ...textElement };
        setDragOffset({
          x: canvasX - textElement.x,
          y: canvasY - textElement.y,
        });
        setIsDraggingText(true);
      }
      return;
    } else {
      setActiveTextId(null);
    }
    if (tool === 'stickyNote') {
      e.stopPropagation();
      const id = generateId();
      const randomColor = stickyNoteColors[Math.floor(Math.random() * stickyNoteColors.length)];
      const noteWidth = 200;
      const noteHeight = 200;
      let adjustedX = canvasX;
      let adjustedY = canvasY;
      const canvasWidth = canvasDimensions.width / zoomLevel;
      const canvasHeight = canvasDimensions.height / zoomLevel;
      adjustedX = Math.max(0, Math.min(adjustedX, canvasWidth - noteWidth));
      adjustedY = Math.max(0, Math.min(adjustedY, canvasHeight - noteHeight));
      const newNote: StickyNote = {
        id,
        type: 'stickyNote',
        x: adjustedX,
        y: adjustedY,
        width: noteWidth,
        height: noteHeight,
        text: '',
        textColor: '#000000',
        bgColor: randomColor,
      };
      setStickyNotes((prev) => {
        const newNotes = [...prev.filter((note) => isValidId(note.id)), newNote];
        debouncedSaveToHistory(elements, newNotes);
        return newNotes;
      });
      setActiveNoteId(newNote.id);
      setEditingNoteId(newNote.id);
      return;
    }
    if (tool === 'text') {
      e.stopPropagation();
      e.preventDefault();
      const newTextId = generateId();
      newTextIdRef.current = newTextId;
      const newElement: TextElement = {
        id: newTextId,
        type: 'text',
        x: canvasX,
        y: canvasY,
        text: '',
        color: strokeColor,
        fontSize: textFontSize,
        isEditing: true,  
      };
      setElements((prev) => {
        const newElements = [...prev, newElement];
        debouncedSaveToHistory(newElements, stickyNotes);
        return newElements;
      });
      setEditingTextId(newTextId);
      setActiveTextId(newTextId);
      setTimeout(() => {
        const textarea = document.querySelector(`[data-text-id="${newTextId}"] textarea`) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }, 0);
      return;
    }
    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      setIsDrawing(true);
      const newElement: PathElement = {
        id: generateId(),
        type: 'path',
        points: [{ x: canvasX, y: canvasY }],
        color: tool === 'eraser' ? '#FFFFFF' : tool === 'highlighter' ? strokeColor : strokeColor,
        width: tool === 'highlighter' ? 15 : lineWidth,
        tool,
      };
      setCurrentElement(newElement);
    } else if (tool === 'shape' && shapeType) {
      setIsDrawing(true);
      setStartPoint({ x: canvasX, y: canvasY });
      const newElement: ShapeElement = {
        id: generateId(),
        type: shapeType,
        x: canvasX,
        y: canvasY,
        width: 0,
        height: 0,
        color: strokeColor,
        lineWidth,
      };
      setCurrentElement(newElement);
    }
  };

  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!context || !canvasRef.current) return;
      const { x: canvasX, y: canvasY } = getCanvasCoordinates(e.clientX, e.clientY);
      if (isPanning && panStart) {
        const dx = (e.clientX - panStart.x) / zoomLevel;
        const dy = (e.clientY - panStart.y) / zoomLevel;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
        redrawCanvas();
        return;
      }
      if (isDraggingNote && activeNoteId && tempNoteState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(0, Math.min(newX, canvasWidth - tempNoteState.current.width));
        const clampedY = Math.max(0, Math.min(newY, canvasHeight - tempNoteState.current.height));
        tempNoteState.current = { ...tempNoteState.current, x: clampedX, y: clampedY };
        setStickyNotes((prev) => {
          const updatedNotes = prev.map((note) =>
            note.id === activeNoteId ? { ...tempNoteState.current! } : note
          );
          const filteredNotes = updatedNotes.filter((note) => isValidId(note.id));
          return filteredNotes;
        });
        return;
      }
      if (isDraggingText && activeTextId && tempTextState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(0, Math.min(newX, canvasWidth));
        const clampedY = Math.max(0, Math.min(newY, canvasHeight));
        tempTextState.current = { ...tempTextState.current, x: clampedX, y: clampedY };
        setElements((prev) =>
          prev.map((el) => (el.id === activeTextId && el.type === 'text' ? tempTextState.current! : el))
        );
        return;
      }
      if (isResizingNote && activeNoteId && resizeDirection && tempNoteState.current) {
        const MIN_SIZE = 50;
        const MAX_SIZE = Math.max(canvasDimensions.width, canvasDimensions.height) / zoomLevel;
        const mouseX = canvasX;
        const mouseY = canvasY;
        let newX = tempNoteState.current.x;
        let newY = tempNoteState.current.y;
        let newWidth = tempNoteState.current.width;
        let newHeight = tempNoteState.current.height;

        switch (resizeDirection) {
          case 'se':
            newWidth = Math.max(MIN_SIZE, Math.min(mouseX - newX, MAX_SIZE));
            newHeight = Math.max(MIN_SIZE, Math.min(mouseY - newY, MAX_SIZE));
            break;
          case 'sw':
            newWidth = Math.max(MIN_SIZE, Math.min(tempNoteState.current.x + tempNoteState.current.width - mouseX, MAX_SIZE));
            newX = tempNoteState.current.x + tempNoteState.current.width - newWidth;
            newHeight = Math.max(MIN_SIZE, Math.min(mouseY - newY, MAX_SIZE));
            break;
          case 'ne':
            newWidth = Math.max(MIN_SIZE, Math.min(mouseX - newX, MAX_SIZE));
            newHeight = Math.max(MIN_SIZE, Math.min(tempNoteState.current.y + tempNoteState.current.height - mouseY, MAX_SIZE));
            newY = tempNoteState.current.y + tempNoteState.current.height - newHeight;
            break;
          case 'nw':
            newWidth = Math.max(MIN_SIZE, Math.min(tempNoteState.current.x + tempNoteState.current.width - mouseX, MAX_SIZE));
            newX = tempNoteState.current.x + tempNoteState.current.width - newWidth;
            newHeight = Math.max(MIN_SIZE, Math.min(tempNoteState.current.y + tempNoteState.current.height - mouseY, MAX_SIZE));
            newY = tempNoteState.current.y + tempNoteState.current.height - newHeight;
            break;
        }

        newX = Math.max(0, Math.min(newX, canvasDimensions.width / zoomLevel - newWidth));
        newY = Math.max(0, Math.min(newY, canvasDimensions.height / zoomLevel - newHeight));

        tempNoteState.current = { ...tempNoteState.current, x: newX, y: newY, width: newWidth, height: newHeight };
        setStickyNotes((prev) => {
          const updatedNotes = prev.map((note) =>
            note.id === activeNoteId ? { ...tempNoteState.current! } : note
          );
          const filteredNotes = updatedNotes.filter((note) => isValidId(note.id));
          return filteredNotes;
        });
        return;
      }
      if (!isDrawing || !currentElement) return;
      if ('points' in currentElement) {
        setCurrentElement({
          ...currentElement,
          points: [...currentElement.points, { x: canvasX, y: canvasY }],
        });
      } else if (startPoint && 'width' in currentElement) {
        setCurrentElement({
          ...currentElement,
          width: canvasX - startPoint.x,
          height: canvasY - startPoint.y,
        });
      }
      redrawCanvas();
    }, 4),
    [
      context,
      isPanning,
      panStart,
      isDraggingNote,
      isDraggingText,
      isResizingNote,
      activeNoteId,
      activeTextId,
      resizeDirection,
      dragOffset,
      isDrawing,
      currentElement,
      startPoint,
      zoomLevel,
      panOffset,
      redrawCanvas,
      canvasDimensions,
    ]
  );

  const handleMouseUp = () => {
    if (isPanning) {
      setPanStart(null);
      return;
    }
    if (isDraggingNote || isResizingNote) {
      if (tempNoteState.current && activeNoteId) {
        const updatedNote = { ...tempNoteState.current };
        setStickyNotes((prev) => {
          const newNotes = prev.map((note) => (note.id === activeNoteId ? updatedNote : note)).filter((note) => isValidId(note.id));
          debouncedSaveToHistory(elements, newNotes);
          return newNotes;
        });
      }
      setIsDraggingNote(false);
      setIsResizingNote(false);
      setResizeDirection(null);
      tempNoteState.current = null;
      return;
    }
    if (isDraggingText && activeTextId && tempTextState.current) {
      const updatedText = { ...tempTextState.current };
      setElements((prev) => {
        const newElements = prev.map((el) => (el.id === activeTextId && el.type === 'text' ? updatedText : el));
        debouncedSaveToHistory(newElements, stickyNotes);
        return newElements;
      });
      setIsDraggingText(false);
      tempTextState.current = null;
      return;
    }
    if (tool === 'text' && editingTextId) {
      return;
    }
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);
    setStartPoint(null);
    if ('points' in currentElement && currentElement.points.length > 1) {
      const newElements = [...elements, currentElement];
      setElements(newElements);
      debouncedSaveToHistory(newElements, stickyNotes);
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
        debouncedSaveToHistory(newElements, stickyNotes);
      }
    }
    setCurrentElement(null);
    redrawCanvas();
  };

  const handleStickyNoteMouseDown = (e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    e.stopPropagation();
    if (!isValidId(noteId)) return;
    setActiveNoteId(noteId);
    const note = uniqueStickyNotes.find((n) => n.id === noteId);
    if (!note) return;
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(e.clientX, e.clientY);
    setDragOffset({ x: canvasX - note.x, y: canvasY - note.y });
    tempNoteState.current = { ...note };
    setIsDraggingNote(true);
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, noteId: string, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isValidId(noteId)) return;
    setActiveNoteId(noteId);
    setIsResizingNote(true);
    setResizeDirection(direction);
    const note = uniqueStickyNotes.find((n) => n.id === noteId);
    if (!note) return;
    tempNoteState.current = { ...note };
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const handleStickyNoteDoubleClick = (e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    e.stopPropagation();
    if (!isValidId(noteId)) return;
    setEditingNoteId(noteId);
    setTimeout(() => {
      const textarea = document.querySelector(`[data-note-id="${noteId}"] textarea`) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 0);
  };

  const handleStickyNoteTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, noteId: string) => {
    if (!isValidId(noteId)) return;
    setStickyNotes((prev) => {
      const newNotes = prev.map((note) =>
        note.id === noteId ? { ...note, text: e.target.value } : note
      ).filter((note) => isValidId(note.id));
      debouncedSaveToHistory(elements, newNotes);
      return newNotes;
    });
  };

  const handleFinishEditing = () => {
    setEditingNoteId(null);
    debouncedSaveToHistory(elements, stickyNotes);
  };

  const handleTextMouseDown = (e: React.MouseEvent<HTMLDivElement>, textId: string) => {
    e.stopPropagation();
    if (!isValidId(textId) || editingTextId === textId) return;
    setActiveTextId(textId);
    const textElement = elements.find((el) => el.id === textId && el.type === 'text') as TextElement;
    if (!textElement) return;
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(e.clientX, e.clientY);
    setDragOffset({ x: canvasX - textElement.x, y: canvasY - textElement.y });
    tempTextState.current = { ...textElement };
    setIsDraggingText(true);
  };

  const handleTextDoubleClick = (e: React.MouseEvent<HTMLDivElement>, textId: string) => {
    e.stopPropagation();
    if (!isValidId(textId)) return;
    setEditingTextId(textId);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, textId: string) => {
    if (!isValidId(textId)) return;
    setElements((prev) => {
      const newElements = prev.map((el) =>
        el.id === textId && el.type === 'text' ? { ...el, text: e.target.value } : el
      );
      debouncedSaveToHistory(newElements, stickyNotes);
      return newElements;
    });
  };

  const handleFinishTextEditing = () => {
    setEditingTextId(null);
    setElements((prev) => {
      const newElements = prev.filter(
        (el) => !(el.type === 'text' && el.id === editingTextId && !el.text.trim())
      );
      debouncedSaveToHistory(newElements, stickyNotes);
      return newElements;
    });
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 4.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));

  const handleDeleteStickyNote = (noteId: string) => {
    if (!isValidId(noteId)) return;
    setStickyNotes((prev) => {
      const newNotes = prev.filter((note) => note.id !== noteId);
      debouncedSaveToHistory(elements, newNotes);
      return newNotes;
    });
    if (activeNoteId === noteId) setActiveNoteId(null);
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-gray-50 overflow-hidden select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => setColorPicker(null)}
    >
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className={`touch-none ${isPanning ? 'cursor-grab' : tool === 'stickyNote' || tool === 'text' ? 'cursor-cell' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
      {uniqueStickyNotes.map((note) => (
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
          showColorPicker={showColorPicker}
          textStyles={textStyles}
          textFontSize={textFontSize}
        />
      ))}
      {elements
        .filter((el) => el.type === 'text')
        .map((textElement) => (
          <TextComponent
            key={textElement.id}
            textElement={textElement as TextElement}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            activeTextId={activeTextId}
            editingTextId={editingTextId}
            handleTextMouseDown={handleTextMouseDown}
            handleTextDoubleClick={handleTextDoubleClick}
            handleTextChange={handleTextChange}
            handleFinishTextEditing={handleFinishTextEditing}
            setElements={setElements}
            textStyles={textStyles}
            textFontSize={textFontSize}
          />
        ))}
      {colorPicker && (
        <div
          className="absolute bg-white shadow-md rounded-lg p-3 grid grid-cols-3 gap-2 z-30 border border-purple-300"
          style={{ left: `${colorPicker.x}px`, top: `${colorPicker.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {colorPalette.map((color, index) => (
            <button
              key={`color-${color.bg}-${index}`}
              className="w-8 h-8 rounded-full border border-gray-200 hover:scale-105 hover:border-purple-300 transition-all duration-200"
              style={{ backgroundColor: color.bg, borderColor: color.text }}
              onClick={() => handleColorSelect(colorPicker.noteId, color.bg, color.text)}
            />
          ))}
        </div>
      )}
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
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
        <span className="px-3 border-l border-r border-purple-500 text-sm select-none">{Math.round(zoomLevel * 100)}%</span>
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
      </div>
      <CanvasToolbar />
      <NavBar />
    </div>
  );
};

export default Canvas;
