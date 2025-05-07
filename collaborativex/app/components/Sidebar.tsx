// "use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface SidebarProps {
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onShapeModeChange: (mode: "line" | "rectangle" | "circle") => void;
  onClear: () => void;
}

const Sidebar = ({ onColorChange, onStrokeWidthChange, onShapeModeChange, onClear }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapeMode, setShapeMode] = useState<"line" | "rectangle" | "circle">("line");

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
    onColorChange(e.target.value);
  };

  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const width = parseInt(e.target.value);
    setStrokeWidth(width);
    onStrokeWidthChange(width);
  };

  const handleShapeModeChange = (mode: "line" | "rectangle" | "circle") => {
    setShapeMode(mode);
    onShapeModeChange(mode);
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 ${isOpen ? "w-64" : "w-12"} flex flex-col shadow-lg z-10`}>
      {/* Toggle Button */}
      <button
        className="p-3 text-white hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Content */}
      {isOpen && (
        <div className="flex flex-col p-4 space-y-6">
          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              className="w-full h-10 rounded-md border-none cursor-pointer"
            />
          </div>

          {/* Stroke Width */}
          <div>
            <label className="block text-sm font-medium mb-1">Stroke Width</label>
            <select
              value={strokeWidth}
              onChange={handleStrokeWidthChange}
              className="w-full p-2 rounded-md bg-gray-700 text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={4}>4px</option>
              <option value={6}>6px</option>
            </select>
          </div>

          {/* Shape Mode */}
          <div>
            <label className="block text-sm font-medium mb-1">Shape</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleShapeModeChange("line")}
                className={`px-3 py-1 rounded-md ${shapeMode === "line" ? "bg-blue-500" : "bg-gray-700"} hover:bg-blue-600 transition-colors`}
              >
                Line
              </button>
              <button
                onClick={() => handleShapeModeChange("rectangle")}
                className={`px-3 py-1 rounded-md ${shapeMode === "rectangle" ? "bg-blue-500" : "bg-gray-700"} hover:bg-blue-600 transition-colors`}
              >
                Rectangle
              </button>
              <button
                onClick={() => handleShapeModeChange("circle")}
                className={`px-3 py-1 rounded-md ${shapeMode === "circle" ? "bg-blue-500" : "bg-gray-700"} hover:bg-blue-600 transition-colors`}
              >
                Circle
              </button>
            </div>
          </div>

          {/* Clear Canvas */}
          <button
            onClick={onClear}
            className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 transition-colors"
          >
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
