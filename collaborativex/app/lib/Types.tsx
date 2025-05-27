

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
  tool: 'pen' | 'eraser' | 'highlighter' | 'stickyNote' | 'text' | 'shapes';
}



export interface ShapeElement {
  id: string;
   type: 'rectangle' | 'circle' | 'line' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'heart' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon' | 'cross' | 'smiley' | 'cloud';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
}

export type WhiteboardElement = PathElement | ShapeElement;

export interface Whiteboard {
  slug: string;
  name: string;
  createdAt: string;
  elements: WhiteboardElement[];
  createdBy: string; // User ID
}
