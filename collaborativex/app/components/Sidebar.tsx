'use client';

import React, { useState } from 'react';

interface SidebarProps {
  setColor: (color: string) => void;
  setLineWidth: (width: number) => void;
  setTool: (tool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text') => void;
  currentColor: string;
  currentLineWidth: number;
  currentTool: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text';
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
}

const availableShapes = [
  { type: 'rectangle', label: 'Rectangle' },
  { type: 'circle', label: 'Circle' },
  { type: 'line', label: 'Line' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'diamond', label: 'Diamond' },
  { type: 'star', label: 'Star' },
  { type: 'arrow', label: 'Arrow' },
  { type: 'heart', label: 'Heart' },
  { type: 'pentagon', label: 'Pentagon' },
  { type: 'hexagon', label: 'Hexagon' },
  { type: 'heptagon', label: 'Heptagon' },
  { type: 'octagon', label: 'Octagon' },
  { type: 'cross', label: 'Cross' },
  { type: 'smiley', label: 'Smiley' },
  { type: 'cloud', label: 'Cloud' },
] as const;

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
}) => {
  const commonButtonClass =
    'w-full p-3 mb-3 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out';
  const activeToolClass = 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500';
  const inactiveToolClass = 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
  const disabledButtonClass = 'bg-gray-400 cursor-not-allowed';
  const tooltipContainerClass = 'relative flex items-center group';
  const tooltipClass =
    'absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20';

  const [showAllShapes, setShowAllShapes] = useState(false);
  const initialShapesCount = 6;

  const handleShapeSelect = (
    shape:
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
  ) => {
    setTool('shape');
    setShapeType(shape);
    setShowShapesDrawer(false);
  };

  return (
    <div className="w-64 bg-gray-800 p-6 space-y-6 rounded-lg shadow-xl h-full flex flex-col relative text-purple-100">
      <div>
        <h3 className="text-xl font-semibold text-purple-200 mb-4">Tools</h3>
        <div className={tooltipContainerClass}>
          <button
            onClick={() => {
              setTool('pen');
              setShowShapesDrawer(false);
              setShapeType(null);
            }}
            className={`${commonButtonClass} ${currentTool === 'pen' ? activeToolClass : inactiveToolClass}`}
            aria-pressed={currentTool === 'pen'}
          >
            Pen
          </button>
          <span className={tooltipClass}>Draw freehand lines</span>
        </div>
        <div className={tooltipContainerClass}>
          <button
            onClick={() => {
              setTool('eraser');
              setShowShapesDrawer(false);
              setShapeType(null);
            }}
            className={`${commonButtonClass} ${currentTool === 'eraser' ? activeToolClass : inactiveToolClass}`}
            aria-pressed={currentTool === 'eraser'}
          >
            Eraser
          </button>
          <span className={tooltipClass}>Erase drawings</span>
        </div>
        <div className={tooltipContainerClass}>
          <button
            onClick={() => {
              setTool('highlighter');
              setShowShapesDrawer(false);
              setShapeType(null);
            }}
            className={`${commonButtonClass} ${currentTool === 'highlighter' ? activeToolClass : inactiveToolClass}`}
            aria-pressed={currentTool === 'highlighter'}
          >
            Highlighter
          </button>
          <span className={tooltipClass}>Draw translucent lines</span>
        </div>
        <div className={tooltipContainerClass}>
          <button
            onClick={() => {
              setTool('shape');
              setShowShapesDrawer(true);
            }}
            className={`${commonButtonClass} ${currentTool === 'shape' ? activeToolClass : inactiveToolClass}`}
            aria-pressed={currentTool === 'shape'}
          >
            Shapes
          </button>
          <span className={tooltipClass}>Draw geometric shapes</span>
        </div>
        <div className={tooltipContainerClass}>
          <button
            onClick={() => {
              setTool('stickyNote');
              setShowShapesDrawer(false);
              setShapeType(null);
            }}
            className={`${commonButtonClass} ${currentTool === 'stickyNote' ? activeToolClass : inactiveToolClass}`}
            aria-pressed={currentTool === 'stickyNote'}
          >
            Sticky Note
          </button>
          <span className={tooltipClass}>Add a sticky note (draggable)</span>
        </div>
        <div className={tooltipContainerClass}>
          <button
            onClick={() => {
              setTool('text');
              setShowShapesDrawer(false);
              setShapeType(null);
            }}
            className={`${commonButtonClass} ${currentTool === 'text' ? activeToolClass : inactiveToolClass}`}
            aria-pressed={currentTool === 'text'}
          >
            Text
          </button>
          <span className={tooltipClass}>Add editable text</span>
        </div>
      </div>

      {showShapesDrawer && (
        <div className="absolute left-full top-0 mt-0 ml-4 bg-gray-700 p-4 rounded-lg shadow-lg z-10 w-48">
          <h4 className="text-md font-semibold text-purple-200 mb-3">Choose Shape</h4>
          <div className="grid grid-cols-3 gap-2">
            {availableShapes
              .slice(0, showAllShapes ? availableShapes.length : initialShapesCount)
              .map((shape) => (
                <button
                  key={shape.type}
                  onClick={() => handleShapeSelect(shape.type)}
                  className={`p-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out ${
                    currentShapeType === shape.type ? activeToolClass : inactiveToolClass
                  }`}
                  title={shape.label}
                >
                  {shape.label.charAt(0)}
                </button>
              ))}
          </div>
          {availableShapes.length > initialShapesCount && (
            <button
              onClick={() => setShowAllShapes(!showAllShapes)}
              className="w-full mt-3 p-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              {showAllShapes ? 'Show Less' : 'Show More'}
            </button>
          )}
          <button
            onClick={() => setShowShapesDrawer(false)}
            className="w-full mt-3 p-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Close Drawer
          </button>
        </div>
      )}

      <div>
        <label htmlFor="colorPicker" className="block text-sm font-medium text-purple-300 mb-1">
          Stroke Color
        </label>
        <input
          type="color"
          id="colorPicker"
          value={currentColor}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-10 p-1 border-gray-600 rounded-md cursor-pointer focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div>
        <label htmlFor="lineWidth" className="block text-sm font-medium text-purple-300 mb-1">
          Line Width ({currentLineWidth}px)
        </label>
        <input
          type="range"
          id="lineWidth"
          min="1"
          max="50"
          value={currentLineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      <div>
        <label htmlFor="textSize" className="block text-sm font-medium text-purple-300 mb-1">
          Text Size ({textFontSize}px)
        </label>
        <input
          type="range"
          id="textSize"
          min="10"
          max="60"
          value={textFontSize}
          onChange={(e) => setTextFontSize(parseInt(e.target.value, 10))}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-purple-200 mb-4">History</h3>
        <div className={tooltipContainerClass}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`${commonButtonClass} ${canUndo ? inactiveToolClass : disabledButtonClass}`}
          >
            Undo
          </button>
          <span className={tooltipClass}>Undo last action</span>
        </div>
        <div className={tooltipContainerClass}>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`${commonButtonClass} ${canRedo ? inactiveToolClass : disabledButtonClass}`}
          >
            Redo
          </button>
          <span className={tooltipClass}>Redo last undone action</span>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={clearCanvas}
          className="w-full p-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150 ease-in-out"
        >
          Clear Canvas
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
