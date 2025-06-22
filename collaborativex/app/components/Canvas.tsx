"use client"
import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { throttle, debounce } from "lodash";
import NavBar from "./CanvasRightNavbar";
import {
  WhiteboardElement,
  PathElement,
  ShapeElement,
  TextElement,
  StickyNote,
  Point,
} from "./Types";
import CanvasToolbar from "./CanvasToolbar";
import { useParams } from "next/navigation";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useTheme } from "../context/ThemeContext";

interface CanvasProps {
  strokeColor: string;
  lineWidth: number;
  tool:
    | "pen"
    | "eraser"
    | "highlighter"
    | "shape"
    | "stickyNote"
    | "text"
    | null;
  shapeType: string | null;
  stickyNotes: StickyNote[];
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  textFontSize: number;
  saveToHistory: (state: {
    elements: WhiteboardElement[];
    stickyNotes: StickyNote[];
  }) => void;
  historyIndex: number;
  history: { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }[];
  textStyles: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily: string;
  };
}

interface StickyNoteProps {
  note: StickyNote;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeNoteId: string | null;
  editingNoteId: string | null;
  handleStickyNoteMouseDown: (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => void;
  handleStickyNoteDoubleClick: (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => void;
  handleStickyNoteTextChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    noteId: string
  ) => void;
  handleFinishEditing: () => void;
  handleDeleteStickyNote: (noteId: string) => void;
  handleResizeStart: (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string,
    direction: string
  ) => void;
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  showColorPicker: (noteId: string, x: number, y: number) => void;
  textStyles: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily: string;
  };
  textFontSize: number;
}

interface TextComponentProps {
  textElement: TextElement;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeTextId: string | null;
  editingTextId: string | null;
  handleTextMouseDown: (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => void;
  handleTextDoubleClick: (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => void;
  handleTextChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    textId: string
  ) => void;
  handleFinishTextEditing: () => void;
  setElements: React.Dispatch<React.SetStateAction<WhiteboardElement[]>>;
  textStyles: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily: 10;
    fontFamily: string;
  };
  textFontSize: number;
}

const generateUniqueId = (): string =>
  `id-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;

const isValidId = (id: string | undefined): boolean =>
  id !== undefined && id !== null && id !== "";

const colorPalette = [
  { bg: "#FEF7CD", text: "#000000" },
  { bg: "#D3E4FD", text: "#000000" },
  { bg: "#E5DEFF", text: "#000000" },
  { bg: "#F2FCE2", text: "#000000" },
  { bg: "#FFDEE2", text: "#000000" },
  { bg: "#FDE1D3", text: "#000000" },
  { bg: "#FFD700", text: "#000000" },
  { bg: "#98FB98", text: "#000000" },
  { bg: "#FFB6C1", text: "#000000" },
  { bg: "#ADD8E6", text: "#000000" },
  { bg: "#FFFACD", text: "#000000" },
  { bg: "#E6E6FA", text: "#000000" },
  { bg: "#FFFFFF", text: "#000000" },
  { bg: "#D3D3D3", text: "#000000" },
  { bg: "#A9A9A9", text: "#FFFFFF" },
  { bg: "#000000", text: "#FFFFFF" },
];

const darkenColor = (hex: string | undefined, percent: number): string => {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) {
    return "#000000";
  }
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B)
    .toString(16)
    .slice(1)
    .padStart(6, "0")}`;
};

const Toast: React.FC<{
  message: string;
  type: "success" | "error";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 1000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-lg z-50 text-white ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );
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
      console.error("Invalid note ID", note);
      return null;
    }

    const adjustedX = note.x * zoomLevel + panOffset.x;
    const adjustedY = note.y * zoomLevel + panOffset.y;
    const bgColor = note.bgColor || "#FEF7CD";

    return (
      <div
        data-note-id={note.id}
        className={`absolute rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
          activeNoteId === note.id
            ? "z-1 shadow-2xl ring-2 ring-purple-400 transform scale-105"
            : "z-0 shadow-lg hover:shadow-xl"
        }`}
        style={{
          width: `${note.width * zoomLevel}px`,
          height: `${note.height * zoomLevel}px`,
          background: darkenColor(bgColor, 10) ? `${bgColor}` : "#FEF7CD", // Fallback to hex
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          border: "1px solid rgba(0,0,0,0.1)",
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
                fill={bgColor}
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
                  fontWeight: textStyles.bold ? "bold" : "normal",
                  fontStyle: textStyles.italic ? "italic" : "normal",
                  textDecoration: textStyles.underline ? "underline" : "none",
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
                  fontWeight: textStyles.bold ? "bold" : "normal",
                  fontStyle: textStyles.italic ? "italic" : "normal",
                  textDecoration: textStyles.underline ? "underline" : "none",
                  fontFamily: textStyles.fontFamily,
                }}
              >
                {note.text || "Double-click to edit"}
              </div>
            )}
          </div>
        </div>
        {activeNoteId === note.id && !editingNoteId && (
          <>
            <div
              className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 translate-y-1/2 cursor-se-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, "se")}
            />
            <div
              className="absolute bottom-0 left-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 translate-y-1/2 cursor-sw-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, "sw")}
            />
            <div
              className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-ne-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, "ne")}
            />
            <div
              className="absolute top-0 left-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-nw-resize z-30 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleResizeStart(e, note.id, "nw")}
            />
          </>
        )}
      </div>
    );
  }
);

StickyNoteComponent.displayName = "StickyNoteComponent";

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
      console.error("Invalid text element ID", textElement);
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
          activeTextId === textElement.id
            ? "z-20 shadow-xl ring-2 ring-purple-500"
            : "z-10"
        }`}
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          cursor: editingTextId === textElement.id ? "text" : "move",
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
              fontWeight: textStyles.bold ? "bold" : "normal",
              fontStyle: textStyles.italic ? "italic" : "normal",
              textDecoration: textStyles.underline ? "underline" : "none",
              fontFamily: textStyles.fontFamily,
              minWidth: "100px",
              minHeight: "30px",
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
              fontWeight: textStyles.bold ? "bold" : "normal",
              fontStyle: textStyles.italic ? "italic" : "normal",
              textDecoration: textStyles.underline ? "underline" : "none",
              fontFamily: textStyles.fontFamily,
            }}
          >
            {textElement.text || "Double-click to edit"}
          </div>
        )}
        {activeTextId === textElement.id && !editingTextId && (
          <button
            className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              setElements((prev) =>
                prev.filter((el) => el.id !== textElement.id)
              );
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

TextComponent.displayName = "TextComponent";

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
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const contentCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridContext, setGridContext] =
    useState<CanvasRenderingContext2D | null>(null);
  const [contentContext, setContentContext] =
    useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const elementsRef = useRef<WhiteboardElement[]>([]);
  const [currentElement, setCurrentElement] =
    useState<WhiteboardElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });
  const params = useParams();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [isResizingNote, setIsResizingNote] = useState(false);
  const [isResizingShape, setIsResizingShape] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [colorPicker, setColorPicker] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const stickyNoteColors = [
    "#FEF7CD",
    "#D3E4FD",
    "#E5DEFF",
    "#F2FCE2",
    "#FFDEE2",
    "#FDE1D3",
  ];
  const tempNoteState = useRef<StickyNote | null>(null);
  const tempTextState = useRef<TextElement | null>(null);
  const tempShapeState = useRef<ShapeElement | null>(null);
  const newTextIdRef = useRef<string | null>(null);

  const debouncedSaveToHistory = useCallback(
    debounce((elements: WhiteboardElement[], stickyNotes: StickyNote[]) => {
      saveToHistory({ elements, stickyNotes });
    }, 100),
    [saveToHistory]
  );

  const uniqueStickyNotes = React.useMemo(() => {
    const seenIds = new Set<string>();
    return (stickyNotes || []).filter((note) => {
      if (!note || !isValidId(note.id)) return false;
      if (seenIds.has(note.id)) note.id = generateUniqueId();
      seenIds.add(note.id);
      return true;
    });
  }, [stickyNotes]);

  const drawElement = useCallback(
    (element: WhiteboardElement) => {
      if (
        !contentContext ||
        !element ||
        element.type === "stickyNote" ||
        element.type === "text"
      )
        return;
      if (
        element.type === "path" &&
        (element as PathElement).points?.length > 1
      ) {
        const path = element as PathElement;
        contentContext.beginPath();
        contentContext.moveTo(path.points[0].x, path.points[0].y);
        contentContext.strokeStyle = path.color;
        contentContext.lineWidth = path.width / zoomLevel;
        if (path.tool === "eraser") {
          contentContext.globalCompositeOperation = "destination-out";
        } else if (path.tool === "highlighter") {
          contentContext.globalCompositeOperation = "multiply";
          contentContext.globalAlpha = 0.5;
        } else {
          contentContext.globalCompositeOperation = "source-over";
          contentContext.globalAlpha = 1.0;
        }
        for (let i = 1; i < path.points.length; i++) {
          contentContext.lineTo(path.points[i].x, path.points[i].y);
        }
        contentContext.stroke();
        contentContext.globalCompositeOperation = "source-over";
        contentContext.globalAlpha = 1.0;
      } else if (element.type !== "path") {
        const shape = element as ShapeElement;
        contentContext.beginPath();
        contentContext.strokeStyle = shape.color;
        contentContext.lineWidth = shape.lineWidth / zoomLevel;
        contentContext.fillStyle = "transparent";
        const x = shape.x;
        const y = shape.y;
        const width = shape.width;
        const height = shape.height;
        switch (shape.type) {
          case "rectangle":
            contentContext.rect(x, y, width, height);
            break;
          case "circle":
            contentContext.ellipse(
              x + width / 2,
              y + height / 2,
              Math.abs(width / 2),
              Math.abs(height / 2),
              0,
              0,
              Math.PI * 2
            );
            break;
          case "line":
            contentContext.moveTo(x, y);
            contentContext.lineTo(x + width, y + height);
            break;
          case "triangle":
            contentContext.moveTo(x + width / 2, y);
            contentContext.lineTo(x, y + height);
            contentContext.lineTo(x + width, y + height);
            contentContext.closePath();
            break;
          case "diamond":
            contentContext.moveTo(x + width / 2, y);
            contentContext.lineTo(x + width, y + height / 2);
            contentContext.lineTo(x + width / 2, y + height);
            contentContext.lineTo(x, y + height / 2);
            contentContext.closePath();
            break;
          case "star":
            const spikes = 5;
            const outerRadius = Math.min(width, height) / 2;
            const innerRadius = outerRadius / 2.5;
            const cx = x + width / 2;
            const cy = y + height / 2;
            let rot = (Math.PI / 2) * 3;
            contentContext.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
              contentContext.lineTo(
                cx + Math.cos(rot) * outerRadius,
                cy + Math.sin(rot) * outerRadius
              );
              rot += Math.PI / spikes;
              contentContext.lineTo(
                cx + Math.cos(rot) * innerRadius,
                cy + Math.sin(rot) * innerRadius
              );
              rot += Math.PI / spikes;
            }
            contentContext.closePath();
            break;
          case "arrow":
          case "arrowRight":
          case "arrowLeft":
          case "arrowUp":
          case "arrowDown": {
            let dx = width;
            let dy = height;
            switch (shape.type) {
              case "arrowRight":
                dx = width;
                dy = 0;
                break;
              case "arrowLeft":
                dx = -width;
                dy = 0;
                break;
              case "arrowUp":
                dx = 0;
                dy = -height;
                break;
              case "arrowDown":
                dx = 0;
                dy = height;
                break;
              case "arrow":
                break;
            }
            const endX = x + dx;
            const endY = y + dy;
            const angle = Math.atan2(dy, dx);
            const arrowSize = 10 / zoomLevel;
            contentContext.moveTo(x, y);
            contentContext.lineTo(endX, endY);
            contentContext.moveTo(endX, endY);
            contentContext.lineTo(
              endX - arrowSize * Math.cos(angle - Math.PI / 6),
              endY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            contentContext.moveTo(endX, endY);
            contentContext.lineTo(
              endX - arrowSize * Math.cos(angle + Math.PI / 6),
              endY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            break;
          }
          case "heart":
            const cxh = x + width / 2;
            const cyh = y + height / 4;
            contentContext.moveTo(cxh, cyh + height / 2);
            contentContext.bezierCurveTo(
              cxh - width / 2,
              cyh + height / 2,
              cxh - width / 2,
              cyh - height / 4,
              cxh,
              cyh - height / 4
            );
            contentContext.bezierCurveTo(
              cxh + width / 2,
              cyh - height / 4,
              cxh + width / 2,
              cyh + height / 2,
              cxh,
              cyh + height / 2
            );
            contentContext.closePath();
            break;
          case "pentagon":
            contentContext.moveTo(x + width / 2, y);
            for (let i = 1; i <= 5; i++) {
              contentContext.lineTo(
                x +
                  (width / 2) *
                    (1 + Math.cos((Math.PI * 2 * i) / 5 - Math.PI / 2)),
                y +
                  (height / 2) *
                    (1 + Math.sin((Math.PI * 2 * i) / 5 - Math.PI / 2))
              );
            }
            contentContext.closePath();
            break;
          case "hexagon":
            contentContext.moveTo(x + width / 2, y);
            for (let i = 1; i <= 6; i++) {
              contentContext.lineTo(
                x +
                  (width / 2) *
                    (1 + Math.cos((Math.PI * 2 * i) / 6 - Math.PI / 2)),
                y +
                  (height / 2) *
                    (1 + Math.sin((Math.PI * 2 * i) / 6 - Math.PI / 2))
              );
            }
            contentContext.closePath();
            break;
          case "heptagon":
            contentContext.moveTo(x + width / 2, y);
            for (let i = 1; i <= 7; i++) {
              contentContext.lineTo(
                x +
                  (width / 2) *
                    (1 + Math.cos((Math.PI * 2 * i) / 7 - Math.PI / 2)),
                y +
                  (height / 2) *
                    (1 + Math.sin((Math.PI * 2 * i) / 7 - Math.PI / 2))
              );
            }
            contentContext.closePath();
            break;
          case "octagon":
            contentContext.moveTo(x + width / 2, y);
            for (let i = 1; i <= 8; i++) {
              contentContext.lineTo(
                x +
                  (width / 2) *
                    (1 + Math.cos((Math.PI * 2 * i) / 8 - Math.PI / 2)),
                y +
                  (height / 2) *
                    (1 + Math.sin((Math.PI * 2 * i) / 8 - Math.PI / 2))
              );
            }
            contentContext.closePath();
            break;
          case "cross":
            contentContext.moveTo(x + width / 2, y);
            contentContext.lineTo(x + width / 2, y + height);
            contentContext.moveTo(x, y + height / 2);
            contentContext.lineTo(x + width, y + height / 2);
            break;
          case "smiley":
            contentContext.arc(
              x + width / 2,
              y + height / 2,
              Math.min(width, height) / 2,
              0,
              Math.PI * 2
            );
            contentContext.moveTo(x + width / 3, y + height / 3);
            contentContext.arc(
              x + width / 3,
              y + height / 3,
              width / 10,
              0,
              Math.PI * 2
            );
            contentContext.moveTo(x + (2 * width) / 3, y + height / 3);
            contentContext.arc(
              x + (2 * width) / 3,
              y + height / 3,
              width / 10,
              0,
              Math.PI * 2
            );
            contentContext.moveTo(x + width / 2, y + (2 * height) / 3);
            contentContext.arc(
              x + width / 2,
              y + height / 2,
              width / 4,
              0,
              Math.PI,
              false
            );
            break;
          case "cloud":
            contentContext.moveTo(x + width / 4, y + height);
            contentContext.bezierCurveTo(
              x,
              y + height,
              x,
              y + height / 2,
              x + width / 4,
              y + height / 2
            );
            contentContext.bezierCurveTo(
              x + width / 8,
              y + height / 4,
              x + (3 * width) / 8,
              y + height / 4,
              x + width / 2,
              y + height / 2
            );
            contentContext.bezierCurveTo(
              x + (5 * width) / 8,
              y + height / 4,
              x + (7 * width) / 8,
              y + height / 4,
              x + (3 * width) / 4,
              y + height / 2
            );
            contentContext.bezierCurveTo(
              x + width,
              y + height / 2,
              x + width,
              y + height,
              x + (3 * width) / 4,
              y + height
            );
            contentContext.closePath();
            break;
        }
        contentContext.stroke();
      }
    },
    [contentContext, zoomLevel]
  );

  const drawGrid = useCallback(() => {
    if (!gridContext || !gridCanvasRef.current) return;
    const canvas = gridCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    gridContext.save();
    gridContext.setTransform(1, 0, 0, 1, 0, 0);
    gridContext.clearRect(0, 0, canvas.width, canvas.height);
    gridContext.scale(dpr * zoomLevel, dpr * zoomLevel);
    gridContext.translate(panOffset.x, panOffset.y);

    const canvasWidth = canvas.width / (dpr * zoomLevel);
    const canvasHeight = canvas.height / (dpr * zoomLevel);
    const gridSize = 30;

    gridContext.strokeStyle = "#80008030";
    gridContext.lineWidth = 0.5 / zoomLevel;

    const startX = Math.floor(-panOffset.x / gridSize) * gridSize;
    const startY = Math.floor(-panOffset.y / gridSize) * gridSize;
    const endX = startX + canvasWidth + gridSize;
    const endY = startY + canvasHeight + gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      gridContext.beginPath();
      gridContext.moveTo(x, startY);
      gridContext.lineTo(x, endY);
      gridContext.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      gridContext.beginPath();
      gridContext.moveTo(startX, y);
      gridContext.lineTo(endX, y);
      gridContext.stroke();
    }

    gridContext.restore();
  }, [gridContext, zoomLevel, panOffset]);

  const redrawContentCanvas = useCallback(() => {
    if (!contentContext || !contentCanvasRef.current) return;
    const canvas = contentCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    contentContext.save();
    contentContext.setTransform(1, 0, 0, 1, 0, 0);
    contentContext.clearRect(0, 0, canvas.width, canvas.height);
    contentContext.scale(dpr * zoomLevel, dpr * zoomLevel);
    contentContext.translate(panOffset.x, panOffset.y);
    elementsRef.current.forEach(drawElement);
    if (currentElement) drawElement(currentElement);
    contentContext.restore();
  }, [contentContext, drawElement, currentElement, zoomLevel, panOffset]);

  useEffect(() => {
    const id = params.id;
    const fetchWhiteboard = async () => {
      try {
        const response = await fetch(`/api/whiteboard/saveWhiteboard/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          method: "GET",
        });
        if (!response.ok) throw new Error("Failed to fetch whiteboard");
        const data = await response.json();

        const mappedStickyNotes = (data.stickyNotes || []).map((note: any) => ({
          id: note.id,
          type: "stickyNote" as const,
          x: note.x || 0,
          y: note.y || 0,
          width: note.width || 200,
          height: note.height || 200,
          text: note.content || "",
          textColor: "#000000",
          bgColor: note.color || "#FEF7CD",
        }));

        const mappedElements = (data.elements || [])
          .map((el: any) => {
            if (["pen", "eraser", "highlighter"].includes(el.type)) {
              return {
                id: el.id,
                type: "path" as const,
                points: el.points || [],
                color: el.color || "#000000",
                width: el.lineWidth || 1,
                tool: el.type,
              } as PathElement;
            } else if (el.type === "text") {
              return {
                id: el.id,
                type: "text" as const,
                x: el.x || 0,
                y: el.y || 0,
                text: el.text || "",
                color: el.color || "#000000",
                fontSize: el.fontSize || 24,
              } as TextElement;
            } else if (el.type === "shape") {
              return {
                id: el.id,
                type: el.shapeType,
                x: el.x || 0,
                y: el.y || 0,
                width: el.width || 0,
                height: el.height || 0,
                color: el.color || "#000000",
                lineWidth: el.lineWidth || 1,
                isFixed:
                  el.shapeType?.includes("line") ||
                  el.shapeType?.includes("arrow"),
              } as ShapeElement;
            }
            return null;
          })
          .filter(Boolean);

        elementsRef.current = mappedElements;
        setElements(mappedElements);
        setStickyNotes(mappedStickyNotes);
        debouncedSaveToHistory(mappedElements, mappedStickyNotes);
        setToast({
          message: "Whiteboard loaded successfully",
          type: "success",
        });
      } catch (error) {
        console.error("Error fetching whiteboard:", error);
        elementsRef.current = [];
        setElements([]);
        setStickyNotes([]);
        setToast({ message: "Failed to load whiteboard", type: "error" });
      }
    };
    fetchWhiteboard();
  }, []);

  const saveWhiteboard = useCallback(async () => {
    const id = params.id;
    try {
      const mappedStickyNotes = uniqueStickyNotes.map((note) => ({
        id: note.id,
        content: note.text,
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
        color: note.bgColor,
      }));

      const mappedElements = elementsRef.current.map((el) => {
        const base = {
          id: el.id,
          color:
            el.type === "text"
              ? (el as TextElement).color
              : (el as PathElement | ShapeElement).color,
        };
        if (el.type === "path") {
          const path = el as PathElement;
          return {
            ...base,
            type: path.tool,
            points: path.points,
            lineWidth: path.width,
          };
        } else if (el.type === "text") {
          const text = el as TextElement;
          return {
            ...base,
            type: "text",
            x: text.x,
            y: text.y,
            text: text.text,
            fontSize: textFontSize,
            fontFamily: textStyles.fontFamily,
            bold: textStyles.bold,
            italic: textStyles.italic,
            underline: textStyles.underline,
          };
        } else {
          const shape = el as ShapeElement;
          return {
            ...base,
            type: "shape",
            shapeType: shape.type,
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
            lineWidth: shape.lineWidth,
          };
        }
      });

      const response = await fetch(`/api/whiteboard/saveWhiteboard/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          whiteboardId: id,
          elements: mappedElements,
          stickyNotes: mappedStickyNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to save whiteboard");
      const data = await response.json();
      setToast({ message: data.message, type: "success" });
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      setToast({ message: "Failed to save whiteboard", type: "error" });
    }
  }, [params.id, uniqueStickyNotes, textFontSize, textStyles]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !editingTextId && !editingNoteId)
        setIsPanning(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanning(false);
        setPanStart(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!gridCanvasRef.current || !contentCanvasRef.current) return;
    const gridCanvas = gridCanvasRef.current;
    const contentCanvas = contentCanvasRef.current;
    const gridCtx = gridCanvas.getContext("2d");
    const contentCtx = contentCanvas.getContext("2d");
    if (gridCtx && contentCtx) {
      gridCtx.lineCap = "round";
      gridCtx.lineJoin = "round";
      contentCtx.lineCap = "round";
      contentCtx.lineJoin = "round";
      contentCtx.strokeStyle = strokeColor;
      contentCtx.lineWidth = lineWidth;
      setGridContext(gridCtx);
      setContentContext(contentCtx);
    }
  }, [strokeColor, lineWidth]);

  useEffect(() => {
    if (
      !gridCanvasRef.current ||
      !contentCanvasRef.current ||
      !gridContext ||
      !contentContext
    )
      return;
    const gridCanvas = gridCanvasRef.current;
    const contentCanvas = contentCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    gridCanvas.width = canvasDimensions.width * dpr;
    gridCanvas.height = canvasDimensions.height * dpr;
    contentCanvas.width = canvasDimensions.width * dpr;
    contentCanvas.height = canvasDimensions.height * dpr;
    gridCanvas.style.width = `${canvasDimensions.width}px`;
    gridCanvas.style.height = `${canvasDimensions.height}px`;
    contentCanvas.style.width = `${canvasDimensions.width}px`;
    contentCanvas.style.height = `${canvasDimensions.height}px`;
    gridContext.scale(dpr * zoomLevel, dpr * zoomLevel);
    contentContext.scale(dpr * zoomLevel, dpr * zoomLevel);
    gridContext.translate(panOffset.x, panOffset.y);
    contentContext.translate(panOffset.x, panOffset.y);
    drawGrid();
    redrawContentCanvas();
  }, [canvasDimensions, zoomLevel, panOffset, gridContext, contentContext]);


  const { theme } = useTheme(); // Get current theme
  const [currentColor, setColor] = useState("#000000"); // Initial color

  useEffect(() => {
    // Set drawing color based on theme
    setColor(theme === "dark" ? "#FFFFFF" : "#000000");
  }, [theme]);
  
  useEffect(() => {
    if (
      history.length > 0 &&
      historyIndex >= 0 &&
      historyIndex < history.length
    ) {
      const { elements = [], stickyNotes = [] } = history[historyIndex] || {};
      elementsRef.current = Array.isArray(elements) ? elements : [];
      setElements(elementsRef.current);
      setStickyNotes(Array.isArray(stickyNotes) ? stickyNotes : []);
    } else {
      console.warn("Invalid history or historyIndex:", {
        history,
        historyIndex,
      });
      elementsRef.current = [];
      setElements([]);
      setStickyNotes([]);
    }
  }, [history, historyIndex, setStickyNotes]);

  useEffect(() => {
    redrawContentCanvas();
  }, [elements, redrawContentCanvas]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!contentCanvasRef.current) return { x: 0, y: 0 };
    const rect = contentCanvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x * zoomLevel) / zoomLevel,
      y: (clientY - rect.top - panOffset.y * zoomLevel) / zoomLevel,
    };
  };

  const getScreenCoordinates = (clientX: number, clientY: number) => {
    if (!contentCanvasRef.current) return { x: 0, y: 0 };
    const rect = contentCanvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const showColorPicker = (noteId: string, x: number, y: number) => {
    setColorPicker({ noteId, x, y });
  };

  const handleColorSelect = (
    noteId: string,
    bgColor: string,
    textColor: string
  ) => {
    setStickyNotes((prev) => {
      const newNotes = prev
        .map((note) =>
          note.id === noteId ? { ...note, bgColor, textColor } : note
        )
        .filter((note) => isValidId(note.id));
      debouncedSaveToHistory(elementsRef.current, newNotes);
      return newNotes;
    });
    setColorPicker(null);
  };

  const isOverStickyNote = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): string | null => {
    const { x: screenX, y: screenY } = getScreenCoordinates(
      e.clientX,
      e.clientY
    );
    for (const note of uniqueStickyNotes) {
      if (!isValidId(note.id)) continue;
      const noteX = note.x * zoomLevel + panOffset.x;
      const noteY = note.y * zoomLevel + panOffset.y;
      const noteWidth = note.width * zoomLevel;
      const noteHeight = note.height * zoomLevel;
      if (
        screenX >= noteX &&
        screenX <= noteX + noteWidth &&
        screenY >= noteY &&
        screenY <= noteY + noteHeight
      ) {
        return note.id;
      }
    }
    return null;
  };

  const isOverTextElement = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): string | null => {
    const { x: screenX, y: screenY } = getScreenCoordinates(
      e.clientX,
      e.clientY
    );
    for (const element of elementsRef.current) {
      if (element.type === "text") {
        const textElement = element as TextElement;
        const adjustedX = textElement.x * zoomLevel + panOffset.x;
        const adjustedY = textElement.y * zoomLevel + panOffset.y;
        const textWidth =
          (textElement.text.length || 10) * (textFontSize * zoomLevel * 0.6);
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
    if (!contentContext || colorPicker) return;
    if (
      isDraggingNote ||
      isResizingNote ||
      isDraggingText ||
      editingTextId ||
      editingNoteId ||
      isDraggingShape ||
      isResizingShape
    )
      return;
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );
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
      const textElement = elementsRef.current.find(
        (el) => el.id === clickedTextId && el.type === "text"
      ) as TextElement;
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
    const clickedShape = elementsRef.current.find((el) => {
      if (el.type === "text" || el.type === "path") return false;
      const shape = el as ShapeElement;
      return (
        canvasX >= shape.x &&
        canvasX <= shape.x + shape.width &&
        canvasY >= shape.y &&
        canvasY <= shape.y + shape.height &&
        !shape.isFixed
      );
    });
    if (clickedShape) {
      setActiveShapeId(clickedShape.id);
      tempShapeState.current = { ...clickedShape } as ShapeElement;
      setDragOffset({
        x: canvasX - clickedShape.x,
        y: canvasY - clickedShape.y,
      });
      setIsDraggingShape(true);
      return;
    } else {
      setActiveShapeId(null);
    }
    if (tool === "stickyNote") {
      e.stopPropagation();
      const id = generateUniqueId();
      const randomColor =
        stickyNoteColors[Math.floor(Math.random() * stickyNoteColors.length)];
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
        type: "stickyNote",
        x: adjustedX,
        y: adjustedY,
        width: noteWidth,
        height: noteHeight,
        text: "",
        textColor: "#000000",
        bgColor: randomColor,
      };
      setStickyNotes((prev) => {
        const newNotes = [
          ...prev.filter((note) => isValidId(note.id)),
          newNote,
        ];
        debouncedSaveToHistory(elementsRef.current, newNotes);
        return newNotes;
      });
      setActiveNoteId(newNote.id);
      setEditingNoteId(newNote.id);
      return;
    }
    if (tool === "text") {
      e.stopPropagation();
      e.preventDefault();
      const newTextId = generateUniqueId();
      newTextIdRef.current = newTextId;
      const newElement: TextElement = {
        id: newTextId,
        type: "text",
        x: canvasX,
        y: canvasY,
        text: "",
        color: strokeColor,
        fontSize: textFontSize,
      };
      elementsRef.current = [...elementsRef.current, newElement];
      setElements(elementsRef.current);
      debouncedSaveToHistory(elementsRef.current, stickyNotes);
      setEditingTextId(newTextId);
      setActiveTextId(newTextId);
      setTimeout(() => {
        const textarea = document.querySelector(
          `[data-text-id="${newTextId}"] textarea`
        ) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }, 0);
      return;
    }
    if (tool === "pen" || tool === "eraser" || tool === "highlighter") {
      setIsDrawing(true);
      const newElement: PathElement = {
        id: generateUniqueId(),
        type: "path",
        points: [{ x: canvasX, y: canvasY }],
        color: tool === "eraser" ? "#FFFFFF" : strokeColor,
        width: tool === "highlighter" ? lineWidth * 2 : lineWidth,
        tool,
      };
      setCurrentElement(newElement);
    } else if (tool === "shape" && shapeType) {
      setIsDrawing(true);
      setStartPoint({ x: canvasX, y: canvasY });
      const newElement: ShapeElement = {
        id: generateUniqueId(),
        type: shapeType,
        x: canvasX,
        y: canvasY,
        width: 0,
        height: 0,
        color: strokeColor,
        lineWidth,
        isFixed: shapeType.includes("line") || shapeType.includes("arrow"),
      };
      setCurrentElement(newElement);
    }
  };

  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!contentContext || !contentCanvasRef.current) return;
      const { x: canvasX, y: canvasY } = getCanvasCoordinates(
        e.clientX,
        e.clientY
      );
      if (isPanning && panStart) {
        const dx = (e.clientX - panStart.x) / zoomLevel;
        const dy = (e.clientY - panStart.y) / zoomLevel;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
        drawGrid();
        redrawContentCanvas();
        return;
      }
      if (isDraggingNote && activeNoteId && tempNoteState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(
          0,
          Math.min(newX, canvasWidth - tempNoteState.current.width)
        );
        const clampedY = Math.max(
          0,
          Math.min(newY, canvasHeight - tempNoteState.current.height)
        );
        tempNoteState.current = {
          ...tempNoteState.current,
          x: clampedX,
          y: clampedY,
        };
        setStickyNotes((prev) =>
          prev
            .map((note) =>
              note.id === activeNoteId ? { ...tempNoteState.current! } : note
            )
            .filter((note) => isValidId(note.id))
        );
        return;
      }
      if (isDraggingText && activeTextId && tempTextState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(0, Math.min(newX, canvasWidth));
        const clampedY = Math.max(0, Math.min(newY, canvasHeight));
        tempTextState.current = {
          ...tempTextState.current,
          x: clampedX,
          y: clampedY,
        };
        elementsRef.current = elementsRef.current.map((el) =>
          el.id === activeTextId && el.type === "text"
            ? tempTextState.current!
            : el
        );
        setElements(elementsRef.current);
        return;
      }
      if (isDraggingShape && activeShapeId && tempShapeState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(
          0,
          Math.min(newX, canvasWidth - tempShapeState.current.width)
        );
        const clampedY = Math.max(
          0,
          Math.min(newY, canvasHeight - tempShapeState.current.height)
        );
        tempShapeState.current = {
          ...tempShapeState.current,
          x: clampedX,
          y: clampedY,
        };
        redrawContentCanvas();
        return;
      }
      if (
        isResizingNote &&
        activeNoteId &&
        resizeDirection &&
        tempNoteState.current
      ) {
        const MIN_SIZE = 50;
        const MAX_SIZE =
          Math.max(canvasDimensions.width, canvasDimensions.height) / zoomLevel;
        const mouseX = canvasX;
        const mouseY = canvasY;
        let newX = tempNoteState.current.x;
        let newY = tempNoteState.current.y;
        let newWidth = tempNoteState.current.width;
        let newHeight = tempNoteState.current.height;
        switch (resizeDirection) {
          case "se":
            newWidth = Math.max(MIN_SIZE, Math.min(mouseX - newX, MAX_SIZE));
            newHeight = Math.max(MIN_SIZE, Math.min(mouseY - newY, MAX_SIZE));
            break;
          case "sw":
            newWidth = Math.max(
              MIN_SIZE,
              Math.min(
                tempNoteState.current.x + tempNoteState.current.width - mouseX,
                MAX_SIZE
              )
            );
            newX =
              tempNoteState.current.x + tempNoteState.current.width - newWidth;
            newHeight = Math.max(MIN_SIZE, Math.min(mouseY - newY, MAX_SIZE));
            break;
          case "ne":
            newWidth = Math.max(MIN_SIZE, Math.min(mouseX - newX, MAX_SIZE));
            newHeight = Math.max(
              MIN_SIZE,
              Math.min(
                tempNoteState.current.y + tempNoteState.current.height - mouseY,
                MAX_SIZE
              )
            );
            newY =
              tempNoteState.current.y +
              tempNoteState.current.height -
              newHeight;
            break;
          case "nw":
            newWidth = Math.max(
              MIN_SIZE,
              Math.min(
                tempNoteState.current.x + tempNoteState.current.width - mouseX,
                MAX_SIZE
              )
            );
            newX =
              tempNoteState.current.x + tempNoteState.current.width - newWidth;
            newHeight = Math.max(
              MIN_SIZE,
              Math.min(
                tempNoteState.current.y + tempNoteState.current.height - mouseY,
                MAX_SIZE
              )
            );
            newY =
              tempNoteState.current.y +
              tempNoteState.current.height -
              newHeight;
            break;
        }
        newX = Math.max(
          0,
          Math.min(newX, canvasDimensions.width / zoomLevel - newWidth)
        );
        newY = Math.max(
          0,
          Math.min(newY, canvasDimensions.height / zoomLevel - newHeight)
        );
        tempNoteState.current = {
          ...tempNoteState.current,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };
        setStickyNotes((prev) =>
          prev
            .map((note) =>
              note.id === activeNoteId ? { ...tempNoteState.current! } : note
            )
            .filter((note) => isValidId(note.id))
        );
        return;
      }
      if (
        isResizingShape &&
        activeShapeId &&
        resizeDirection &&
        tempShapeState.current
      ) {
        const MIN_SIZE = 50;
        const MAX_SIZE =
          Math.max(canvasDimensions.width, canvasDimensions.height) / zoomLevel;
        const mouseX = canvasX;
        const mouseY = canvasY;
        let newX = tempShapeState.current.x;
        let newY = tempShapeState.current.y;
        let newWidth = tempShapeState.current.width;
        let newHeight = tempShapeState.current.height;
        switch (resizeDirection) {
          case "se":
            newWidth = Math.max(MIN_SIZE, Math.min(mouseX - newX, MAX_SIZE));
            newHeight = Math.max(MIN_SIZE, Math.min(mouseY - newY, MAX_SIZE));
            break;
          case "sw":
            newWidth = Math.max(
              MIN_SIZE,
              Math.min(
                tempShapeState.current.x +
                  tempShapeState.current.width -
                  mouseX,
                MAX_SIZE
              )
            );
            newX =
              tempShapeState.current.x +
              tempShapeState.current.width -
              newWidth;
            newHeight = Math.max(MIN_SIZE, Math.min(mouseY - newY, MAX_SIZE));
            break;
          case "ne":
            newWidth = Math.max(MIN_SIZE, Math.min(mouseX - newX, MAX_SIZE));
            newHeight = Math.max(
              MIN_SIZE,
              Math.min(
                tempShapeState.current.y +
                  tempShapeState.current.height -
                  mouseY,
                MAX_SIZE
              )
            );
            newY =
              tempShapeState.current.y +
              tempShapeState.current.height -
              newHeight;
            break;
          case "nw":
            newWidth = Math.max(
              MIN_SIZE,
              Math.min(
                tempShapeState.current.x +
                  tempShapeState.current.width -
                  mouseX,
                MAX_SIZE
              )
            );
            newX =
              tempShapeState.current.x +
              tempShapeState.current.width -
              newWidth;
            newHeight = Math.max(
              MIN_SIZE,
              Math.min(
                tempShapeState.current.y +
                  tempShapeState.current.height -
                  mouseY,
                MAX_SIZE
              )
            );
            newY =
              tempShapeState.current.y +
              tempShapeState.current.height -
              newHeight;
            break;
        }
        newX = Math.max(
          0,
          Math.min(newX, canvasDimensions.width / zoomLevel - newWidth)
        );
        newY = Math.max(
          0,
          Math.min(newY, canvasDimensions.height / zoomLevel - newHeight)
        );
        tempShapeState.current = {
          ...tempShapeState.current,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };
        redrawContentCanvas();
        return;
      }
      if (!isDrawing || !currentElement) return;
      if ("points" in currentElement) {
        setCurrentElement({
          ...currentElement,
          points: [...currentElement.points, { x: canvasX, y: canvasY }],
        });
      } else if (startPoint && "width" in currentElement) {
        setCurrentElement({
          ...currentElement,
          width: canvasX - startPoint.x,
          height: canvasY - startPoint.y,
        });
      }
      redrawContentCanvas();
    }, 4),
    [
      contentContext,
      isPanning,
      panStart,
      isDraggingNote,
      isDraggingText,
      isDraggingShape,
      isResizingNote,
      isResizingShape,
      activeNoteId,
      activeTextId,
      activeShapeId,
      resizeDirection,
      dragOffset,
      isDrawing,
      currentElement,
      startPoint,
      zoomLevel,
      panOffset,
      redrawContentCanvas,
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
          const newNotes = prev
            .map((note) => (note.id === activeNoteId ? updatedNote : note))
            .filter((note) => isValidId(note.id));
          debouncedSaveToHistory(elementsRef.current, newNotes);
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
      elementsRef.current = elementsRef.current.map((el) =>
        el.id === activeTextId && el.type === "text" ? updatedText : el
      );
      setElements(elementsRef.current);
      debouncedSaveToHistory(elementsRef.current, stickyNotes);
      setIsDraggingText(false);
      tempTextState.current = null;
      return;
    }
    if (isDraggingShape || isResizingShape) {
      if (tempShapeState.current && activeShapeId) {
        const updatedShape = { ...tempShapeState.current };
        elementsRef.current = elementsRef.current.map((el) =>
          el.id === activeShapeId ? updatedShape : el
        );
        setElements(elementsRef.current);
        debouncedSaveToHistory(elementsRef.current, stickyNotes);
      }
      setIsDraggingShape(false);
      setIsResizingShape(false);
      setResizeDirection(null);
      tempShapeState.current = null;
      redrawContentCanvas();
      return;
    }
    if (tool === "text" && editingTextId) {
      return;
    }
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);
    setStartPoint(null);
    if ("points" in currentElement && currentElement.points.length > 1) {
      elementsRef.current = [...elementsRef.current, currentElement];
      setElements(elementsRef.current);
      debouncedSaveToHistory(elementsRef.current, stickyNotes);
    } else if ("width" in currentElement) {
      const shape = currentElement as ShapeElement;
      if (shape.width !== 0 || shape.height !== 0) {
        const fixedShape = {
          ...shape,
          x: shape.width < 0 ? shape.x + shape.width : shape.x,
          y: shape.height < 0 ? shape.y + shape.height : shape.y,
          width: Math.abs(shape.width),
          height: Math.abs(shape.height),
        };
        elementsRef.current = [...elementsRef.current, fixedShape];
        setElements(elementsRef.current);
        debouncedSaveToHistory(elementsRef.current, stickyNotes);
      }
    }
    setCurrentElement(null);
    redrawContentCanvas();
  };

  const handleStickyNoteMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(noteId)) return;
    setActiveNoteId(noteId);
    const note = uniqueStickyNotes.find((n) => n.id === noteId);
    if (!note) return;
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );
    setDragOffset({ x: canvasX - note.x, y: canvasY - note.y });
    tempNoteState.current = { ...note };
    setIsDraggingNote(true);
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const handleResizeStart = (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string,
    direction: string
  ) => {
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

  const handleShapeResizeStart = (
    e: React.MouseEvent<HTMLDivElement>,
    shapeId: string,
    direction: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isValidId(shapeId)) return;
    setActiveShapeId(shapeId);
    setIsResizingShape(true);
    setResizeDirection(direction);
    const shape = elementsRef.current.find(
      (el) => el.id === shapeId && el.type !== "path" && el.type !== "text"
    ) as ShapeElement;
    if (!shape) return;
    tempShapeState.current = { ...shape };
  };

  const handleShapeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    shapeId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(shapeId)) return;
    setActiveShapeId(shapeId);
    const shape = elementsRef.current.find(
      (el) => el.id === shapeId && el.type !== "path" && el.type !== "text"
    ) as ShapeElement;
    if (!shape || shape.isFixed) return;
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );
    setDragOffset({ x: canvasX - shape.x, y: canvasY - shape.y });
    tempShapeState.current = { ...shape };
    setIsDraggingShape(true);
  };

  const handleStickyNoteDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(noteId)) return;
    setEditingNoteId(noteId);
    setTimeout(() => {
      const textarea = document.querySelector(
        `[data-note-id="${noteId}"] textarea`
      ) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 0);
  };

  const handleStickyNoteTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    noteId: string
  ) => {
    if (!isValidId(noteId)) return;
    setStickyNotes((prev) => {
      const newNotes = prev
        .map((note) =>
          note.id === noteId ? { ...note, text: e.target.value } : note
        )
        .filter((note) => isValidId(note.id));
      debouncedSaveToHistory(elementsRef.current, newNotes);
      return newNotes;
    });
  };

  const handleFinishEditing = () => {
    setEditingNoteId(null);
    debouncedSaveToHistory(elementsRef.current, stickyNotes);
  };

  const handleTextMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(textId) || editingTextId === textId) return;
    setActiveTextId(textId);
    const textElement = elementsRef.current.find(
      (el) => el.id === textId && el.type === "text"
    ) as TextElement;
    if (!textElement) return;
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );
    setDragOffset({ x: canvasX - textElement.x, y: canvasY - textElement.y });
    tempTextState.current = { ...textElement };
    setIsDraggingText(true);
  };

  const handleTextDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(textId)) return;
    setEditingTextId(textId);
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    textId: string
  ) => {
    if (!isValidId(textId)) return;
    setElements((prev) => {
      const newElements = prev.map((el) =>
        el.id === textId && el.type === "text"
          ? { ...el, text: e.target.value }
          : el
      );
      elementsRef.current = newElements;
      debouncedSaveToHistory(newElements, stickyNotes);
      return newElements;
    });
  };

  const handleFinishTextEditing = () => {
    setEditingTextId(null);
    setElements((prev) => {
      const newElements = prev.filter(
        (el) =>
          !(el.type === "text" && el.id === editingTextId && !el.text.trim())
      );
      elementsRef.current = newElements;
      debouncedSaveToHistory(newElements, stickyNotes);
      return newElements;
    });
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 4.0));
  const handleZoomOut = () =>
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));

  const handleDeleteStickyNote = (noteId: string) => {
    if (!isValidId(noteId)) return;
    setStickyNotes((prev) => {
      const newNotes = prev.filter((note) => note.id !== noteId);
      debouncedSaveToHistory(elementsRef.current, newNotes);
      return newNotes;
    });
    if (activeNoteId === noteId) setActiveNoteId(null);
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

const exportAsPNG = () => {
    if (contentCanvasRef.current) {
      const link = document.createElement("a");
      link.download = `whiteboard_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = contentCanvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  const exportAsPDF = async () => {
    if (contentCanvasRef.current) {
      const canvas = await html2canvas(contentCanvasRef.current, {
        scale: 2, // Higher resolution
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0);
      pdf.save(`whiteboard_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
  };

  return (
 <div
  ref={containerRef}
  className="relative h-full w-full bg-gray-50 dark:bg-gray-400 overflow-hidden select-none"
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onClick={() => setColorPicker(null)}
>
  {toast && (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  )}
  <canvas
    ref={gridCanvasRef}
    width={canvasDimensions.width}
    height={canvasDimensions.height}
    className="absolute top-0 left-0 touch-none"
  />
  <canvas
    ref={contentCanvasRef}
    width={canvasDimensions.width}
    height={canvasDimensions.height}
    className="absolute top-0 left-0 touch-none"
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
  {elements.map((element) =>
    element.type === "text" ? (
      <TextComponent
        key={element.id}
        textElement={element as TextElement}
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
    ) : element.type !== "path" && !element.isFixed ? (
      <div
        key={element.id}
        data-shape-id={element.id}
        className={`absolute border border-dashed border-purple-400 dark:border-purple-600 rounded ${
          activeShapeId === element.id
            ? "z-20 ring-2 ring-purple-500 dark:ring-purple-700"
            : "z-10"
        }`}
        style={{
          left: `${element.x * zoomLevel + panOffset.x}px`,
          top: `${element.y * zoomLevel + panOffset.y}px`,
          width: `${Math.abs(element.width) * zoomLevel}px`,
          height: `${Math.abs(element.height) * zoomLevel}px`,
        }}
        onMouseDown={(e) => handleShapeMouseDown(e, element.id)}
      >
        {activeShapeId === element.id && (
          <>
            <div
              className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-full transform translate-x-1/2 translate-y-1/2 cursor-se-resize z-30 hover:bg-purple-500 dark:hover:bg-purple-600 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, element.id, "se")}
            />
            <div
              className="absolute bottom-0 left-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-full transform -translate-x-1/2 translate-y-1/2 cursor-sw-resize z-30 hover:bg-purple-500 dark:hover:bg-purple-600 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, element.id, "sw")}
            />
            <div
              className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-ne-resize z-30 hover:bg-purple-500 dark:hover:bg-purple-600 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, element.id, "ne")}
            />
            <div
              className="absolute top-0 left-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-nw-resize z-30 hover:bg-purple-500 dark:hover:bg-purple-600 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, element.id, "nw")}
            />
            <button
              className="absolute top-0 right-0 w-6 h-6 bg-red-500 dark:bg-red-600 text-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 hover:bg-red-400 dark:hover:bg-red-500 transition-all duration-200 transform hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                setElements((prev) => {
                  const newElements = prev.filter((el) => el.id !== element.id);
                  elementsRef.current = newElements;
                  debouncedSaveToHistory(newElements, stickyNotes);
                  return newElements;
                });
                if (activeShapeId === element.id) setActiveShapeId(null);
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
          </>
        )}
      </div>
    ) : null
  )}
  {colorPicker && (
    <div
      className="absolute z-50 flex flex-wrap gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
      style={{ left: colorPicker.x, top: colorPicker.y }}
    >
      {colorPalette.map((color, index) => (
        <button
          key={index}
          className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 focus:outline-none transition-all duration-200"
          style={{ backgroundColor: color.bg }}
          onClick={() => handleColorSelect(colorPicker.noteId, color.bg, color.text)}
          title={`Background: ${color.bg}, Text: ${color.text}`}
        />
      ))}
    </div>
  )}
  <div className="absolute bottom-5 right-5 flex items-center gap-2 bg-white dark:bg-gray-700 rounded-full shadow-md p-2 z-50">
    <button
      className="w-8 h-8 flex items-center justify-center bg-purple-600 dark:bg-purple-700 rounded-full hover:bg-purple-500 dark:hover:bg-purple-600 transition-all duration-200"
      onClick={handleZoomOut}
      title="Zoom Out"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    </button>
    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
      {Math.round(zoomLevel * 100)}%
    </span>
    <button
      className="w-8 h-8 flex items-center justify-center bg-purple-600 dark:bg-purple-700 rounded-full hover:bg-purple-500 dark:hover:bg-purple-600 transition-all duration-200"
      onClick={handleZoomIn}
      title="Zoom In"
    >
      <svg
        color="#f9fafb"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    </button>
  </div>
  <CanvasToolbar exportAsPNG={exportAsPNG} exportAsPDF={exportAsPDF} />
  <NavBar
    saveWhiteboard={saveWhiteboard}
    exportAsPNG={exportAsPNG}
    exportAsPDF={exportAsPDF}
  />
</div>
  );
};

export default Canvas;
