"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Canvas and Sidebar to disable SSR
const Canvas = dynamic(() => import("../components/Canvas"), { ssr: false });
const Sidebar = dynamic(() => import("../components/Sidebar"), { ssr: false });

const Page = () => {
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapeMode, setShapeMode] = useState<"line" | "rectangle" | "circle">("line");

  const handleClear = () => {
    setColor("#000000");
    setStrokeWidth(2);
    setShapeMode("line");
  };

  return (
    <main className="min-h-screen w-full flex flex-row items-start justify-start">
      <Sidebar
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onShapeModeChange={setShapeMode}
        onClear={handleClear}
      />
      <div className="flex-1 flex justify-center">
        <Canvas
          color={color}
          strokeWidth={strokeWidth}
          shapeMode={shapeMode}
          onClear={handleClear}
        />
      </div>
    </main>
  );
};

export default Page;
