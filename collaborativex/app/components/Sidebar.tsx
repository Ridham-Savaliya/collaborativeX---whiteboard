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

const availableShapes: { type: Exclude<SidebarProps['currentShapeType'], null>; label: string }[] = [
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
];

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

  const handleShapeSelect = (shape: Exclude<SidebarProps['currentShapeType'], null>) => {
    setTool('shape');
    setShapeType(shape);
    setShowShapesDrawer(false);
  };

  return (
   <div className="w-48 bg-gray-900  p-4 space-y-2 rounded-lg shadow-xl  flex flex-col text-purple-100">
  {/* Tools */}
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-purple-300">Tools</h3>
    {[
      { label: 'Pen', key: 'pen', tooltip: 'Draw freehand lines' },
      { label: 'Eraser', key: 'eraser', tooltip: 'Erase drawings' },
      { label: 'Highlighter', key: 'highlighter', tooltip: 'Draw translucent lines' },
      { label: 'Shapes', key: 'shape', tooltip: 'Draw geometric shapes' },
      { label: 'Sticky Note', key: 'stickyNote', tooltip: 'Add a sticky note (draggable)' },
      { label: 'Text', key: 'text', tooltip: 'Add editable text' },
    ].map((tool) => (
      <div key={tool.key} className="group relative">
        <button
          onClick={() => {
            setTool(tool.key);
            setShowShapesDrawer(tool.key === 'shape');
            if (tool.key !== 'shape') setShapeType(null);
          }}
          className={`${commonButtonClass} w-full py-2 text-sm ${
            currentTool === tool.key ? activeToolClass : inactiveToolClass
          }`}
          aria-pressed={currentTool === tool.key}
        >
          {tool.label}
        </button>
        <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-max whitespace-nowrap px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition">
          {tool.tooltip}
        </span>
      </div>
    ))}
  </div>

  {/* Shapes Drawer */}
  {showShapesDrawer && (
    <div className="bg-gray-800 p-3 rounded shadow-lg space-y-2 z-50">
      <h4 className="text-sm font-semibold text-purple-300">Shapes</h4>
      <div className="grid grid-cols-3 gap-1">
        {availableShapes
          .slice(0, showAllShapes ? availableShapes.length : initialShapesCount)
          .map((shape) => (
            <button
              key={shape.type}
              onClick={() => handleShapeSelect(shape.type)}
              className={`p-1 text-xs font-medium rounded ${
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
          className="w-full text-xs mt-2 bg-gray-700 hover:bg-gray-600 rounded px-2 py-1"
        >
          {showAllShapes ? 'Less' : 'More'}
        </button>
      )}
    </div>
  )}

  {/* Color Picker */}
  <div>
    <label className="text-xs block mb-1 text-purple-300">Stroke Color</label>
    <input
      type="color"
      value={currentColor}
      onChange={(e) => setColor(e.target.value)}
      className="w-full h-8 rounded"
    />
  </div>

  {/* Sliders */}
  <div>
    <label className="text-xs text-purple-300">Line Width ({currentLineWidth}px)</label>
    <input
      type="range"
      min="1"
      max="50"
      value={currentLineWidth}
      onChange={(e) => setLineWidth(parseInt(e.target.value))}
      className="w-full"
    />
  </div>
  <div>
    <label className="text-xs text-purple-300">Text Size ({textFontSize}px)</label>
    <input
      type="range"
      min="10"
      max="60"
      value={textFontSize}
      onChange={(e) => setTextFontSize(parseInt(e.target.value))}
      className="w-full"
    />
  </div>

  {/* History */}
  <div>
    <h3 className="text-sm font-semibold text-purple-300 mb-2">History</h3>
    <div className="flex flex-col space-y-2">
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`${commonButtonClass} ${canUndo ? inactiveToolClass : disabledButtonClass}`}
      >
        Undo
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`${commonButtonClass} ${canRedo ? inactiveToolClass : disabledButtonClass}`}
      >
        Redo
      </button>
    </div>
  </div>

  {/* Clear */}
  <button
    onClick={clearCanvas}
    className="mt-auto w-full p-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
  >
    Clear Canvas
  </button>
</div>

  );
};

export default Sidebar;
