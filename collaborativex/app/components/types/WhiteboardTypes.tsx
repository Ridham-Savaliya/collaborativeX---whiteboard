/**
 * Comprehensive TypeScript definitions for the Whiteboard application
 * Provides type safety and clear interfaces for all components
 */

export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface PathElement {
  id: string;
  type: 'path';
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
  timestamp?: number;
}

export interface ShapeElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
  isFixed?: boolean;
  timestamp?: number;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  timestamp?: number;
}

export interface StickyNote {
  id: string;
  type: 'stickyNote';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  content?: string;
  textColor?: string;
  bgColor?: string;
  color?: string;
  timestamp?: number;
}

export type WhiteboardElement = PathElement | ShapeElement | TextElement;

export interface CanvasState {
  elements: WhiteboardElement[];
  stickyNotes: StickyNote[];
  transform: Transform;
}

export interface DragState {
  isDragging: boolean;
  dragOffset: Point;
  activeId: string | null;
  startPoint: Point | null;
}

export interface ResizeState {
  isResizing: boolean;
  direction: string | null;
  activeId: string | null;
}

export interface DrawingState {
  isDrawing: boolean;
  currentElement: WhiteboardElement | null;
  tool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null;
}

export interface TextStyles {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily: string;
}

export interface CanvasProps {
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
  textStyles: TextStyles;
}

export interface ViewportInfo {
  canvasRect: DOMRect;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
