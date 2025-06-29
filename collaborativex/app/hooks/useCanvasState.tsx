import { useState, useCallback } from 'react';
import { WhiteboardElement, StickyNote, TextStyles } from '../components/Types'
;

export interface CanvasState {
  elements: WhiteboardElement[];
  stickyNotes: StickyNote[];
  activeElement: string | null;
  tool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null;
  strokeColor: string;
  lineWidth: number;
  textStyles: TextStyles;
}

export const useCanvasState = () => {
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null>('pen');
  const [strokeColor, setStrokeColor] = useState('#2563eb');
  const [lineWidth, setLineWidth] = useState(3);
  const [textStyles, setTextStyles] = useState<TextStyles>({
    bold: false,
    italic: false,
    underline: false,
    fontFamily: 'Inter, system-ui, sans-serif'
  });

  const clearCanvas = useCallback(() => {
    setElements([]);
    setStickyNotes([]);
    setActiveElement(null);
  }, []);

  const addElement = useCallback((element: WhiteboardElement) => {
    setElements(prev => [...prev, element]);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<WhiteboardElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  const removeElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (activeElement === id) {
      setActiveElement(null);
    }
  }, [activeElement]);

  return {
    elements,
    setElements,
    stickyNotes,
    setStickyNotes,
    activeElement,
    setActiveElement,
    tool,
    setTool,
    strokeColor,
    setStrokeColor,
    lineWidth,
    setLineWidth,
    textStyles,
    setTextStyles,
    clearCanvas,
    addElement,
    updateElement,
    removeElement
  };
};
