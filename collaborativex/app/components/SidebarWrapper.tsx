"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
const Sidebar = dynamic(() => import('./Sidebar'), {
  ssr: false,
});

export default function SidebarWrapper() {
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapeMode, setShapeMode] = useState<"line" | "rectangle" | "circle">("line");

  const handleClear = () => {
    setColor("#000000");
    setStrokeWidth(2);
    setShapeMode("line");
  };

  return (
    <Sidebar
      onColorChange={setColor}
      onStrokeWidthChange={setStrokeWidth}
      onShapeModeChange={setShapeMode}
      onClear={handleClear}
    />
  );
}
