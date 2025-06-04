export interface StickyNote {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface WhiteboardElement {
  id: string;
  type: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'text';
  points: Array<{ x: number; y: number }>;
  color: string;
  lineWidth: number;
  shapeType?:
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
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}
