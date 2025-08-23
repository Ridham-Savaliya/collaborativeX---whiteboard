// app/components/Sidebar.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Pencil, Eraser, Highlighter, Square, StickyNote, Type,
  ChevronLeft, ChevronRight, UndoIcon, RedoIcon, Trash2,
  Circle, Triangle, Diamond, Star, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Heart, Pentagon, Hexagon, Octagon, CrossIcon, SmilePlus, Cloud,
  Bold, Italic, Underline
} from "lucide-react";
import { StickyNote as StickyNoteType } from "./Types";
import Image from "next/image";

interface SidebarProps {
  setColor: (color: string) => void;
  setLineWidth: (width: number) => void;
  setTool: (tool: "pen" | "eraser" | "highlighter" | "shape" | "stickyNote" | "text" | null) => void;
  currentColor: string;
  currentLineWidth: number;
  currentTool: "pen" | "eraser" | "highlighter" | "shape" | "stickyNote" | "text" | null;
  clearCanvas: () => void;
  setShowShapesDrawer: (show: boolean) => void;
  showShapesDrawer: boolean;
  setShapeType: (type: string | null) => void;
  currentShapeType: string | null;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  textFontSize: number;
  setTextFontSize: (size: number) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  addStickyNote: (note: StickyNoteType) => void;
  setTextStyles: (styles: { bold: boolean; italic: boolean; underline: boolean; fontFamily: string }) => void;
  textStyles: { bold: boolean; italic: boolean; underline: boolean; fontFamily: string };
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
  setTextStyles,
  textStyles,
}) => {
  const { t } = useTranslation();
  const [showToolsSection, setShowToolsSection] = useState(true);
  const [showStylesSection, setShowStylesSection] = useState(true);
  const [showTextStylesSection, setShowTextStylesSection] = useState(true);
  const [showHistorySection, setShowHistorySection] = useState(true);
  const [showAllShapes, setShowAllShapes] = useState(false);
  const [selectedColorPreset, setSelectedColorPreset] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const initialShapesCount = 6;

  const colorPresets = [
    { color: "#000000", name: t("black") },
    { color: "#FFFFFF", name: t("white") },
    { color: "#FF0000", name: t("red") },
    { color: "#00FF00", name: t("green") },
    { color: "#0000FF", name: t("blue") },
    { color: "#FFFF00", name: t("yellow") },
    { color: "#FF00FF", name: t("magenta") },
    { color: "#00FFFF", name: t("cyan") },
    { color: "#8B8EFB", name: t("purple") },
  ];

  const availableShapes = [
    { type: "rectangle", label: t("rectangle"), icon: <Square size={16} /> },
    { type: "circle", label: t("circle"), icon: <Circle size={16} /> },
    { type: "triangle", label: t("triangle"), icon: <Triangle size={16} /> },
    { type: "diamond", label: t("diamond"), icon: <Diamond size={16} /> },
    { type: "star", label: t("star"), icon: <Star size={16} /> },
    { type: "arrowUp", label: t("arrowUp"), icon: <ArrowUp size={16} /> },
    { type: "arrowDown", label: t("arrowDown"), icon: <ArrowDown size={16} /> },
    { type: "arrowLeft", label: t("arrowLeft"), icon: <ArrowLeft size={16} /> },
    { type: "arrowRight", label: t("arrowRight"), icon: <ArrowRight size={16} /> },
    { type: "heart", label: t("heart"), icon: <Heart size={16} /> },
    { type: "pentagon", label: t("pentagon"), icon: <Pentagon size={16} /> },
    { type: "hexagon", label: t("hexagon"), icon: <Hexagon size={16} /> },
    { type: "heptagon", label: t("heptagon"), icon: <Pentagon size={16} /> },
    { type: "octagon", label: t("octagon"), icon: <Octagon size={16} /> },
    { type: "cross", label: t("cross"), icon: <CrossIcon size={16} /> },
    { type: "smiley", label: t("smiley"), icon: <SmilePlus size={16} /> },
    { type: "cloud", label: t("cloud"), icon: <Cloud size={16} /> },
  ];

  const fontFamilies = [
    "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana",
    "Georgia", "Palatino", "Garamond", "Bookman", "Comic Sans MS",
    "Trebuchet MS", "Arial Black", "Impact",
  ];

  const tools = [
    { key: "pen", label: t("pen"), icon: <Pencil size={16} />, tooltip: t("penTooltip") },
    { key: "eraser", label: t("eraser"), icon: <Eraser size={16} />, tooltip: t("eraserTooltip") },
    { key: "highlighter", label: t("highlighter"), icon: <Highlighter size={16} />, tooltip: t("highlighterTooltip") },
    { key: "shape", label: t("shapesTool"), icon: <Square size={16} />, tooltip: t("shapesTooltip") },
    { key: "stickyNote", label: t("stickyNote"), icon: <StickyNote size={16} />, tooltip: t("stickyNoteTooltip") },
    { key: "text", label: t("text"), icon: <Type size={16} />, tooltip: t("textTooltip") },
  ];

  const handleShapeSelect = (shape: string | null) => {
    setTool("shape");
    setShapeType(shape);
    if (window.innerWidth >= 768) setShowShapesDrawer(false);
  };

  const handleToggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleColorPresetSelect = (color: string) => {
    setColor(color);
    setSelectedColorPreset(color);
  };

  const handleStickyNoteSelect = () => {
    setTool("stickyNote");
    setShowShapesDrawer(false);
    setShapeType(null);
  };

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerWidth < 640 && !isCollapsed) setIsCollapsed(true);
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [isCollapsed, setIsCollapsed]);

  return (
    <div id="right-navbar"   className="fixed top-0 left-0 h-full z-40 overflow-hidden">
      <div
        className={`
          h-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-14" : "w-64 sm:w-72"}
          flex flex-col rounded-r-xl shadow-2xl border-r border-purple-200 dark:border-purple-800/50
        `}
      >
        {isCollapsed ? (
          <div id="right-navbar"   className="h-full px-2 py-5 flex flex-col items-center justify-start">
            <div className="mb-4">
              <Image
                src="/logo2.png"
                alt="Logo"
                width={40}   // required in Next.js Image
                height={40}  // required in Next.js Image
                className="rounded-full object-contain transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-purple-500/30 dark:hover:shadow-purple-700/30"
              />
            </div>
            <button
              onClick={handleToggleCollapse}
              className="p-2 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 hover:from-purple-500 hover:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-purple-500/30 dark:hover:shadow-purple-700/30"
              title={t("expandSidebar")}
              aria-label={t("expandSidebar")}
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
                      if (tool.key === "stickyNote") handleStickyNoteSelect();
                      else if (tool.key === "shape") {
                        setTool("shape");
                        setIsCollapsed(false);
                        setShowShapesDrawer(true);
                      } else {
                        setTool(tool.key);
                        setShowShapesDrawer(false);
                      }
                    }}
                    className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${currentTool === tool.key
                        ? "bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-700/30"
                        : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                      }`}
                    style={{ minHeight: "40px", minWidth: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
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
                className={`p-2 rounded-full transition-all duration-300 ${canUndo
                    ? "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 hover:scale-110"
                    : "bg-gray-400 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                title={t("undo")}
                aria-label={t("undo")}
                style={{ minHeight: "40px", minWidth: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <UndoIcon size={16} />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`p-2 rounded-full transition-all duration-300 ${canRedo
                    ? "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 hover:scale-110"
                    : "bg-gray-400 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                title={t("redo")}
                aria-label={t("redo")}
                style={{ minHeight: "40px", minWidth: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <RedoIcon size={16} />
              </button>
              <button
                onClick={clearCanvas}
                className="p-2 rounded-full bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 hover:from-red-500 hover:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-red-500/30 dark:hover:shadow-red-700/30"
                title={t("clearCanvas")}
                aria-label={t("clearCanvas")}
                style={{ minHeight: "40px", minWidth: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full py-4 px-4 flex flex-col overflow-y-auto scrollbar-custom">
            <div className="mb-5 flex items-center justify-center">
              <img
                src="/logo2.png"
                alt="Logo"
                className="w-16 h-16 rounded-full object-contain transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/40 dark:hover:shadow-purple-700/40 border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-200/20 dark:from-purple-800/20 to-purple-300/20 dark:to-purple-900/20 p-1"
              />
            </div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 bg-clip-text text-transparent">{t("drawingTools")}</h2>
              <button
                onClick={handleToggleCollapse}
                className="p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                title={t("collapseSidebar")}
                aria-label={t("collapseSidebar")}
              >
                <ChevronLeft size={16} className="text-gray-800 dark:text-gray-200" />
              </button>
            </div>
            <div className="mb-4 bg-purple-100 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-inner border border-purple-200 dark:border-gray-700">
              <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={() => setShowToolsSection(!showToolsSection)}
              >
                <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-sm mr-1"></span>
                  {t("tools")}
                </h3>
                <ChevronRight
                  size={16}
                  className={`transform transition-transform duration-300 ${showToolsSection ? "rotate-90" : ""}`}
                />
              </div>
              {showToolsSection && (
                <div  className="space-y-2 transition-all duration-300">
                  <div className="grid grid-cols-2 gap-2">
                    {tools.map((tool) => (
                      <div key={tool.key} className="group relative">
                        <button
                          onClick={() => {
                            if (tool.key === "stickyNote") handleStickyNoteSelect();
                            else if (tool.key === "shape") {
                              setTool("shape");
                              setShowShapesDrawer(!showShapesDrawer);
                            } else {
                              setTool(tool.key);
                              setShowShapesDrawer(false);
                              setShapeType(null);
                            }
                          }}
                          className={`w-full py-2 px-2 text-xs font-medium rounded-lg flex items-center transition-all duration-300
                            ${currentTool === tool.key
                              ? "bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 hover:from-purple-500 hover:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-700/30"
                              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                            }`}
                          style={{ minHeight: "44px" }}
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
              <div className="mb-4 bg-gray-200 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-purple-200 dark:border-gray-700 space-y-2 animate-slide-down">
                <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                  <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-sm mr-1"></span>
                  {t("shapes")}
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  {availableShapes
                    .slice(0, showAllShapes ? availableShapes.length : initialShapesCount)
                    .map((shape) => (
                      <button
                        key={shape.type}
                        onClick={() => handleShapeSelect(shape.type)}
                        className={`p-2 flex flex-col items-center justify-center rounded-lg transition-all duration-300
                          ${currentShapeType === shape.type
                            ? "bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 hover:from-purple-500 hover:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-700/30"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                          }`}
                        style={{ minHeight: "44px" }}
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
                    className="w-full text-xs py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all duration-300 font-medium"
                    style={{ minHeight: "36px" }}
                  >
                    {showAllShapes ? t("showLess") : t("showAllShapes")}
                  </button>
                )}
              </div>
            )}
            <div className="mb-4 bg-purple-100 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-inner border border-purple-200 dark:border-gray-700">
              <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={() => setShowStylesSection(!showStylesSection)}
              >
                <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-sm mr-1"></span>
                  {t("styles")}
                </h3>
                <ChevronRight
                  size={16}
                  className={`transform transition-transform duration-300 ${showStylesSection ? "rotate-90" : ""}`}
                />
              </div>
              {showStylesSection && (
                <div className="space-y-3 transition-all duration-300">
                  <div className="space-y-1">
                    <label className="text-xs text-purple-600 dark:text-purple-400 font-medium block">{t("strokeColor")}</label>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => handleColorPresetSelect(preset.color)}
                          className={`w-8 h-8 rounded-full transition-all duration-300 hover:scale-110 ${selectedColorPreset === preset.color
                              ? "ring-2 ring-gray-200 dark:ring-gray-700 ring-offset-1 ring-offset-gray-100 dark:ring-offset-gray-900 shadow-lg"
                              : ""
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
                        className="w-full h-10 rounded-lg cursor-pointer opacity-0 absolute inset-0 z-10"
                      />
                      <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-700 p-2 rounded-lg border border-purple-200 dark:border-gray-600" style={{ minHeight: "44px" }}>
                        <div
                          className="w-8 h-8 rounded-md border border-gray-400 dark:border-gray-500 shadow-inner"
                          style={{ backgroundColor: currentColor }}
                        ></div>
                        <div className="text-xs font-mono text-gray-800 dark:text-gray-200">{currentColor.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t("lineWidth")}</label>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded-md text-gray-800 dark:text-gray-200">{currentLineWidth}px</span>
                    </div>
                    <div className="relative h-10 flex items-center px-3">
                      <div className="absolute inset-0 flex items-center px-3">
                        <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded-full">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-full"
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
                        className="w-full h-10 absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div
                        className="absolute rounded-full bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 shadow-md shadow-purple-500/30 dark:shadow-purple-700/30 cursor-grab"
                        style={{
                          left: `calc(${(currentLineWidth / 50) * 100}% - ${6 + currentLineWidth / 15}px)`,
                          width: `${16 + currentLineWidth / 5}px`,
                          height: `${16 + currentLineWidth / 5}px`,
                          transform: "translateY(-50%)",
                          top: "50%",
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400">
                      <span>{t("thin")}</span>
                      <span>{t("thick")}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t("textSize")}</label>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded-md text-gray-800 dark:text-gray-200">{textFontSize}px</span>
                    </div>
                    <div className="relative h-10 flex items-center px-3">
                      <div className="absolute inset-0 flex items-center px-3">
                        <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded-full">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-full"
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
                        className="w-full h-10 absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div
                        className="absolute rounded-full bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 shadow-md shadow-purple-500/30 dark:shadow-purple-700/30 cursor-grab"
                        style={{
                          left: `calc(${((textFontSize - 10) / 50) * 100}% - 8px)`,
                          width: "16px",
                          height: "16px",
                          transform: "translateY(-50%)",
                          top: "50%",
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400">
                      <span>{t("small")}</span>
                      <span>{t("large")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mb-4 bg-purple-100 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-inner border border-purple-200 dark:border-gray-700">
              <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={() => setShowTextStylesSection(!showTextStylesSection)}
              >
                <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-sm mr-1"></span>
                  {t("textStyles")}
                </h3>
                <ChevronRight
                  size={16}
                  className={`transform transition-transform duration-300 ${showTextStylesSection ? "rotate-90" : ""}`}
                />
              </div>
              {showTextStylesSection && (
                <div className="space-y-3 transition-all duration-300">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTextStyles({ ...textStyles, bold: !textStyles.bold })}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all duration-300 ${textStyles.bold
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        }`}
                      title={t("bold")}
                      aria-label={t("bold")}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => setTextStyles({ ...textStyles, italic: !textStyles.italic })}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all duration-300 ${textStyles.italic
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        }`}
                      title={t("italic")}
                      aria-label={t("italic")}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => setTextStyles({ ...textStyles, underline: !textStyles.underline })}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all duration-300 ${textStyles.underline
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        }`}
                      title={t("underline")}
                      aria-label={t("underline")}
                    >
                      <Underline size={16} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-purple-600 dark:text-purple-400 font-medium block">{t("fontFamily")}</label>
                    <select
                      value={textStyles.fontFamily}
                      onChange={(e) => setTextStyles({ ...textStyles, fontFamily: e.target.value })}
                      className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg p-2 border border-purple-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400"
                      style={{ minHeight: "44px" }}
                    >
                      {fontFamilies.map((font) => (
                        <option key={font} value={font} className="text-gray-800 dark:text-gray-200">
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="mb-4 bg-purple-100 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-inner border border-purple-200 dark:border-gray-700">
              <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={() => setShowHistorySection(!showHistorySection)}
              >
                <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-sm mr-1"></span>
                  {t("history")}
                </h3>
                <ChevronRight
                  size={16}
                  className={`transform transition-transform duration-300 ${showHistorySection ? "rotate-90" : ""}`}
                />
              </div>
              {showHistorySection && (
                <div className="flex space-x-2 transition-all duration-300">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center transition-all duration-300
                      ${canUndo
                        ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        : "bg-gray-400 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    style={{ minHeight: "44px" }}
                    aria-disabled={!canUndo}
                  >
                    <UndoIcon size={14} className="mr-1" />
                    {t("undo")}
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center transition-all duration-300
                      ${canRedo
                        ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        : "bg-gray-400 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    style={{ minHeight: "44px" }}
                    aria-disabled={!canRedo}
                  >
                    <RedoIcon size={14} className="mr-1" />
                    {t("redo")}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={clearCanvas}
              className="mt-auto w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 hover:from-red-500 hover:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 text-white transition-all duration-300 shadow-lg hover:shadow-red-500/25 dark:hover:shadow-red-700/25"
              style={{ minHeight: "44px" }}
            >
              <Trash2 size={14} className="mr-1" />
              {t("clearCanvas")}
            </button>
          </div>
        )}
        <div
          className={`absolute left-14 top-4 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md pointer-events-none transition-opacity duration-300 ${currentTool && isCollapsed ? "opacity-100" : "opacity-0"}`}
        >
          {tools.find((t) => t.key === currentTool)?.label}
        </div>
      </div>
      <style jsx>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: #6B46C1 rgba(255, 255, 255, 0.05);
        }
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6B46C1, #8B8EFB);
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #553C9A, #A3AEF8);
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
