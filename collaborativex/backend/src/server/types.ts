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
    | 'arrowRight'
    | 'arrowLeft'
    | 'arrowUp'
    | 'arrowDown'
    | 'heart'
    | 'pentagon'
    | 'hexagon'
    | 'heptagon'
    | 'octagon'a
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

export interface StickyNote {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface ActivityUpdate {
  userId?: string; // Username or user ID
  email?: string; // Username or user ID
  action: string; // e.g., "drew a line", "added a sticky note"
  timestamp: string;
}

export interface UserPresence {
  userId?: string;
  email?: string;
  username: string;
  joined: boolean; // true for join, false for leave
}
