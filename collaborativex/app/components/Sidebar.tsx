
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, Eraser, Highlighter, Square, StickyNote, Type, 
  ChevronLeft, ChevronRight, UndoIcon, RedoIcon, Trash2, 
  Circle, Triangle, Diamond, Star, ArrowRight, 
  Heart, Pentagon, Hexagon, Octagon, CrossIcon, SmilePlus, Cloud
} from 'lucide-react';

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

interface SidebarProps { 
  setColor: (color: string) => void;
  setLineWidth: (width: number) => void;
  setTool: (tool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null) => void;
  currentColor: string;
  currentLineWidth: number;
  currentTool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null;
  clearCanvas: () => void;
  setShowShapesDrawer: (show: boolean) => void;
  showShapesDrawer: boolean;
  setShapeType: (
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
      | 'cloud'
      | null
  ) => void;
  currentShapeType:
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
    | null;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  textFontSize: number;
  setTextFontSize: (size: number) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  addStickyNote: (note: StickyNote) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  setColor,
  setLineWidth,
  setTool,
  currentColor,
  currentLineWidth,
  currentTool,
  clearCanvas,
  setShowShapesDrawer,
  showShapesDrawer,
  setShapeType,
  currentShapeType,
  undo,
  redo,
  canUndo,
  canRedo,
  textFontSize,
  setTextFontSize,
  isCollapsed,
  setIsCollapsed,
  addStickyNote,
}) => {
  const [showToolsSection, setShowToolsSection] = useState(true);
  const [showStylesSection, setShowStylesSection] = useState(true);
  const [showHistorySection, setShowHistorySection] = useState(true);
  const [showAllShapes, setShowAllShapes] = useState(false);
  const [selectedColorPreset, setSelectedColorPreset] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isPlacingStickyNote, setIsPlacingStickyNote] = useState(false);
  const initialShapesCount = 6;
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const colorPresets = [
    { color: '#000000', name: 'Black' },
    { color: '#ffffff', name: 'White' },
    { color: '#ff0000', name: 'Red' },
    { color: '#00ff00', name: 'Green' },
    { color: '#0000ff', name: 'Blue' },
    { color: '#ffff00', name: 'Yellow' },
    { color: '#ff00ff', name: 'Magenta' },
    { color: '#00ffff', name: 'Cyan' },
    { color: '#9b87f5', name: 'Purple' },
  ];

  const availableShapes = [
    { type: 'rectangle', label: 'Rectangle', icon: <Square size={16} /> },
    { type: 'circle', label: 'Circle', icon: <Circle size={16} /> },
    { type: 'triangle', label: 'Triangle', icon: <Triangle size={16} /> },
    { type: 'diamond', label: 'Diamond', icon: <Diamond size={16} /> },
    { type: 'star', label: 'Star', icon: <Star size={16} /> },
    { type: 'arrow', label: 'Arrow', icon: <ArrowRight size={16} /> },
    { type: 'heart', label: 'Heart', icon: <Heart size={16} /> },
    { type: 'pentagon', label: 'Pentagon', icon: <Pentagon size={16} /> },
    { type: 'hexagon', label: 'Hexagon', icon: <Hexagon size={16} /> },
    { type: 'heptagon', label: 'Heptagon', icon: <Pentagon size={16} /> },
    { type: 'octagon', label: 'Octagon', icon: <Octagon size={16} /> },
    { type: 'cross', label: 'Cross', icon: <CrossIcon size={16} /> },
    { type: 'smiley', label: 'Smiley', icon: <SmilePlus size={16} /> },
    { type: 'cloud', label: 'Cloud', icon: <Cloud size={16} /> },
  ];

  const tools = [
    { key: 'pen', label: 'Pen', icon: <Pencil size={16} />, tooltip: 'Draw freehand lines' },
    { key: 'eraser', label: 'Eraser', icon: <Eraser size={16} />, tooltip: 'Erase drawings' },
    { key: 'highlighter', label: 'Highlighter', icon: <Highlighter size={16} />, tooltip: 'Draw translucent lines' },
    { key: 'shape', label: 'Shapes', icon: <Square size={16} />, tooltip: 'Draw geometric shapes' },
    { key: 'stickyNote', label: 'Sticky Note', icon: <StickyNote size={16} />, tooltip: 'Add a sticky note (draggable & resizable)' },
    { key: 'text', label: 'Text', icon: <Type size={16} />, tooltip: 'Add editable text' },
  ];

  const handleShapeSelect = (shape: Exclude<SidebarProps['currentShapeType'], null>) => {
    setTool('shape');
    setShapeType(shape);
    setShowShapesDrawer(false);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleColorPresetSelect = (color: string) => {
    setColor(color);
    setSelectedColorPreset(color);
  };

  const handleStickyNoteSelect = () => {
    setTool('stickyNote');
    setIsPlacingStickyNote(true);
    setShowShapesDrawer(false);
    setShapeType(null);
  };

  useEffect(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (window.innerWidth < 640 && !isCollapsed) {
        setIsCollapsed(true);
      }
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed, setIsCollapsed]);

  useEffect(() => {
    if (!isPlacingStickyNote || currentTool !== 'stickyNote') {
      return;
    }

    const handleCanvasClick = (e: MouseEvent) => {
      if (currentTool === 'stickyNote' && isPlacingStickyNote) {
        e.preventDefault();
        
        const id = `sticky-note-${Date.now()}`;
        const newNote: StickyNote = {
          id,
          type: 'stickyNote',
          x: e.clientX,
          y: e.clientY,
          width: 200,
          height: 150,
          text: '',
          textColor: '#e2e8f0',
          bgColor: '#972cf0',
        };
        
        addStickyNote(newNote);
        setIsPlacingStickyNote(false);
        setTool(null);
      }
    };

    document.addEventListener('click', handleCanvasClick);
    return () => {
      document.removeEventListener('click', handleCanvasClick);
    };
  }, [currentTool, isPlacingStickyNote, currentColor, addStickyNote, setTool]);

  return (
    <div className="fixed top-0 left-0 h-full z-10 overflow-hidden">
      <div 
        className={`
          h-full bg-gray-800/90 backdrop-blur-xl text-white
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-14' : 'w-64 sm:w-72'}
          flex flex-col rounded-r-xl shadow-2xl border-r border-purple-500/20
          translate-x-0
        `}
      >
        {isCollapsed ? (
          <div className="h-full px-2 py-5 flex flex-col items-center justify-start">
            <button
              onClick={handleToggleCollapse}
              className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-purple-500/30"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight size={18} className="text-white" />
            </button>

            <div className="flex flex-col space-y-3 items-center py-3">
              {tools.map((tool) => (
                <div 
                  key={tool.key} 
                  className="relative"
                  onMouseEnter={() => setActiveTooltip(tool.key)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <button
                    onClick={() => {
                      if (tool.key === 'stickyNote') {
                        handleStickyNoteSelect();
                      } else {
                        setTool(tool.key as any);
                        if (tool.key === 'shape') {
                          setIsCollapsed(false);
                        }
                      }
                    }}
                    className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                      currentTool === tool.key 
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/30' 
                        : 'bg-gray-700/90 hover:bg-gray-600 text-gray-200'
                    }`}
                    title={tool.tooltip}
                    aria-label={tool.label}
                  >
                    {tool.icon}
                  </button>
                  {activeTooltip === tool.key && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-black/90 backdrop-blur-sm text-xs font-medium rounded-md whitespace-nowrap z-20 transition-opacity duration-300">
                      {tool.label}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col space-y-3 items-center mt-3">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`p-2 rounded-full transition-all duration-300 ${
                  canUndo 
                    ? 'bg-gray-700/90 hover:bg-gray-600 text-gray-200 hover:scale-110' 
                    : 'bg-gray-800/60 text-gray-500 cursor-not-allowed opacity-50'
                }`}
                title="Undo"
                aria-label="Undo"
              >
                <UndoIcon size={16} />
              </button>
              
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`p-2 rounded-full transition-all duration-300 ${
                  canRedo 
                    ? 'bg-gray-700/90 hover:bg-gray-600 text-gray-200 hover:scale-110' 
                    : 'bg-gray-800/60 text-gray-500 cursor-not-allowed opacity-50'
                }`}
                title="Redo"
                aria-label="Redo"
              >
                <RedoIcon size={16} />
              </button>
              
              <button
                onClick={clearCanvas}
                className="p-2 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-red-500/30"
                title="Clear Canvas"
                aria-label="Clear Canvas"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full py-4 px-4 flex flex-col overflow-y-auto scrollbar-custom">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">Drawing Tools</h2>
              <button
                onClick={handleToggleCollapse}
                className="p-2 rounded-full bg-gray-700/90 hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className="mb-4 bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 shadow-inner border border-white/5">
              <div 
                className="flex items-center justify-between cursor-pointer mb-2" 
                onClick={() => setShowToolsSection(!showToolsSection)}
              >
                <h3 className="text-xs font-semibold text-purple-300 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm mr-1"></span>
                  Tools
                </h3>
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform duration-300 ${showToolsSection ? 'rotate-90' : ''}`} 
                />
              </div>
              
              {showToolsSection && (
                <div className="space-y-2 transition-all duration-300">
                  <div className="grid grid-cols-2 gap-2">
                    {tools.map((tool) => (
                      <div key={tool.key} className="group relative">
                        <button
                          onClick={() => {
                            if (tool.key === 'stickyNote') {
                              handleStickyNoteSelect();
                            } else {
                              setTool(tool.key as any);
                              if (tool.key === 'shape') {
                                setShowShapesDrawer(!showShapesDrawer);
                              } else {
                                setShowShapesDrawer(false);
                                setShapeType(null);
                              }
                            }
                          }}
                          className={`w-full py-2 px-2 text-xs font-medium rounded-lg flex items-center transition-all duration-300
                          ${currentTool === tool.key 
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-600/20' 
                            : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300'
                          }`}
                          aria-pressed={currentTool === tool.key}
                        >
                          <span className="mr-1">{tool.icon}</span>
                          <span>{tool.label}</span>
                        </button>
                        <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-max whitespace-nowrap px-2 py-1 bg-black/90 backdrop-blur-sm text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          {tool.tooltip}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {showShapesDrawer && (
              <div className="mb-4 bg-gray-700/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/5 space-y-2 animate-slide-down">
                <h4 className="text-xs font-semibold text-purple-300 flex items-center">
                  <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm mr-1"></span>
                  Shapes
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  {availableShapes
                    .slice(0, showAllShapes ? availableShapes.length : initialShapesCount)
                    .map((shape) => (
                      <button
                        key={shape.type as string}
                        onClick={() => handleShapeSelect(shape.type as any)}
                        className={`p-2 flex flex-col items-center justify-center rounded-lg transition-all duration-300
                          ${currentShapeType === shape.type 
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-600/20' 
                            : 'bg-gray-600/80 hover:bg-gray-500/80 text-gray-300'
                          }`}
                        title={shape.label}
                        aria-label={shape.label}
                      >
                        {shape.icon}
                      </button>
                    ))}
                </div>
                {availableShapes.length > initialShapesCount && (
                  <button
                    onClick={() => setShowAllShapes(!showAllShapes)}
                    className="w-full text-xs py-1 bg-gray-600/80 hover:bg-gray-500/80 rounded-lg transition-all duration-300 font-medium"
                  >
                    {showAllShapes ? 'Show Less' : 'Show All Shapes'}
                  </button>
                )}
              </div>
            )}

            <div className="mb-4 bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 shadow-inner border border-white/5">
              <div 
                className="flex items-center justify-between cursor-pointer mb-2" 
                onClick={() => setShowStylesSection(!showStylesSection)}
              >
                <h3 className="text-xs font-semibold text-purple-300 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm mr-1"></span>
                  Styles
                </h3>
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform duration-300 ${showStylesSection ? 'rotate-90' : ''}`} 
                />
              </div>
              
              {showStylesSection && (
                <div className="space-y-3 transition-all duration-300">
                  <div className="space-y-1">
                    <label className="text-xs text-purple-300 font-medium block">Stroke Color</label>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {colorPresets.map(preset => (
                        <button
                          key={preset.color}
                          onClick={() => handleColorPresetSelect(preset.color)}
                          className={`w-5 h-5 rounded-full transition-all duration-300 hover:scale-110 ${
                            selectedColorPreset === preset.color 
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800 shadow-lg' 
                              : ''
                          }`}
                          title={preset.name}
                          style={{ backgroundColor: preset.color }}
                        />
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => {
                          setColor(e.target.value);
                          setSelectedColorPreset(null);
                        }}
                        className="w-full h-8 rounded-lg cursor-pointer opacity-0 absolute inset-0 z-10"
                      />
                      <div className="flex justify-between items-center bg-gray-600/80 p-1 rounded-lg border border-white/5">
                        <div 
                          className="w-6 h-6 rounded-md border border-gray-500 shadow-inner"
                          style={{ backgroundColor: currentColor }}
                        ></div>
                        <div className="text-xs font-mono">{currentColor.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-purple-300 font-medium">Line Width</label>
                      <span className="text-xs bg-gray-600/80 px-1 py-0.5 rounded-md">{currentLineWidth}px</span>
                    </div>
                    <div className="relative h-7 flex items-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="h-1 w-full bg-gray-600/80 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" 
                            style={{ width: `${(currentLineWidth / 50) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={currentLineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        className="w-full h-7 absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div 
                        className="absolute rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-md shadow-purple-500/20 cursor-grab"
                        style={{ 
                          left: `calc(${(currentLineWidth / 50) * 100}% - ${6 + currentLineWidth / 15}px)`, 
                          width: `${12 + currentLineWidth / 5}px`, 
                          height: `${12 + currentLineWidth / 5}px` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Thin</span>
                      <span>Thick</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-purple-300 font-medium">Text Size</label>
                      <span className="text-xs bg-gray-600/80 px-1 py-0.5 rounded-md">{textFontSize}px</span>
                    </div>
                    <div className="relative h-7 flex items-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="h-1 w-full bg-gray-600/80 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" 
                            style={{ width: `${((textFontSize - 10) / 50) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(parseInt(e.target.value))}
                        className="w-full h-7 absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div 
                        className="absolute rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-md shadow-purple-500/20 cursor-grab"
                        style={{ 
                          left: `calc(${((textFontSize - 10) / 50) * 100}% - 6px)`, 
                          width: `12px`, 
                          height: `12px` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 shadow-inner border border-white/5">
              <div 
                className="flex items-center justify-between cursor-pointer mb-2" 
                onClick={() => setShowHistorySection(!showHistorySection)}
              >
                <h3 className="text-xs font-semibold text-purple-300 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm mr-1"></span>
                  History
                </h3>
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform duration-300 ${showHistorySection ? 'rotate-90' : ''}`} 
                />
              </div>
              
              {showHistorySection && (
                <div className="flex space-x-2 transition-all duration-300">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center transition-all duration-300
                      ${canUndo 
                        ? 'bg-gray-600/80 hover:bg-gray-500/80 text-white' 
                        : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                    aria-disabled={!canUndo}
                  >
                    <UndoIcon size={14} className="mr-1" />
                    Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center transition-all duration-300
                      ${canRedo 
                        ? 'bg-gray-600/80 hover:bg-gray-500/80 text-white' 
                        : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                    aria-disabled={!canRedo}
                  >
                    <RedoIcon size={14} className="mr-1" />
                    Redo
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={clearCanvas}
              className="mt-auto w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white transition-all duration-300 shadow-lg hover:shadow-red-500/25"
            >
              <Trash2 size={14} className="mr-1" />
              Clear Canvas
            </button>
          </div>
        )}

        <div 
          className={`absolute left-14 top-4 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md pointer-events-none transition-opacity duration-300 ${currentTool && isCollapsed ? 'opacity-100' : 'opacity-0'}`}
        >
          {tools.find(t => t.key === currentTool)?.label}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: #9333ea rgba(255, 255, 255, 0.05);
        }
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9333ea, #c084fc);
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #a855f7, #d8b4fe);
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-in-out;
        }
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
