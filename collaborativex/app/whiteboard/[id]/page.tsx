"use client";

import React, { useState, useEffect, useCallback } from "react";
import Canvas from "../../components/Canvas";
import Sidebar from "../../components/Sidebar";
import { StickyNote, WhiteboardElement } from "../../components/Types";
import { log } from "console";
import withAuth from "@/app/api/_lib/withAuth";
import { useGlobalLoader } from "@/app/hooks/useGlobalLoader";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

const WhiteboardPage: React.FC<PageProps> = ({ params }) => {
  // Unwrap the params promise using React.use()
  const { id } = React.use(params);

  console.log("Whiteboard ID:", id);


  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<
    "pen" | "eraser" | "highlighter" | "shape" | "stickyNote" | "text" | null
  >("pen");
  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [selectedShapeType, setSelectedShapeType] = useState<
    | "rectangle"
    | "circle"
    | "line"
    | "triangle"
    | "diamond"
    | "star"
    | "arrow"
    | "heart"
    | "pentagon"
    | "hexagon"
    | "heptagon"
    | "octagon"
    | "cross"
    | "smiley"
    | "cloud"
    | null
  >(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [textFontSize, setTextFontSize] = useState<number>(24);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [canvasKey, setCanvasKey] = useState<number>(0);
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontFamily: "Arial",
  });


  

  const [history, setHistory] = useState<
    { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }[]
  >([{ elements: [], stickyNotes: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const startTime = Date.now(); // Track when user opened the page
    const token = localStorage.getItem("token"); // Get the JWT token

    const handleBeforeUnload = () => {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      if (token) {
        fetch("/api/user/profile/timespent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Auth header
          },
          body: JSON.stringify({ sessionDurationSeconds: durationSeconds }),
          keepalive: true, // ✅ Ensures it still sends even if tab is closed
        });
      }
    };

    // ✅ Attach event before window unloads
    window.addEventListener("beforeunload", handleBeforeUnload);

    // ✅ Cleanup on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  const clearCanvas = useCallback(() => {
    setStickyNotes([]);
    setHistory([{ elements: [], stickyNotes: [] }]);
    setHistoryIndex(0);
  }, []);

  const saveToHistory = useCallback(
    (state: { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }) => {
      setHistory((prev) => {
        const newHistory = [...prev.slice(0, historyIndex + 1), state];
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [canRedo]);

  const handleToolChange = useCallback(
    (
      newTool:
        | "pen"
        | "eraser"
        | "highlighter"
        | "shape"
        | "stickyNote"
        | "text"
        | null
    ) => {
      setTool(newTool);
      setShowShapesDrawer(newTool === "shape");
    },
    []
  );

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
        textStyles={textStyles}
        setTextStyles={setTextStyles}
        addStickyNote={(note: StickyNote) =>
          setStickyNotes((prev) => [...prev, note])
        }
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
          textStyles={textStyles}
        />
      </main>
    </div>
  );
};

export default withAuth(WhiteboardPage);
