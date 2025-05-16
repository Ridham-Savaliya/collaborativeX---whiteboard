'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Canvas from '../components/Canvas';
import Sidebar from '../components/Sidebar';

interface PathElement {
  id: string;
  type: 'path';
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
}

interface ShapeElement {
  id: string;
  type:
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
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
}

interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  isEditing: boolean;
}

interface StickyNote {
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

type WhiteboardElement = PathElement | ShapeElement;

interface WhiteboardState {
  elements: WhiteboardElement[];
  stickyNotes: StickyNote[];
  textElements: TextElement[];
}

const MAX_HISTORY_STEPS = 10;
const RESIZE_HANDLE_SIZE = 8;

const WhiteboardPage: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text'>('pen');
  const [canvasKey, setCanvasKey] = useState<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
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
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [history, setHistory] = useState<WhiteboardState[]>([
    { elements: [], stickyNotes: [], textElements: [] },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [draggingElementType, setDraggingElementType] = useState<
    'stickyNote' | 'text' | null
  >(null);
  const [dragStartOffset, setDragStartOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isResizingHtmlElement, setIsResizingHtmlElement] = useState(false);
  const [resizingHtmlElementId, setResizingHtmlElementId] = useState<string | null>(
    null
  );
  const [resizingHtmlElementType, setResizingHtmlElementType] = useState<
    'stickyNote' | 'text' | null
  >(null);
  const [htmlResizeHandle, setHtmlResizeHandle] = useState<
    'tl' | 'tr' | 'bl' | 'br' | null
  >(null);
  const [htmlResizeStartData, setHtmlResizeStartData] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectedCanvasElementId, setSelectedCanvasElementId] = useState<
    string | null
  >(null);
  const [selectedStickyNoteId, setSelectedStickyNoteId] = useState<string | null>(
    null
  );
  const [draggingCanvasElement, setDraggingCanvasElement] = useState<
    ShapeElement | null
  >(null);
  const [canvasDragStartOffset, setCanvasDragStartOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isResizingCanvasElement, setIsResizingCanvasElement] = useState(false);
  const [canvasResizeHandle, setCanvasResizeHandle] = useState<
    'tl' | 'tr' | 'bl' | 'br' | null
  >(null);
  const [canvasResizeStartData, setCanvasResizeStartData] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [textFontSize, setTextFontSize] = useState<number>(24);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const isShapeElement = (
    element: WhiteboardElement | null
  ): element is ShapeElement => {
    return !!element && element.type !== 'path';
  };

  const saveStateToHistory = useCallback(() => {
    setHistory((prevHistory) => {
      let newHistory = prevHistory.slice(0, historyIndex + 1);
      const currentState: WhiteboardState = {
        elements: [...elements],
        stickyNotes: [...stickyNotes],
        textElements: [...textElements.map((text) => ({ ...text, isEditing: false }))],
      };
      newHistory = [...newHistory, currentState];
      if (newHistory.length > MAX_HISTORY_STEPS + 1) {
        newHistory = newHistory.slice(newHistory.length - (MAX_HISTORY_STEPS + 1));
      }
      return newHistory;
    });
    setHistoryIndex((prevIndex) => {
      const newLength = history.slice(0, prevIndex + 1).length + 1;
      return newLength > MAX_HISTORY_STEPS + 1 ? MAX_HISTORY_STEPS : newLength - 1;
    });
  }, [elements, stickyNotes, textElements, history, historyIndex]);

  const handleElementComplete = useCallback((element: WhiteboardElement) => {
    setElements((prevElements) => [...prevElements, element]);
    saveStateToHistory();
  }, [saveStateToHistory]);

  const addStickyNote = useCallback((note: StickyNote) => {
    setStickyNotes((prevNotes) => [...prevNotes, note]);
    setSelectedStickyNoteId(note.id);
    setSelectedCanvasElementId(null);
    saveStateToHistory();
  }, [saveStateToHistory]);

  useEffect(() => {
    const currentState: WhiteboardState = {
      elements,
      stickyNotes,
      textElements: textElements.map((text) => ({ ...text, isEditing: false })),
    };
    const historyState = history[historyIndex];
    if (
      !historyState ||
      historyState.elements.length !== elements.length ||
      historyState.stickyNotes.length !== stickyNotes.length ||
      historyState.textElements.length !== textElements.length
    ) {
      if (
        elements.length > 0 ||
        stickyNotes.length > 0 ||
        textElements.length > 0 ||
        historyIndex === 0
      ) {
        const timer = setTimeout(saveStateToHistory, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [elements, stickyNotes, textElements, history, historyIndex, saveStateToHistory]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements([...prevState.elements]);
      setStickyNotes([...prevState.stickyNotes]);
      setTextElements([
        ...prevState.textElements.map((text) => ({ ...text, isEditing: false })),
      ]);
      setSelectedCanvasElementId(null);
      setSelectedStickyNoteId(null);
      setHistoryIndex((prevIndex) => prevIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements([...nextState.elements]);
      setStickyNotes([...nextState.stickyNotes]);
      setTextElements([
        ...nextState.textElements.map((text) => ({ ...text, isEditing: false })),
      ]);
      setSelectedCanvasElementId(null);
      setSelectedStickyNoteId(null);
      setHistoryIndex((prevIndex) => prevIndex + 1);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    setStickyNotes([]);
    setTextElements([]);
    setHistory([{ elements: [], stickyNotes: [], textElements: [] }]);
    setHistoryIndex(0);
    setTool('pen');
    setShowShapesDrawer(false);
    setSelectedShapeType(null);
    setSelectedCanvasElementId(null);
    setSelectedStickyNoteId(null);
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasContainerRef.current) {
        setCanvasWidth(canvasContainerRef.current.offsetWidth);
        setCanvasHeight(canvasContainerRef.current.offsetHeight);
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getCanvasContainerMousePosition = (
    event: React.MouseEvent<HTMLDivElement>
  ): { x: number; y: number } => {
    const container = canvasContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const isPointInsideRect = (
    pointX: number,
    pointY: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): boolean => {
    return (
      pointX >= rectX &&
      pointX <= rectX + rectWidth &&
      pointY >= rectY &&
      pointY <= rectY + rectHeight
    );
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getCanvasContainerMousePosition(event);
    const target = event.target as HTMLElement;
    const draggableHtmlElement = target.closest(
      '.sticky-note, .text-element, .sticky-note-handle'
    ) as HTMLElement;

    // Deactivate editing for text elements if clicking outside
    if (
      !draggableHtmlElement ||
      !draggableHtmlElement.classList.contains('text-element')
    ) {
      setTextElements((prevTexts) =>
        prevTexts.map((text) => ({ ...text, isEditing: false }))
      );
    }

    // Handle Sticky Note Interactions
    if (draggableHtmlElement) {
      const isHandle = draggableHtmlElement.classList.contains('sticky-note-handle');
      const elementId = isHandle
        ? draggableHtmlElement.closest('.sticky-note')?.dataset.elementId
        : draggableHtmlElement.dataset.elementId;
      if (!elementId) return;

      const elementType = draggableHtmlElement.classList.contains('sticky-note')
        ? 'stickyNote'
        : 'text';
      const rect = draggableHtmlElement.closest('.sticky-note, .text-element')!
        .getBoundingClientRect();
      const containerRect = canvasContainerRef.current!.getBoundingClientRect();

      if (isHandle && elementType === 'stickyNote') {
        const handleKey = draggableHtmlElement.dataset.handle as
          | 'tl'
          | 'tr'
          | 'bl'
          | 'br';
        const note = stickyNotes.find((n) => n.id === elementId);
        if (note) {
          setIsResizingHtmlElement(true);
          setResizingHtmlElementId(elementId);
          setResizingHtmlElementType('stickyNote');
          setHtmlResizeHandle(handleKey);
          setHtmlResizeStartData({
            x: note.x,
            y: note.y,
            width: note.width,
            height: note.height,
          });
          setSelectedStickyNoteId(elementId);
          setSelectedCanvasElementId(null);
          event.stopPropagation();
          return;
        }
      }

      if (
        (elementType === 'stickyNote' && tool === 'stickyNote') ||
        (elementType === 'text' && tool === 'text')
      ) {
        setDraggingElementId(elementId);
        setDraggingElementType(elementType);
        setDragStartOffset({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
        if (elementType === 'stickyNote') {
          setSelectedStickyNoteId(elementId);
          setSelectedCanvasElementId(null);
        }
        if (elementType === 'text' && tool === 'text') {
          setTextElements((prevTexts) =>
            prevTexts.map((text) =>
              text.id === elementId
                ? { ...text, isEditing: true }
                : { ...text, isEditing: false }
            )
          );
          event.stopPropagation();
          return;
        }
        event.stopPropagation();
        return;
      }
    }

    // Handle Canvas Shape Interactions
    if (tool !== 'pen' && tool !== 'eraser' && tool !== 'highlighter') {
      const clickedShape = elements.find((element) => {
        if (isShapeElement(element)) {
          const minX = Math.min(element.x, element.x + element.width);
          const maxX = Math.max(element.x, element.x + element.width);
          const minY = Math.min(element.y, element.y + element.height);
          const maxY = Math.max(element.y, element.y + element.height);
          return x >= minX && x <= maxX && y >= minY && y <= maxY;
        }
        return false;
      }) as ShapeElement | undefined;

      if (clickedShape) {
        setSelectedCanvasElementId(clickedShape.id);
        setSelectedStickyNoteId(null);
        const handleSize = RESIZE_HANDLE_SIZE;
        const halfHandle = handleSize / 2;
        const handles = {
          tl: { x: clickedShape.x - halfHandle, y: clickedShape.y - halfHandle },
          tr: {
            x: clickedShape.x + clickedShape.width - halfHandle,
            y: clickedShape.y - halfHandle,
          },
          bl: {
            x: clickedShape.x - halfHandle,
            y: clickedShape.y + clickedShape.height - halfHandle,
          },
          br: {
            x: clickedShape.x + clickedShape.width - halfHandle,
            y: clickedShape.y + clickedShape.height - halfHandle,
          },
        };

        for (const [handleKey, handlePos] of Object.entries(handles)) {
          if (
            isPointInsideRect(
              x,
              y,
              handlePos.x,
              handlePos.y,
              handleSize,
              handleSize
            )
          ) {
            setIsResizingCanvasElement(true);
            setCanvasResizeHandle(handleKey as 'tl' | 'tr' | 'bl' | 'br');
            setDraggingCanvasElement(clickedShape);
            setCanvasResizeStartData({
              x: clickedShape.x,
              y: clickedShape.y,
              width: clickedShape.width,
              height: clickedShape.height,
            });
            event.stopPropagation();
            return;
          }
        }

        setDraggingCanvasElement(clickedShape);
        setCanvasDragStartOffset({
          x: x - clickedShape.x,
          y: y - clickedShape.y,
        });
        event.stopPropagation();
        return;
      } else {
        setSelectedCanvasElementId(null);
        setSelectedStickyNoteId(null);
      }
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current) return;
    const { x, y } = getCanvasContainerMousePosition(event);

    // Handle Sticky Note Resizing
    if (
      isResizingHtmlElement &&
      resizingHtmlElementId &&
      resizingHtmlElementType === 'stickyNote' &&
      htmlResizeHandle &&
      htmlResizeStartData
    ) {
      let newX = htmlResizeStartData.x;
      let newY = htmlResizeStartData.y;
      let newWidth = htmlResizeStartData.width;
      let newHeight = htmlResizeStartData.height;

      switch (htmlResizeHandle) {
        case 'tl':
          newX = x;
          newY = y;
          newWidth = htmlResizeStartData.x + htmlResizeStartData.width - x;
          newHeight = htmlResizeStartData.y + htmlResizeStartData.height - y;
          break;
        case 'tr':
          newY = y;
          newWidth = x - htmlResizeStartData.x;
          newHeight = htmlResizeStartData.y + htmlResizeStartData.height - y;
          break;
        case 'bl':
          newX = x;
          newWidth = htmlResizeStartData.x + htmlResizeStartData.width - x;
          newHeight = y - htmlResizeStartData.y;
          break;
        case 'br':
          newWidth = x - htmlResizeStartData.x;
          newHeight = y - htmlResizeStartData.y;
          break;
      }

      const MIN_SIZE = RESIZE_HANDLE_SIZE * 2;
      if (newWidth < MIN_SIZE) {
        if (htmlResizeHandle === 'tl' || htmlResizeHandle === 'bl') {
          newX = htmlResizeStartData.x + htmlResizeStartData.width - MIN_SIZE;
        }
        newWidth = MIN_SIZE;
      }
      if (newHeight < MIN_SIZE) {
        if (htmlResizeHandle === 'tl' || htmlResizeHandle === 'tr') {
          newY = htmlResizeStartData.y + htmlResizeStartData.height - MIN_SIZE;
        }
        newHeight = MIN_SIZE;
      }

      setStickyNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === resizingHtmlElementId
            ? { ...note, x: newX, y: newY, width: newWidth, height: newHeight }
            : note
        )
      );
      setHtmlResizeStartData({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
    // Handle Sticky Note Dragging
    else if (
      draggingElementId &&
      draggingElementType === 'stickyNote' &&
      dragStartOffset
    ) {
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const newX = event.clientX - containerRect.left - dragStartOffset.x;
      const newY = event.clientY - containerRect.top - dragStartOffset.y;
      setStickyNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === draggingElementId ? { ...note, x: newX, y: newY } : note
        )
      );
    }
    // Handle Text Element Dragging
    else if (
      draggingElementId &&
      draggingElementType === 'text' &&
      dragStartOffset
    ) {
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const newX = event.clientX - containerRect.left - dragStartOffset.x;
      const newY = event.clientY - containerRect.top - dragStartOffset.y;
      setTextElements((prevTexts) =>
        prevTexts.map((text) =>
          text.id === draggingElementId ? { ...text, x: newX, y: newY } : text
        )
      );
    }
    // Handle Shape Resizing or Dragging
    else if (draggingCanvasElement && isShapeElement(draggingCanvasElement)) {
      const currentElement = draggingCanvasElement;
      if (
        isResizingCanvasElement &&
        canvasResizeHandle &&
        canvasResizeStartData
      ) {
        let newX = canvasResizeStartData.x;
        let newY = canvasResizeStartData.y;
        let newWidth = canvasResizeStartData.width;
        let newHeight = canvasResizeStartData.height;

        switch (canvasResizeHandle) {
          case 'tl':
            newX = x;
            newY = y;
            newWidth = canvasResizeStartData.x + canvasResizeStartData.width - x;
            newHeight = canvasResizeStartData.y + canvasResizeStartData.height - y;
            break;
          case 'tr':
            newY = y;
            newWidth = x - canvasResizeStartData.x;
            newHeight = canvasResizeStartData.y + canvasResizeStartData.height - y;
            break;
          case 'bl':
            newX = x;
            newWidth = canvasResizeStartData.x + canvasResizeStartData.width - x;
            newHeight = y - canvasResizeStartData.y;
            break;
          case 'br':
            newWidth = x - canvasResizeStartData.x;
            newHeight = y - htmlResizeStartData.y;
            break;
        }

        const MIN_SIZE = RESIZE_HANDLE_SIZE * 2;
        if (newWidth < MIN_SIZE) {
          if (canvasResizeHandle === 'tl' || canvasResizeHandle === 'bl') {
            newX = canvasResizeStartData.x + canvasResizeStartData.width - MIN_SIZE;
          }
          newWidth = MIN_SIZE;
        }
        if (newHeight < MIN_SIZE) {
          if (canvasResizeHandle === 'tl' || canvasResizeHandle === 'tr') {
            newY = canvasResizeStartData.y + canvasResizeStartData.height - MIN_SIZE;
          }
          newHeight = MIN_SIZE;
        }

        setElements((prevElements) =>
          prevElements.map((element) =>
            element.id === currentElement.id
              ? { ...element, x: newX, y: newY, width: newWidth, height: newHeight }
              : element
          )
        );
        setCanvasResizeStartData({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
        setDraggingCanvasElement({
          ...currentElement,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      } else if (canvasDragStartOffset) {
        const newX = x - canvasDragStartOffset.x;
        const newY = y - canvasDragStartOffset.y;
        setElements((prevElements) =>
          prevElements.map((element) =>
            element.id === currentElement.id
              ? { ...element, x: newX, y: newY }
              : element
          )
        );
        setDraggingCanvasElement({
          ...currentElement,
          x: newX,
          y: newY,
        });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingElementId || isResizingHtmlElement || draggingCanvasElement || isResizingCanvasElement) {
      saveStateToHistory();
    }
    setDraggingElementId(null);
    setDraggingElementType(null);
    setDragStartOffset(null);
    setIsResizingHtmlElement(false);
    setResizingHtmlElementId(null);
    setResizingHtmlElementType(null);
    setHtmlResizeHandle(null);
    setHtmlResizeStartData(null);
    setDraggingCanvasElement(null);
    setCanvasDragStartOffset(null);
    setIsResizingCanvasElement(false);
    setCanvasResizeHandle(null);
    setCanvasResizeStartData(null);
  };

  const updateStickyNoteText = (id: string, newText: string) => {
    setStickyNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, text: newText } : note
      )
    );
  };

  const updateStickyNoteTextColor = (id: string, newColor: string) => {
    setStickyNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, textColor: newColor } : note
      )
    );
  };

  const updateStickyNoteBgColor = (id: string, newColor: string) => {
    setStickyNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, bgColor: newColor } : note
      )
    );
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
    if (selectedStickyNoteId === id) {
      setSelectedStickyNoteId(null);
    }
    saveStateToHistory();
  };

  const updateTextElementText = (id: string, newText: string) => {
    setTextElements((prevTexts) =>
      prevTexts.map((text) =>
        text.id === id ? { ...text, text: newText } : text
      )
    );
  };

  const deleteTextElement = (id: string) => {
    setTextElements((prevTexts) => prevTexts.filter((text) => text.id !== id));
    saveStateToHistory();
  };

  const toggleTextElementEditing = (id: string, isEditing: boolean) => {
    setTextElements((prevTexts) =>
      prevTexts.map((text) =>
        text.id === id
          ? { ...text, isEditing }
          : { ...text, isEditing: false }
      )
    );
  };

  const textInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
  useEffect(() => {
    const editingTextElement = textElements.find((text) => text.isEditing);
    if (editingTextElement && textInputRefs.current[editingTextElement.id]) {
      const timer = setTimeout(() => {
        textInputRefs.current[editingTextElement.id]?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [textElements]);

  return (
    <div className="flex h-screen bg-purple-900 font-sans">
      <aside className="w-[4vw] h-screen">
        <div className="overflow-y-auto h-full pr-2 custom-scroll">
          <Sidebar
            setColor={setStrokeColor}
            setLineWidth={setLineWidth}
            setTool={setTool}
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
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            textFontSize={textFontSize}
            setTextFontSize={setTextFontSize}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            addStickyNote={addStickyNote}
          />
        </div>
      </aside>

      <main
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <Canvas
          key={canvasKey}
          width={canvasWidth > 0 ? canvasWidth : 100}
          height={canvasHeight > 0 ? canvasHeight : 100}
          strokeColor={strokeColor}
          lineWidth={lineWidth}
          tool={tool}
          selectedShapeType={selectedShapeType}
          elements={elements}
          onElementComplete={handleElementComplete}
          selectedElementId={selectedCanvasElementId}
        />
        {stickyNotes.map((note) => (
          <div
            key={note.id}
            data-element-id={note.id}
            className={`sticky-note absolute p-3 rounded-md shadow-lg border border-gray-300 ${
              draggingElementId === note.id || resizingHtmlElementId === note.id
                ? 'cursor-grabbing'
                : tool === 'stickyNote'
                ? 'cursor-grab'
                : 'cursor-default'
            }`}
            style={{
              left: note.x,
              top: note.y,
              width: note.width,
              height: note.height,
              backgroundColor: note.bgColor,
              color: note.textColor,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              zIndex:
                draggingElementId === note.id || resizingHtmlElementId === note.id
                  ? 100
                  : 20,
            }}
          >
            <textarea
              className="w-full h-full bg-transparent resize-none outline-none text-base"
              value={note.text}
              onChange={(e) => updateStickyNoteText(note.id, e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <input
                type="color"
                value={note.textColor}
                onChange={(e) => updateStickyNoteTextColor(note.id, e.target.value)}
                className="w-6 h-6 p-0 border-none rounded-full cursor-pointer"
                title="Text Color"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <input
                type="color"
                value={note.bgColor}
                onChange={(e) => updateStickyNoteBgColor(note.id, e.target.value)}
                className="w-6 h-6 p-0 border-none rounded-full cursor-pointer"
                title="Background Color"
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <button
              onClick={() => deleteStickyNote(note.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
              title="Delete Note"
              onMouseDown={(e) => e.stopPropagation()}
            >
              X
            </button>
            {selectedStickyNoteId === note.id && (
              <>
                <div
                  className="absolute border-2 border-cyan-400"
                  style={{
                    left: -2,
                    top: -2,
                    width: note.width + 4,
                    height: note.height + 4,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  className="sticky-note-handle absolute w-4 h-4 bg-cyan-400 border border-black"
                  style={{ top: -8, left: -8, cursor: 'nwse-resize' }}
                  data-handle="tl"
                  data-element-id={note.id}
                />
                <div
                  className="sticky-note-handle absolute w-4 h-4 bg-cyan-400 border border-black"
                  style={{ top: -8, right: -8, cursor: 'nesw-resize' }}
                  data-handle="tr"
                  data-element-id={note.id}
                />
                <div
                  className="sticky-note-handle absolute w-4 h-4 bg-cyan-400 border border-black"
                  style={{ bottom: -8, left: -8, cursor: 'nesw-resize' }}
                  data-handle="bl"
                  data-element-id={note.id}
                />
                <div
                  className="sticky-note-handle absolute w-4 h-4 bg-cyan-400 border border-black"
                  style={{ bottom: -8, right: -8, cursor: 'nwse-resize' }}
                  data-handle="br"
                  data-element-id={note.id}
                />
              </>
            )}
          </div>
        ))}
        {textElements.map((textElement) => (
          <div
            key={textElement.id}
            data-element-id={textElement.id}
            className={`text-element absolute ${
              draggingElementId === textElement.id
                ? 'cursor-grabbing'
                : tool === 'text'
                ? 'cursor-grab'
                : 'cursor-default'
            }`}
            style={{
              left: textElement.x,
              top: textElement.y,
              color: textElement.color,
              fontSize: `${textElement.fontSize}px`,
              zIndex: draggingElementId === textElement.id ? 100 : 30,
            }}
            onMouseDown={(e) => {
              if (tool === 'text') {
              } else {
                e.stopPropagation();
              }
            }}
          >
            {textElement.isEditing ? (
              <input
                ref={(el) => {
                  if (el) textInputRefs.current[textElement.id] = el;
                }}
                type="text"
                value={textElement.text}
                onChange={(e) => updateTextElementText(textElement.id, e.target.value)}
                onBlur={() => toggleTextElementEditing(textElement.id, false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    toggleTextElementEditing(textElement.id, false);
                  }
                }}
                className="bg-transparent outline-none border-b border-purple-500 text-inherit"
                style={{
                  color: textElement.color,
                  fontSize: `${textElement.fontSize}px`,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={() => toggleTextElementEditing(textElement.id, true)}
                className="p-1 inline-block"
              >
                {textElement.text || 'Double click to edit'}
              </span>
            )}
            {!textElement.isEditing && (
              <button
                onClick={() => deleteTextElement(textElement.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
                title="Delete Text"
                onMouseDown={(e) => e.stopPropagation()}
              >
                X
              </button>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};

export default WhiteboardPage;
