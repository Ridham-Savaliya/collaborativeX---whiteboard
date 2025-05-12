'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Canvas from '../components/Canvas';
import Sidebar from '../components/Sidebar';

// Define types for different elements on the canvas (must match Canvas.tsx)
interface PathElement {
  id: string;
  type: 'path';
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number; // Path width
  tool: 'pen' | 'eraser' | 'highlighter';
}

interface ShapeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'heart' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon' | 'cross' | 'smiley' | 'cloud';
  x: number;
  y: number;
  width: number; // Shape width (for bounding box)
  height: number; // Shape height (for bounding box)
  color: string;
  lineWidth: number; // Shape stroke width
}

// Define type for Text Element (rendered as HTML)
interface TextElement {
    id: string;
    type: 'text';
    x: number;
    y: number;
    text: string;
    color: string; // Text color
    fontSize: number; // Font size in pixels
    isEditing: boolean; // To control if the input field is visible
}


type WhiteboardElement = PathElement | ShapeElement; // Canvas elements

// Define type for Sticky Note (with color properties)
interface StickyNote {
  id: string;
  type: 'stickyNote'; // Added type for consistency
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  textColor: string;
  bgColor: string;
}

// Define the state structure for history - NOW INCLUDES TEXT ELEMENTS
interface WhiteboardState {
  elements: WhiteboardElement[];
  stickyNotes: StickyNote[];
  textElements: TextElement[]; // Add text elements to history state
}

const MAX_HISTORY_STEPS = 10; // Define the maximum number of undoable steps
const RESIZE_HANDLE_SIZE = 8; // Size of the resize handles in pixels for both canvas and HTML elements

const WhiteboardPage: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text'>('pen');
  const [canvasKey, setCanvasKey] = useState<number>(0);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);

  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | 'line' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'heart' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon' | 'cross' | 'smiley' | 'cloud' | null>(null);

  // State for all canvas elements, sticky notes, and text elements
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([]); // State for text elements

  // State for Undo/Redo History
  const [history, setHistory] = useState<WhiteboardState[]>([{ elements: [], stickyNotes: [], textElements: [] }]); // Initialize history with empty text elements
  const [historyIndex, setHistoryIndex] = useState(0);

  // State for dragging HTML elements (sticky notes and text)
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null); // Can be sticky note or text ID
  const [draggingElementType, setDraggingElementType] = useState<'stickyNote' | 'text' | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState<{ x: number; y: number } | null>(null);

  // State for resizing HTML elements (sticky notes and text - though text resizing isn't implemented yet)
  const [isResizingHtmlElement, setIsResizingHtmlElement] = useState(false);
  const [resizingHtmlElementId, setResizingHtmlElementId] = useState<string | null>(null);
  const [resizingHtmlElementType, setResizingHtmlElementType] = useState<'stickyNote' | 'text' | null>(null);
  const [htmlResizeHandle, setHtmlResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [htmlResizeStartData, setHtmlResizeStartData] = useState<{ x: number; y: number; width: number; height: number } | null>(null); // Initial position and size


  // State for currently selected canvas element ID (for dragging/resizing)
  const [selectedCanvasElementId, setSelectedCanvasElementId] = useState<string | null>(null);
  // State for dragging/resizing canvas elements
  const [draggingCanvasElement, setDraggingCanvasElement] = useState<WhiteboardElement | null>(null);
  const [canvasDragStartOffset, setCanvasDragStartOffset] = useState<{ x: number; y: number } | null>(null);
  const [isResizingCanvasElement, setIsResizingCanvasElement] = useState(false);
  const [canvasResizeHandle, setCanvasResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null); // Which handle is being dragged (top-left, top-right, etc.)
  const [canvasResizeStartData, setCanvasResizeStartData] = useState<{ x: number; y: number; width: number; height: number } | null>(null); // Initial position and size


  // Text Font Size state
  const [textFontSize, setTextFontSize] = useState<number>(24); // Default font size for new text

  // Function to add the current state to history
  const saveStateToHistory = useCallback(() => {
    setHistory(prevHistory => {
      // Trim history if we are not at the latest state
      let newHistory = prevHistory.slice(0, historyIndex + 1);

      // Add the current state - NOW INCLUDES TEXT ELEMENTS
      const currentState: WhiteboardState = {
        elements: [...elements],
        stickyNotes: [...stickyNotes],
        textElements: [...textElements.map(text => ({...text, isEditing: false}))], // Save with isEditing: false
      };
      newHistory = [...newHistory, currentState];

      // Limit history size
      if (newHistory.length > MAX_HISTORY_STEPS + 1) { // +1 for the initial state
          newHistory = newHistory.slice(newHistory.length - (MAX_HISTORY_STEPS + 1));
      }

      return newHistory;
    });
    // Update historyIndex to the new end of the history array
    setHistoryIndex(prevIndex => {
        const newLength = history.slice(0, prevIndex + 1).length + 1;
        return newLength > MAX_HISTORY_STEPS + 1 ? MAX_HISTORY_STEPS : newLength - 1;
    });

  }, [elements, stickyNotes, textElements, history, historyIndex]); // Dependencies for useCallback

  // Function called by Canvas when an element is finished drawing
  const handleElementComplete = useCallback((element: WhiteboardElement) => {
    setElements(prevElements => [...prevElements, element]);
    // History save will be triggered by the useEffect watching elements
  }, []);

  // Effect to save state to history whenever elements, stickyNotes, or textElements change
  useEffect(() => {
      const currentState: WhiteboardState = { elements, stickyNotes, textElements: textElements.map(text => ({...text, isEditing: false})) };
      const historyState = history[historyIndex];

      // Basic check: If element, sticky note, or text element count differs, save history
      // More robust check would compare content, but this is simpler for "easy"
      if (!historyState || historyState.elements.length !== elements.length || historyState.stickyNotes.length !== stickyNotes.length || historyState.textElements.length !== textElements.length) {
           // Add a small delay to group rapid changes (like drawing many points)
           // Only save history if there are elements or sticky notes to save, or if it's the initial state
           if (elements.length > 0 || stickyNotes.length > 0 || textElements.length > 0 || historyIndex === 0) {
                const timer = setTimeout(saveStateToHistory, 50); // Adjust delay as needed
                return () => clearTimeout(timer); // Cleanup timer
           }
      }

  }, [elements, stickyNotes, textElements, history, historyIndex, saveStateToHistory]); // Dependencies

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements([...prevState.elements]);
      setStickyNotes([...prevState.stickyNotes]);
      setTextElements([...prevState.textElements.map(text => ({...text, isEditing: false}))]); // Ensure text elements are not in editing mode after undo
      setSelectedCanvasElementId(null); // Deselect any canvas element on undo/redo
      setHistoryIndex(prevIndex => prevIndex - 1);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements([...nextState.elements]);
      setStickyNotes([...nextState.stickyNotes]);
      setTextElements([...nextState.textElements.map(text => ({...text, isEditing: false}))]); // Ensure text elements are not in editing mode after redo
      setSelectedCanvasElementId(null); // Deselect any canvas element on undo/redo
      setHistoryIndex(prevIndex => prevIndex + 1);
    }
  };

  // Function to clear all elements
  const clearCanvas = () => {
    setElements([]); // Clear canvas elements
    setStickyNotes([]); // Clear sticky notes
    setTextElements([]); // Clear text elements
    setHistory([{ elements: [], stickyNotes: [], textElements: [] }]); // Reset history
    setHistoryIndex(0); // Reset history index
    setTool('pen'); // Default to pen after clearing
    setShowShapesDrawer(false);
    setSelectedShapeType(null);
    setSelectedCanvasElementId(null); // Deselect canvas element
  };

  // Effect to update canvas dimensions when the container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasContainerRef.current) {
        setCanvasWidth(canvasContainerRef.current.offsetWidth);
        setCanvasHeight(canvasContainerRef.current.offsetHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Helper to get mouse position relative to the canvas container
  const getCanvasContainerMousePosition = (event: React.MouseEvent<HTMLDivElement>): { x: number; y: number } => {
    const container = canvasContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // Helper to check if a point is inside a rectangle (used for hit testing shapes and handles)
  const isPointInsideRect = (pointX: number, pointY: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean => {
      const normalizedX = rectWidth < 0 ? rectX + rectWidth : rectX;
      const normalizedY = rectHeight < 0 ? rectY + rectHeight : rectY;
      const normalizedWidth = Math.abs(rectWidth);
      const normalizedHeight = Math.abs(rectHeight);

      return pointX >= normalizedX && pointX <= normalizedX + normalizedWidth &&
             pointY >= normalizedY && pointY <= normalizedY + normalizedHeight;
  };


  // Handle mouse down on the canvas container
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
     const { x, y } = getCanvasContainerMousePosition(event);

     // Check if the click is on an existing draggable HTML element (sticky note or text)
     const target = event.target as HTMLElement;
     const draggableHtmlElement = target.closest('.sticky-note, .text-element') as HTMLElement;

     // Deactivate editing for all text elements if clicking outside of one
     if (!draggableHtmlElement || !draggableHtmlElement.classList.contains('text-element')) {
         setTextElements(prevTexts => prevTexts.map(text => ({...text, isEditing: false})));
     }

     // --- Handle Resizing for HTML elements (Sticky Notes) ---
     if (draggableHtmlElement && (draggableHtmlElement.classList.contains('sticky-note') || draggableHtmlElement.classList.contains('text-element'))) {
         const elementId = draggableHtmlElement.dataset.elementId as string;
         const elementType = draggableHtmlElement.classList.contains('sticky-note') ? 'stickyNote' : 'text';

         // Check if clicking on a resize handle
         const handleSize = RESIZE_HANDLE_SIZE;
         const halfHandle = handleSize / 2;
         const rect = draggableHtmlElement.getBoundingClientRect();
         const containerRect = canvasContainerRef.current!.getBoundingClientRect();

         // Calculate handle positions relative to the container
         const handles = {
             tl: { x: rect.left - containerRect.left - halfHandle, y: rect.top - containerRect.top - halfHandle },
             tr: { x: rect.right - containerRect.left - halfHandle, y: rect.top - containerRect.top - halfHandle },
             bl: { x: rect.left - containerRect.left - halfHandle, y: rect.bottom - containerRect.top - halfHandle },
             br: { x: rect.right - containerRect.left - halfHandle, y: rect.bottom - containerRect.top - halfHandle },
         };

         for (const handleKey in handles) {
             const handlePos = handles[handleKey as keyof typeof handles];
             if (isPointInsideRect(x, y, handlePos.x, handlePos.y, handleSize, handleSize)) {
                 setIsResizingHtmlElement(true);
                 setResizingHtmlElementId(elementId);
                 setResizingHtmlElementType(elementType);
                 setHtmlResizeHandle(handleKey as 'tl' | 'tr' | 'bl' | 'br');

                 // Store initial data for resizing calculation
                 setHtmlResizeStartData({
                     x: rect.left - containerRect.left,
                     y: rect.top - containerRect.top,
                     width: rect.width,
                     height: rect.height,
                 });
                 event.stopPropagation();
                 return; // Stop processing here
             }
         }

         // --- Handle Dragging for HTML elements (Sticky Notes and Text) ---
          // If click is on the element itself (not a handle) and the corresponding tool is active, start drag
         if ((elementType === 'stickyNote' && tool === 'stickyNote') || (elementType === 'text' && tool === 'text')) {
             setDraggingElementId(elementId);
             setDraggingElementType(elementType);
             // Offset relative to the element's top-left corner
             setDragStartOffset({
                 x: event.clientX - rect.left,
                 y: event.clientY - rect.top,
             });

             // If it's a text element and we are in text tool, enable editing on click
             if (elementType === 'text' && tool === 'text') {
                 setTextElements(prevTexts =>
                     prevTexts.map(text =>
                         text.id === elementId ? { ...text, isEditing: true } : { ...text, isEditing: false } // Deactivate others
                     )
                 );
                  // Prevent canvas drawing when clicking a text element
                 event.stopPropagation();
                 return; // Stop processing here
             }
              // Prevent canvas drawing when clicking a sticky note
             event.stopPropagation();
             return; // Stop processing here
         }
     }


     // --- Handle Canvas Element (Shape) Selection, Dragging, and Resizing ---
     // Only attempt to select/drag/resize canvas elements if the tool is NOT a drawing tool
     if (tool !== 'pen' && tool !== 'eraser' && tool !== 'highlighter') {
         // Check if clicking on a resize handle of the currently selected shape
         if (selectedCanvasElementId) {
             const selectedElement = elements.find(el => el.id === selectedCanvasElementId) as ShapeElement | undefined;
             if (selectedElement && selectedElement.type !== 'path') { // Ensure it's a shape
                 const handleSize = RESIZE_HANDLE_SIZE;
                 const halfHandle = handleSize / 2;

                 // Calculate handle positions (relative to canvas container)
                 const handles = {
                     tl: { x: selectedElement.x - halfHandle, y: selectedElement.y - halfHandle },
                     tr: { x: selectedElement.x + selectedElement.width - halfHandle, y: selectedElement.y - halfHandle },
                     bl: { x: selectedElement.x - halfHandle, y: selectedElement.y + selectedElement.height - halfHandle },
                     br: { x: selectedElement.x + selectedElement.width - halfHandle, y: selectedElement.y + selectedElement.height - halfHandle },
                 };

                 // Check if click is inside any handle
                 for (const handleKey in handles) {
                     const handlePos = handles[handleKey as keyof typeof handles];
                     if (isPointInsideRect(x, y, handlePos.x, handlePos.y, handleSize, handleSize)) {
                         setIsResizingCanvasElement(true);
                         setCanvasResizeHandle(handleKey as 'tl' | 'tr' | 'bl' | 'br');
                         setDraggingCanvasElement(selectedElement); // Store the element being resized
                         // Store initial data for resizing calculation
                         setCanvasResizeStartData({
                             x: selectedElement.x,
                             y: selectedElement.y,
                             width: selectedElement.width,
                             height: selectedElement.height,
                         });
                         event.stopPropagation();
                         return; // Stop processing here
                     }
                 }
             }
         }

         // If not resizing, check if clicking on an existing shape to select/drag
         const clickedShape = elements.find(element => {
             if (element.type !== 'path') { // Only check shapes for now
                 // Simple bounding box hit test for shapes
                 const minX = Math.min(element.x, element.x + element.width);
                 const maxX = Math.max(element.x, element.x + element.width);
                 const minY = Math.min(element.y, element.y + element.height);
                 const maxY = Math.max(element.y, element.y + element.height);

                 return x >= minX && x <= maxX && y >= minY && y <= maxY;
             }
             return false; // Don't hit test paths for selection/dragging yet
         });

         if (clickedShape) {
             setSelectedCanvasElementId(clickedShape.id);
             setDraggingCanvasElement(clickedShape); // Store the element being dragged
              setCanvasDragStartOffset({ // Offset relative to the element's top-left corner
                 x: x - (clickedShape as ShapeElement).x, // Cast to ShapeElement for x, y
                 y: y - (clickedShape as ShapeElement).y,
             });
             // Prevent canvas drawing if a shape is selected/dragged
             event.stopPropagation();
             return;
         } else {
             // If clicked on canvas but not on a shape or handle, deselect any selected canvas element
             setSelectedCanvasElementId(null);
         }
     }


    // --- Handle Adding New Elements (Sticky Note or Text) ---
    // If click is not on any existing element (HTML or Canvas) and the tool is stickyNote or text, add a new one
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      if (tool === 'stickyNote') {
          const newNote: StickyNote = {
            id: `sticky-${Date.now()}`,
            type: 'stickyNote',
            x: clickX,
            y: clickY,
            width: 180,
            height: 120,
            text: 'New Sticky Note',
            textColor: '#000000',
            bgColor: '#FFFF88',
          };
          setStickyNotes(prevNotes => [...prevNotes, newNote]);
           // History save will be triggered by the useEffect
      } else if (tool === 'text') {
           const newTextElement: TextElement = {
               id: `text-${Date.now()}`,
               type: 'text',
               x: clickX,
               y: clickY,
               text: '', // Start with empty text for user input
               color: strokeColor, // Use current stroke color for text
               fontSize: textFontSize, // Use the current textFontSize from state
               isEditing: true, // Start in editing mode
           };
           setTextElements(prevTexts => {
               const updatedTexts = [...prevTexts.map(text => ({...text, isEditing: false})), newTextElement]; // Deactivate others and add new
               return updatedTexts;
           });
           // History save will be triggered by the useEffect
      }
    }
     // If tool is a drawing tool (pen, eraser, highlighter) and click is not on an element, allow canvas events to propagate for drawing
  };

  // Handle mouse move on the canvas container
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      const { x, y } = getCanvasContainerMousePosition(event);

      // --- Handle Resizing for HTML elements (Sticky Notes) ---
      if (isResizingHtmlElement && resizingHtmlElementId && resizingHtmlElementType && htmlResizeHandle && htmlResizeStartData) {
          const deltaX = x - (htmlResizeStartData.x + (htmlResizeStartData.width / 2) - (htmlResizeStartData.width / 2)); // Calculate delta from original position
          const deltaY = y - (htmlResizeStartData.y + (htmlResizeStartData.height / 2) - (htmlResizeStartData.height / 2)); // Calculate delta from original position

           let newX = htmlResizeStartData.x;
           let newY = htmlResizeStartData.y;
           let newWidth = htmlResizeStartData.width;
           let newHeight = htmlResizeStartData.height;

           // Calculate new dimensions and position based on handle
           switch (htmlResizeHandle) {
               case 'tl':
                   newX = htmlResizeStartData.x + deltaX;
                   newY = htmlResizeStartData.y + deltaY;
                   newWidth = htmlResizeStartData.width - deltaX;
                   newHeight = htmlResizeStartData.height - deltaY;
                   break;
               case 'tr':
                   newY = htmlResizeStartData.y + deltaY;
                   newWidth = htmlResizeStartData.width + deltaX;
                   newHeight = htmlResizeStartData.height - deltaY;
                   break;
               case 'bl':
                   newX = htmlResizeStartData.x + deltaX;
                   newWidth = htmlResizeStartData.width - deltaX;
                   newHeight = htmlResizeStartData.height + deltaY;
                   break;
               case 'br':
                   newWidth = htmlResizeStartData.width + deltaX;
                   newHeight = htmlResizeStartData.height + deltaY;
                   break;
           }

           // Prevent negative width/height (optional, but good practice)
           if (newWidth < RESIZE_HANDLE_SIZE) newWidth = RESIZE_HANDLE_SIZE;
           if (newHeight < RESIZE_HANDLE_SIZE) newHeight = RESIZE_HANDLE_SIZE;

           // Update the element's state
           if (resizingHtmlElementType === 'stickyNote') {
               setStickyNotes(prevNotes =>
                   prevNotes.map(note =>
                       note.id === resizingHtmlElementId ? { ...note, x: newX, y: newY, width: newWidth, height: newHeight } : note
                   )
               );
           } else if (resizingHtmlElementType === 'text') {
               // Resizing text elements (changing font size) is more complex.
               // For now, we'll just allow dragging. Resizing font size via handles is a future enhancement.
               // If you wanted to implement font size resizing, you'd calculate a new font size
               // based on the drag distance and update the text element's fontSize state.
           }

           // Update the starting data for the next mouse move event
           setHtmlResizeStartData({ x: newX, y: newY, width: newWidth, height: newHeight });


      }
      // --- Handle Dragging for HTML elements (Sticky Notes and Text) ---
      else if (draggingElementId && draggingElementType && canvasContainerRef.current && dragStartOffset) {
          const containerRect = canvasContainerRef.current.getBoundingClientRect();
          const newX = event.clientX - containerRect.left - dragStartOffset.x;
          const newY = event.clientY - containerRect.top - dragStartOffset.y;

          if (draggingElementType === 'stickyNote') {
              setStickyNotes(prevNotes =>
                  prevNotes.map(note =>
                      note.id === draggingElementId ? { ...note, x: newX, y: newY } : note
                  )
               );
          } else if (draggingElementType === 'text') {
               setTextElements(prevTexts =>
                   prevTexts.map(text =>
                       text.id === draggingElementId ? { ...text, x: newX, y: newY } : text
                   )
               );
          }
      }
      // --- Handle Dragging/Resizing for Canvas elements (shapes) ---
      else if (draggingCanvasElement && draggingCanvasElement.type !== 'path' && canvasContainerRef.current && canvasResizeStartData) {
           const currentElement = draggingCanvasElement as ShapeElement; // Cast for easier access to shape properties

           if (isResizingCanvasElement && canvasResizeHandle) {
               // Calculate new dimensions based on resize handle and mouse movement
               const deltaX = x - (canvasResizeStartData.x + (canvasResizeStartData.width / 2) - (canvasResizeStartData.width / 2)); // Calculate delta from original position
               const deltaY = y - (canvasResizeStartData.y + (canvasResizeStartData.height / 2) - (canvasResizeStartData.height / 2)); // Calculate delta from original position

               let newX = canvasResizeStartData.x;
               let newY = canvasResizeStartData.y;
               let newWidth = canvasResizeStartData.width;
               let newHeight = canvasResizeStartData.height;

               switch (canvasResizeHandle) {
                   case 'tl':
                       newX = canvasResizeStartData.x + deltaX;
                       newY = canvasResizeStartData.y + deltaY;
                       newWidth = canvasResizeStartData.width - deltaX;
                       newHeight = canvasResizeStartData.height - deltaY;
                       break;
                   case 'tr':
                       newY = canvasResizeStartData.y + deltaY;
                       newWidth = canvasResizeStartData.width + deltaX;
                       newHeight = canvasResizeStartData.height - deltaY;
                       break;
                   case 'bl':
                       newX = canvasResizeStartData.x + deltaX;
                       newWidth = canvasResizeStartData.width - deltaX;
                       newHeight = canvasResizeStartData.height + deltaY;
                       break;
                   case 'br':
                       newWidth = canvasResizeStartData.width + deltaX;
                       newHeight = canvasResizeStartData.height + deltaY;
                       break;
               }

               // Prevent negative width/height (optional, but good practice)
               if (newWidth < RESIZE_HANDLE_SIZE) newWidth = RESIZE_HANDLE_SIZE;
               if (newHeight < RESIZE_HANDLE_SIZE) newHeight = RESIZE_HANDLE_SIZE;


               // Update the element's state
               setElements(prevElements =>
                   prevElements.map(element =>
                       element.id === currentElement.id ? { ...element, x: newX, y: newY, width: newWidth, height: newHeight } : element
                   ) as WhiteboardElement[] // Cast back to WhiteboardElement[]
               );

                // Update the starting data for the next mouse move event
                setCanvasResizeStartData({ x: newX, y: newY, width: newWidth, height: newHeight });


           } else { // Dragging the shape itself (not resizing)
               const newX = x - canvasDragStartOffset.x;
               const newY = y - canvasDragStartOffset.y;

               setElements(prevElements =>
                   prevElements.map(element =>
                       element.id === currentElement.id ? { ...element, x: newX, y: newY } : element
                   ) as WhiteboardElement[] // Cast back to WhiteboardElement[]
               );

                // Update the draggingCanvasElement state to reflect the new position (for the next move event)
                 setDraggingCanvasElement(prevElement => {
                    if (!prevElement || prevElement.type === 'path') return null;
                     return {
                        ...prevElement,
                        x: newX,
                        y: newY,
                     } as ShapeElement;
                });
           }
      }
  };

  // Handle mouse up to stop dragging/resizing
  const handleCanvasMouseUp = () => {
      if (draggingElementId) {
          setDraggingElementId(null);
          setDraggingElementType(null);
          setDragStartOffset(null);
          // History save will be triggered by the useEffect
      }
      if (isResizingHtmlElement) {
          setIsResizingHtmlElement(false);
          setResizingHtmlElementId(null);
          setResizingHtmlElementType(null);
          setHtmlResizeHandle(null);
          setHtmlResizeStartData(null);
           // History save will be triggered by the useEffect
      }
      if (draggingCanvasElement) { // This covers both dragging and resizing of canvas elements
          setDraggingCanvasElement(null);
          setCanvasDragStartOffset(null);
          setIsResizingCanvasElement(false);
          setCanvasResizeHandle(null);
          setCanvasResizeStartData(null);
           // History save will be triggered by the useEffect
      }
  };


  // Function to update sticky note text
  const updateStickyNoteText = (id: string, newText: string) => {
    setStickyNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, text: newText } : note
      )
    );
     // History save will be triggered by the useEffect
  };

   // Function to update sticky note text color
  const updateStickyNoteTextColor = (id: string, newColor: string) => {
    setStickyNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, textColor: newColor } : note
      )
    );
     // History save will be triggered by the useEffect
  };

   // Function to update sticky note background color
  const updateStickyNoteBgColor = (id: string, newColor: string) => {
    setStickyNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, bgColor: newColor } : note
      )
    );
     // History save will be triggered by the useEffect
  };


  // Function to delete a sticky note
  const deleteStickyNote = (id: string) => {
    setStickyNotes(prevNotes => prevNotes.filter(note => note.id !== id));
     // History save will be triggered by the useEffect
  };

   // Function to update text element text
  const updateTextElementText = (id: string, newText: string) => {
    setTextElements(prevTexts =>
      prevTexts.map(text =>
        text.id === id ? { ...text, text: newText } : text
      )
    );
     // History save will be triggered by the useEffect
  };

  // Function to delete a text element
  const deleteTextElement = (id: string) => {
    setTextElements(prevTexts => prevTexts.filter(text => text.id !== id));
     // History save will be triggered by the useEffect
  };

   // Function to toggle text element editing mode
   const toggleTextElementEditing = (id: string, isEditing: boolean) => {
       setTextElements(prevTexts =>
           prevTexts.map(text =>
               text.id === id ? { ...text, isEditing: isEditing } : { ...text, isEditing: false } // Deactivate others
           )
       );
       // History save will be triggered by the useEffect
   };

   // Ref for the currently active text input element to manage focus
   const textInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

   // Effect to focus the text input when a text element enters editing mode
   useEffect(() => {
       const editingTextElement = textElements.find(text => text.isEditing);
       if (editingTextElement && textInputRefs.current[editingTextElement.id]) {
           // Use a small timeout to ensure the input is rendered before focusing
           const timer = setTimeout(() => {
               textInputRefs.current[editingTextElement.id]?.focus();
           }, 0);
           return () => clearTimeout(timer); // Cleanup timer
       }
   }, [textElements]); // Re-run when textElements state changes


  return (
    <div className="flex h-screen bg-purple-900 font-sans">
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
      />
      <main
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
        // Attach mouse handlers to the container for all interactions
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp} // Stop interaction if mouse leaves container
      >
        {/* The Canvas component - z-index 10 to be below HTML elements */}
        <Canvas
          key={canvasKey} // Key is less critical now but can help with full resets
          ref={null} // Pass null for the canvas ref here, Canvas component manages its own ref
          width={canvasWidth > 0 ? canvasWidth : 100}
          height={canvasHeight > 0 ? canvasHeight : 100}
          strokeColor={strokeColor}
          lineWidth={lineWidth}
          tool={tool}
          selectedShapeType={selectedShapeType}
          elements={elements} // Pass elements as a prop
          onElementComplete={handleElementComplete}
          selectedElementId={selectedCanvasElementId} // Pass the selected canvas element ID
        />

        {/* Render Sticky Notes as HTML elements - z-index 20 */}
        {stickyNotes.map(note => (
          <div
            key={note.id}
            data-element-id={note.id} // Use generic data attribute
            className={`sticky-note absolute p-3 rounded-md shadow-lg border border-gray-300 ${draggingElementId === note.id || resizingHtmlElementId === note.id ? 'cursor-grabbing' : (tool === 'stickyNote' ? 'cursor-grab' : 'cursor-default')}`} // Update cursor based on tool and interaction
            style={{
              left: note.x,
              top: note.y,
              width: note.width,
              height: note.height,
              backgroundColor: note.bgColor,
              color: note.textColor,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              zIndex: draggingElementId === note.id || resizingHtmlElementId === note.id ? 100 : 20, // Bring dragged/resized note to front
            }}
             // Prevent canvas drawing when interacting with sticky note
            onMouseDown={(e) => {
                // Allow drag/resize to start on the note div or handles
                if (tool === 'stickyNote') {
                     // Dragging/Resizing logic is handled by the parent's onMouseDown
                } else {
                    // If not in sticky note tool, prevent propagation to canvas
                    e.stopPropagation();
                }
            }}
          >
            <textarea
              className="w-full h-full bg-transparent resize-none outline-none text-base" // Increased font size here
              value={note.text}
              onChange={(e) => updateStickyNoteText(note.id, e.target.value)}
              // Prevent canvas drawing when interacting with textarea
              onMouseDown={(e) => e.stopPropagation()}
            />
            {/* Sticky Note Controls (Color Pickers, Delete) */}
            <div className="absolute bottom-1 right-1 flex space-x-1">
                 {/* Text Color Picker */}
                 <input
                     type="color"
                     value={note.textColor}
                     onChange={(e) => updateStickyNoteTextColor(note.id, e.target.value)}
                     className="w-6 h-6 p-0 border-none rounded-full cursor-pointer"
                     title="Text Color"
                     onMouseDown={(e) => e.stopPropagation()} // Prevent canvas interaction
                 />
                  {/* Background Color Picker */}
                 <input
                     type="color"
                     value={note.bgColor}
                     onChange={(e) => updateStickyNoteBgColor(note.id, e.target.value)}
                     className="w-6 h-6 p-0 border-none rounded-full cursor-pointer"
                     title="Background Color"
                     onMouseDown={(e) => e.stopPropagation()} // Prevent canvas interaction
                 />
            </div>
            <button
              onClick={() => deleteStickyNote(note.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
              title="Delete Note"
              onMouseDown={(e) => e.stopPropagation()} // Prevent canvas interaction
            >
              X
            </button>

             {/* Sticky Note Resize Handles */}
             {tool === 'stickyNote' && ( // Only show handles when sticky note tool is active
                 <>
                     <div className="sticky-note-handle absolute w-2 h-2 bg-cyan-400 border border-black" style={{ top: -4, left: -4, cursor: 'nwse-resize' }} data-handle="tl" onMouseDown={e => e.stopPropagation()}></div>
                     <div className="sticky-note-handle absolute w-2 h-2 bg-cyan-400 border border-black" style={{ top: -4, right: -4, cursor: 'nesw-resize' }} data-handle="tr" onMouseDown={e => e.stopPropagation()}></div>
                     <div className="sticky-note-handle absolute w-2 h-2 bg-cyan-400 border border-black" style={{ bottom: -4, left: -4, cursor: 'nesw-resize' }} data-handle="bl" onMouseDown={e => e.stopPropagation()}></div>
                     <div className="sticky-note-handle absolute w-2 h-2 bg-cyan-400 border border-black" style={{ bottom: -4, right: -4, cursor: 'nwse-resize' }} data-handle="br" onMouseDown={e => e.stopPropagation()}></div>
                 </>
             )}
          </div>
        ))}

        {/* Render Text Elements as HTML elements - z-index 30 */}
        {textElements.map(textElement => (
            <div
                key={textElement.id}
                data-element-id={textElement.id} // Use generic data attribute
                className={`text-element absolute ${draggingElementId === textElement.id || resizingHtmlElementId === textElement.id ? 'cursor-grabbing' : (tool === 'text' ? 'cursor-grab' : 'cursor-default')}`} // Update cursor based on tool and interaction
                 style={{
                    left: textElement.x,
                    top: textElement.y,
                    color: textElement.color,
                    fontSize: `${textElement.fontSize}px`,
                    zIndex: draggingElementId === textElement.id || resizingHtmlElementId === textElement.id ? 100 : 30, // Bring dragged/resized text to front, higher than sticky notes
                 }}
                 onMouseDown={(e) => {
                     // Allow drag/resize to start on the text div or handles
                     if (tool === 'text') {
                          // Dragging/Resizing logic is handled by the parent's onMouseDown
                     } else {
                         // If not in text tool, prevent propagation to canvas
                         e.stopPropagation();
                     }
                 }}
            >
                {textElement.isEditing ? (
                    <input
                        ref={el => { if (el) textInputRefs.current[textElement.id] = el; }} // Assign ref
                        type="text"
                        value={textElement.text}
                        onChange={(e) => updateTextElementText(textElement.id, e.target.value)}
                        onBlur={() => toggleTextElementEditing(textElement.id, false)} // Stop editing on blur
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                toggleTextElementEditing(textElement.id, false); // Stop editing on Enter
                            }
                        }}
                        className="bg-transparent outline-none border-b border-purple-500 text-inherit" // Style the input
                        style={{ color: textElement.color, fontSize: `${textElement.fontSize}px` }}
                        onMouseDown={(e) => e.stopPropagation()} // Prevent canvas interaction
                    />
                ) : (
                    <span
                         onDoubleClick={() => toggleTextElementEditing(textElement.id, true)} // Enable editing on double click
                         className="p-1 inline-block" // Add padding and make it inline-block for better click target
                    >
                        {textElement.text || 'Double click to edit'} {/* Show placeholder if text is empty */}
                    </span>
                )}
                 {/* Delete Button for Text Element */}
                 {!textElement.isEditing && ( // Only show delete button when not editing
                     <button
                       onClick={() => deleteTextElement(textElement.id)}
                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
                       title="Delete Text"
                       onMouseDown={(e) => e.stopPropagation()} // Prevent canvas interaction
                     >
                       X
                     </button>
                 )}
                  {/* Text Element Resize Handles (Optional - Resizing text via handles is complex, but handles can be shown) */}
                  {/* If you wanted to implement text resizing via handles, you'd add similar handle divs here */}
            </div>
        ))}
      </main>
    </div>
  );
};

export default WhiteboardPage;
