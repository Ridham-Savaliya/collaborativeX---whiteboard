
import React, { useRef, useEffect, useState, useCallback } from 'react';
import CanvasToolbar from './CanvasToolbar';

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
  type: 'rectangle' | 'circle' | 'line' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'heart';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
}

interface StickyNoteElement {
  id: string;
  type: 'stickyNote';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
  textColor: string;
  bgColor?: string;
}

type WhiteboardElement = PathElement | ShapeElement | StickyNoteElement;

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'stickyNote'>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [notification, setNotification] = useState<{message: string, visible: boolean}>({
    message: '',
    visible: false
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [isResizingNote, setIsResizingNote] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAddingStickyNote, setIsAddingStickyNote] = useState(false);
  const [stickyNoteColors] = useState([
    '#FEF7CD', // Soft Yellow
    '#F2FCE2', // Soft Green
    '#E5DEFF', // Soft Purple
    '#FFDEE2', // Soft Pink
    '#FDE1D3', // Soft Peach
    '#D3E4FD', // Soft Blue
  ]);
  
  // Show notification helper
  const showNotification = (message: string) => {
    setNotification({ message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Initialize canvas with proper dimensions
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up canvas context
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      setContext(ctx);
    }
  }, [strokeColor, lineWidth, canvasDimensions]);
  
  // Handle canvas resize
  useEffect(() => {
    if (!canvasRef.current || !context) return;
    
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvasDimensions.width * dpr;
    canvas.height = canvasDimensions.height * dpr;
    canvas.style.width = `${canvasDimensions.width}px`;
    canvas.style.height = `${canvasDimensions.height}px`;
    
    context.scale(dpr, dpr);
    
    // Redraw elements after resize
    redrawCanvas();
  }, [canvasDimensions]);
  
  // Generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    // Don't handle mouse down if we're clicking on a sticky note
    if (isOverStickyNote(e)) {
      return;
    }
    
    // Handle adding sticky notes
    if (isAddingStickyNote) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const randomColorIndex = Math.floor(Math.random() * stickyNoteColors.length);
      const newNote: StickyNoteElement = {
        id: generateId(),
        type: 'stickyNote',
        x,
        y,
        width: 200,
        height: 150,
        color: stickyNoteColors[randomColorIndex],
        text: '',
        textColor: '#000000'
      };
      
      const newElements = [...elements, newNote];
      setElements(newElements);
      setActiveNoteId(newNote.id);
      setEditingNoteId(newNote.id);
      
      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, elements]);
      setHistoryIndex(historyIndex + 1);
      
      // Stop adding sticky notes
      setIsAddingStickyNote(false);
      setTool('pen');
      return;
    }
    
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      const newElement: PathElement = {
        id: generateId(),
        type: 'path',
        points: [{ x, y }],
        color: tool === 'eraser' ? '#FFFFFF' : 
               tool === 'highlighter' ? 'rgba(255, 255, 0, 0.5)' : strokeColor,
        width: tool === 'highlighter' ? 15 : lineWidth,
        tool
      };
      setCurrentElement(newElement);
    }
  };

  // Continue drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    // Handle dragging sticky notes
    if (isDraggingNote && activeNoteId) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      const updatedElements = elements.map(el => {
        if (el.id === activeNoteId && 'x' in el) {
          return { ...el, x, y };
        }
        return el;
      });
      
      setElements(updatedElements);
      return;
    }
    
    // Handle resizing sticky notes
    if (isResizingNote && activeNoteId && resizeDirection) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const activeNote = elements.find(el => el.id === activeNoteId) as StickyNoteElement;
      if (!activeNote) return;
      
      const updatedElements = elements.map(el => {
        if (el.id === activeNoteId && el.type === 'stickyNote') {
          const note = el as StickyNoteElement;
          let newWidth = note.width;
          let newHeight = note.height;
          let newX = note.x;
          let newY = note.y;
          
          // Min dimensions
          const MIN_WIDTH = 100;
          const MIN_HEIGHT = 100;
          
          switch (resizeDirection) {
            case 'se': // bottom-right
              newWidth = Math.max(MIN_WIDTH, mouseX - note.x);
              newHeight = Math.max(MIN_HEIGHT, mouseY - note.y);
              break;
            case 'sw': // bottom-left
              newWidth = Math.max(MIN_WIDTH, note.x + note.width - mouseX);
              newHeight = Math.max(MIN_HEIGHT, mouseY - note.y);
              newX = mouseX;
              break;
            case 'ne': // top-right
              newWidth = Math.max(MIN_WIDTH, mouseX - note.x);
              newHeight = Math.max(MIN_HEIGHT, note.y + note.height - mouseY);
              newY = mouseY;
              break;
            case 'nw': // top-left
              newWidth = Math.max(MIN_WIDTH, note.x + note.width - mouseX);
              newHeight = Math.max(MIN_HEIGHT, note.y + note.height - mouseY);
              newX = mouseX;
              newY = mouseY;
              break;
          }
          
          // If we're resizing from left or top, we need to adjust the position
          if (resizeDirection === 'sw' || resizeDirection === 'nw') {
            if (newX + newWidth > note.x + note.width) {
              newX = note.x + note.width - newWidth;
            }
          }
          
          if (resizeDirection === 'nw' || resizeDirection === 'ne') {
            if (newY + newHeight > note.y + note.height) {
              newY = note.y + note.height - newHeight;
            }
          }
          
          return { 
            ...note, 
            width: newWidth, 
            height: newHeight,
            x: newX,
            y: newY
          };
        }
        return el;
      });
      
      setElements(updatedElements);
      return;
    }
    
    if (!isDrawing || !currentElement) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if ('points' in currentElement) {
      const updatedElement = {
        ...currentElement,
        points: [...currentElement.points, { x, y }]
      };
      setCurrentElement(updatedElement);
      
      // Draw current stroke
      drawElement(updatedElement);
    }
  };

  // End drawing
  const handleMouseUp = () => {
    // Handle end of sticky note dragging or resizing
    if (isDraggingNote || isResizingNote) {
      setIsDraggingNote(false);
      setIsResizingNote(false);
      setResizeDirection(null);
      
      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, elements]);
      setHistoryIndex(historyIndex + 1);
      return;
    }
    
    if (!isDrawing || !currentElement) return;
    
    setIsDrawing(false);
    
    // Add to history
    const newElements = [...elements, currentElement];
    setElements(newElements);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, elements]);
    setHistoryIndex(historyIndex + 1);
    
    setCurrentElement(null);
    
    redrawCanvas();
  };

  // Draw single element
  const drawElement = (element: WhiteboardElement) => {
    if (!context) return;

    if ('points' in element && element.points.length > 1) {
      context.beginPath();
      context.moveTo(element.points[0].x, element.points[0].y);
      
      // Set styles based on tool type
      context.strokeStyle = element.color;
      context.lineWidth = element.width;
      
      if (element.tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
      } else if (element.tool === 'highlighter') {
        context.globalCompositeOperation = 'multiply';
      } else {
        context.globalCompositeOperation = 'source-over';
      }
      
      // Draw path
      for (let i = 1; i < element.points.length; i++) {
        context.lineTo(element.points[i].x, element.points[i].y);
      }
      context.stroke();
      
      // Reset composite operation
      context.globalCompositeOperation = 'source-over';
    }
  };

  // Check if mouse position is over a sticky note
  const isOverStickyNote = (e: React.MouseEvent<HTMLDivElement | HTMLCanvasElement>) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (const el of elements) {
      if (el.type === 'stickyNote') {
        const stickyNote = el as StickyNoteElement;
        if (
          x >= stickyNote.x && 
          x <= stickyNote.x + stickyNote.width && 
          y >= stickyNote.y && 
          y <= stickyNote.y + stickyNote.height
        ) {
          return stickyNote.id;
        }
      }
    }
    
    return null;
  };

  // Handle start of resizing sticky note
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, noteId: string, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    setActiveNoteId(noteId);
    setIsResizingNote(true);
    setResizeDirection(direction);
    
    // Prevent text editing during resize
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }
  };

  // Handle clicking on sticky note
  const handleStickyNoteMouseDown = (e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    e.stopPropagation();
    
    setActiveNoteId(noteId);
    
    // Get the current position of the note
    const note = elements.find(el => el.id === noteId) as StickyNoteElement;
    if (!note) return;
    
    // Calculate offset between mouse position and note position
    const rect = containerRef.current!.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - note.x;
    const offsetY = e.clientY - rect.top - note.y;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDraggingNote(true);
  };
  
  // Handle double click on sticky note
  const handleStickyNoteDoubleClick = (e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    e.stopPropagation();
    setEditingNoteId(noteId);
  };
  
  // Handle text change in sticky note
  const handleStickyNoteTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, noteId: string) => {
    const updatedElements = elements.map(el => {
      if (el.id === noteId && el.type === 'stickyNote') {
        return { ...el, text: e.target.value };
      }
      return el;
    });
    
    setElements(updatedElements);
  };
  
  // Change text color in sticky note
  const handleStickyNoteTextColorChange = (noteId: string, color: string) => {
    const updatedElements = elements.map(el => {
      if (el.id === noteId && el.type === 'stickyNote') {
        return { ...el, textColor: color };
      }
      return el;
    });
    
    setElements(updatedElements);
  };
  
  // Handle close button on sticky note
  const handleCloseNote = (e: React.MouseEvent<HTMLButtonElement>, noteId: string) => {
    e.stopPropagation();
    
    // Remove note from elements
    const updatedElements = elements.filter(el => el.id !== noteId);
    setElements(updatedElements);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, updatedElements]);
    setHistoryIndex(historyIndex + 1);
    
    // Reset active and editing note IDs if necessary
    if (activeNoteId === noteId) setActiveNoteId(null);
    if (editingNoteId === noteId) setEditingNoteId(null);
  };
  
  // Handle finishing editing
  const handleFinishEditing = () => {
    setEditingNoteId(null);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, elements]);
    setHistoryIndex(historyIndex + 1);
  };

  // Redraw the entire canvas
  const redrawCanvas = useCallback(() => {
    if (!context || !canvasRef.current) return;
    
    const dpr = window.devicePixelRatio || 1;
    context.clearRect(0, 0, canvasRef.current.width / dpr, canvasRef.current.height / dpr);
    
    // First draw non-highlighter elements
    elements
      .filter(element => !('tool' in element) || element.tool !== 'highlighter')
      .filter(element => element.type !== 'stickyNote')
      .forEach(element => drawElement(element));
    
    // Then draw highlighter elements on top
    elements
      .filter(element => 'tool' in element && element.tool === 'highlighter')
      .forEach(element => drawElement(element));
    
    // Note: StickyNotes are rendered as HTML elements, not on canvas
  }, [context, elements]);
  
  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex] || []);
    } else {
      setElements([]);
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };
  
  // Handle tool selection
  const handleToolSelect = (selectedTool: string) => {
    switch (selectedTool) {
      case 'stickyNote':
        setIsAddingStickyNote(true);
        setTool('stickyNote');
        break;
      case 'voice':
        showNotification('Voice to Draw feature activated (simulation)');
        break;
      case 'shapeRecognize':
        showNotification('Shape Recognition activated (simulation)');
        break;
      case 'videoCall':
        showNotification('Video Call feature initiated (simulation)');
        break;
      case 'templates':
        showNotification('Templates gallery opened (simulation)');
        break;
      case 'settings':
        showNotification('Settings panel opened (simulation)');
        break;
      default:
        if (['pen', 'eraser', 'highlighter'].includes(selectedTool)) {
          setTool(selectedTool as 'pen' | 'eraser' | 'highlighter');
        }
    }
  };
  
  // Handle export
  const handleExport = (type: 'png' | 'pdf') => {
    showNotification(`Exporting as ${type.toUpperCase()} (simulation)`);
    setTimeout(() => {
      showNotification(`${type.toUpperCase()} exported successfully!`);
    }, 1500);
  };

  // Update canvas when elements change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, elements]);

  const textColorOptions = [
    '#000000', // Black
    '#FF0000', // Red
    '#0000FF', // Blue
    '#008000', // Green
    '#800080', // Purple
    '#FFA500'  // Orange
  ];

  // Add sticky note from external component (like the sidebar)
  const addStickyNote = (note: StickyNoteElement) => {
    const newElements = [...elements, note];
    setElements(newElements);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, elements]);
    setHistoryIndex(historyIndex + 1);
    
    setActiveNoteId(note.id);
    setEditingNoteId(note.id);
  };

  return (
    <div className="relative h-screen w-full bg-gray-50 overflow-hidden select-none" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className={`touch-none ${isAddingStickyNote ? 'cursor-cell' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Sticky Notes Layer */}
      {elements.filter(el => el.type === 'stickyNote').map((note) => {
        const stickyNote = note as StickyNoteElement;
        const isActive = activeNoteId === stickyNote.id;
        
        return (
          <div
            key={stickyNote.id}
            className={`absolute shadow-md rounded-md overflow-visible ${isActive ? 'z-20' : 'z-10'}`}
            style={{
              left: `${stickyNote.x}px`,
              top: `${stickyNote.y}px`,
              width: `${stickyNote.width}px`,
              height: `${stickyNote.height}px`,
              backgroundColor: stickyNote.color || stickyNote.bgColor,
            }}
          >
            {/* Main sticky note content */}
            <div 
              className={`h-full w-full rounded-md flex flex-col ${isActive ? 'ring-2 ring-offset-1 ring-purple-500' : ''}`}
              onMouseDown={(e) => handleStickyNoteMouseDown(e, stickyNote.id)}
              onDoubleClick={(e) => handleStickyNoteDoubleClick(e, stickyNote.id)}
            >
              <div className="p-2 h-full flex flex-col">
                <div className="flex justify-end mb-1">
                  <button
                    className="hover:bg-black/10 rounded-full p-1"
                    onClick={(e) => handleCloseNote(e, stickyNote.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                {editingNoteId === stickyNote.id ? (
                  <>
                    <textarea
                      className="flex-1 bg-transparent border-none resize-none focus:outline-none p-1"
                      style={{ color: stickyNote.textColor }}
                      value={stickyNote.text}
                      onChange={(e) => handleStickyNoteTextChange(e, stickyNote.id)}
                      autoFocus
                      onBlur={handleFinishEditing}
                      onFocus={(e) => {
                        // Clear default text if it's the first time focusing
                        if (stickyNote.text === 'Double-click to edit') {
                          handleStickyNoteTextChange({
                            target: { value: '' }
                          } as React.ChangeEvent<HTMLTextAreaElement>, stickyNote.id);
                        }
                        // Select all text
                        e.target.select();
                      }}
                      placeholder="Enter text here"
                    />
                    
                    {/* Text color options */}
                    <div className="flex justify-center gap-1 mt-2 p-1 bg-white/50 rounded-md">
                      {textColorOptions.map(color => (
                        <button
                          key={color}
                          className={`w-5 h-5 rounded-full border ${stickyNote.textColor === color ? 'ring-2 ring-offset-1 ring-gray-500' : 'border-gray-300'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleStickyNoteTextColorChange(stickyNote.id, color)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div 
                    className="flex-1 p-1 overflow-auto cursor-move"
                    style={{ color: stickyNote.textColor }}
                  >
                    {stickyNote.text ? stickyNote.text : 'Double-click to edit'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Resize handles - only show when active */}
            {isActive && (
              <>
                {/* SE corner */}
                <div 
                  className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full transform translate-x-1/2 translate-y-1/2 cursor-se-resize z-30"
                  onMouseDown={(e) => handleResizeStart(e, stickyNote.id, 'se')}
                />
                
                {/* SW corner */}
                <div 
                  className="absolute bottom-0 left-0 w-4 h-4 bg-purple-500 rounded-full transform -translate-x-1/2 translate-y-1/2 cursor-sw-resize z-30"
                  onMouseDown={(e) => handleResizeStart(e, stickyNote.id, 'sw')}
                />
                
                {/* NE corner */}
                <div 
                  className="absolute top-0 right-0 w-4 h-4 bg-purple-500 rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-ne-resize z-30"
                  onMouseDown={(e) => handleResizeStart(e, stickyNote.id, 'ne')}
                />
                
                {/* NW corner */}
                <div 
                  className="absolute top-0 left-0 w-4 h-4 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-nw-resize z-30"
                  onMouseDown={(e) => handleResizeStart(e, stickyNote.id, 'nw')}
                />
              </>
            )}
          </div>
        );
      })}
      
      {notification.visible && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium z-50 animate-fade-in">
          {notification.message}
        </div>
      )}
      
      <CanvasToolbar
        onToolSelect={handleToolSelect}
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Canvas;
