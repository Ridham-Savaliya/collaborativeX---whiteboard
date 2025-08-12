export interface Point {
  x: number;
  y: number;
}

export interface PathElement {
  id: string;
  type: 'path';
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
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
  isFixed: boolean;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface StickyNote {
  id: string;
  type: 'stickyNote';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  textColor: string;
  bgColor: string;
}

export type WhiteboardElement = PathElement | ShapeElement | TextElement;

export interface CanvasState {
  elements: WhiteboardElement[];
  stickyNotes: StickyNote[];
  activeElement: string | null;
  editingElement: string | null;
}

export interface PanZoomState {
  zoomLevel: number;
  panOffset: Point;
}

export interface DrawingState {
  isDrawing: boolean;
  currentPath: Point[];
  startPoint: Point | null;
}

export interface TextStyles {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily: string;
}
