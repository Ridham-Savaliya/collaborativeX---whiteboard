'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Canvas from '../components/Canvas';
import Sidebar from '../components/Sidebar';
import { StickyNote } from '../components/Types';

const Whiteboard: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null>('pen');
  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [selectedShapeType, setSelectedShapeType] = useState<
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
    | null
  >(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [textFontSize, setTextFontSize] = useState<number>(24);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [canvasKey, setCanvasKey] = useState<number>(0);
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  // History states for undo/redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  const clearCanvas = () => {
    // setElements([]); // Clear drawing elements
    setStickyNotes([]); // Clear sticky notes
    setHistory([[]]); // Reset history to a single empty state
    setHistoryIndex(0); // Reset history index
  };

  const saveToHistory = useCallback((elements: any[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, elements];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      // Apply the previous state
      // This will be handled by the Canvas component
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      // Apply the next state
      // This will be handled by the Canvas component
    }
  }, [canRedo]);

  const handleToolChange = useCallback((newTool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null) => {
    setTool(newTool);
    
    // If shape tool selected, we need to show the shapes drawer
    if (newTool === 'shape') {
      setShowShapesDrawer(true);
    } else {
      setShowShapesDrawer(false);
    }
  }, []);

  const addStickyNote = useCallback((note: StickyNote) => {
    setStickyNotes(prev => [...prev, note]);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar
        setColor={setStrokeColor}
        setLineWidth={setLineWidth}
        setTool={handleToolChange}
        currentColor={strokeColor}
        currentLineWidth={lineWidth}
        currentTool={tool}
        clearCanvas={clearCanvas}
        setShowShapesDrawer={setShowShapesDrawer}
        showShapesDrawer={showShapesDrawer}
        setShapeType={setSelectedShapeType}
        currentShapeType={selectedShapeType}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        textFontSize={textFontSize}
        setTextFontSize={setTextFontSize}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        addStickyNote={addStickyNote}
      />

      <main className="flex-1 overflow-hidden relative">
        <Canvas
          key={canvasKey}
          strokeColor={strokeColor}
          lineWidth={lineWidth}
          tool={tool}
          shapeType={selectedShapeType}
          stickyNotes={stickyNotes}
          setStickyNotes={setStickyNotes}
          textFontSize={textFontSize}
          saveToHistory={saveToHistory}
          historyIndex={historyIndex}
          history={history}
        />
      </main>
    </div>
  );
};

export default Whiteboard;
