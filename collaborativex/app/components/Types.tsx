// Define types for the whiteboard application
'use client';
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
  type: 'rectangle' | 'circle' | 'line' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'heart' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon' | 'cross' | 'smiley' | 'cloud';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
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

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  isEditing: boolean;
}

export type WhiteboardElement = PathElement | ShapeElement | StickyNote | TextElement;
