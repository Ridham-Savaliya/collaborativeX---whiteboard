import { useRef, useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";

// Constants for grid and canvas styling
const GRID_SIZE = 20; // Grid square size in pixels
const GRID_COLOR = "#d1d5db"; // Soft gray for grid lines
const BACKGROUND_COLOR = "#f8fafc"; // Light off-white background
const CANVAS_HEIGHT = 600; // Fixed canvas height
const MIN_SCALE = 0.5; // Minimum zoom level
const MAX_SCALE = 3; // Maximum zoom level
const SCALE_BY = 1.1; // Zoom speed

interface CanvasProps {
  color?: string;
  strokeWidth?: number;
  shapeMode?: "line" | "rectangle" | "circle";
  onClear?: () => void;
}

const Canvas = ({
  color = "#000000",
  strokeWidth = 2,
  shapeMode = "line",
  onClear = () => {},
}: CanvasProps) => {
  const [lines, setLines] = useState<any[]>([]);
  const [scale, setScale] = useState(1); // Zoom level
  const [offsetX, setOffsetX] = useState(0); // View offset X
  const [offsetY, setOffsetY] = useState(0); // View offset Y
  const isDrawing = useRef(false);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  // Responsive canvas width
  const canvasWidth = Math.min(window.innerWidth * 1, 1300);

  // Convert screen to world coordinates
  const screenToWorld = (x: number, y: number) => ({
    x: (x - offsetX) / scale,
    y: (y - offsetY) / scale,
  });

  // Convert world to screen coordinates
  const worldToScreen = (x: number, y: number) => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  });

  // Handle mouse down (start drawing or dragging)
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const worldPos = screenToWorld(pos.x, pos.y);

    if (e.evt.button === 0) { // Left click: draw
      isDrawing.current = true;
      startPoint.current = worldPos;

      if (shapeMode === "line") {
        setLines([...lines, { points: [worldPos.x, worldPos.y], stroke: color, strokeWidth }]);
      } else if (shapeMode === "rectangle" || shapeMode === "circle") {
        setLines([...lines, { start: worldPos, end: worldPos, stroke: color, strokeWidth, shape: shapeMode }]);
      }
    } else if (e.evt.button === 2) { // Right click: drag
      isDragging.current = true;
      lastMousePos.current = { x: pos.x, y: pos.y };
    }
  };

  // Handle mouse move (draw or drag)
  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const worldPoint = screenToWorld(pos.x, pos.y);

    if (isDrawing.current) {
      const lastLine = lines[lines.length - 1];
      if (!lastLine) return;

      if (shapeMode === "line") {
        lastLine.points = lastLine.points.concat([worldPoint.x, worldPoint.y]);
        setLines([...lines.slice(0, -1), lastLine]);
      } else if (shapeMode === "rectangle" || shapeMode === "circle") {
        lastLine.end = worldPoint;
        setLines([...lines.slice(0, -1), lastLine]);
      }
    } else if (isDragging.current) {
      const dx = pos.x - lastMousePos.current.x;
      const dy = pos.y - lastMousePos.current.y;
      setOffsetX(offsetX + dx);
      setOffsetY(offsetY + dy);
      lastMousePos.current = { x: pos.x, y: pos.y };
    }
  };

  // Handle mouse up (stop drawing or dragging)
  const handleMouseUp = (e: any) => {
    if (e.evt.button === 0) {
      isDrawing.current = false;
      startPoint.current = null;
    } else if (e.evt.button === 2) {
      isDragging.current = false;
    }
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const oldScale = scale;
    const newScale = e.evt.deltaY > 0 ? oldScale / SCALE_BY : oldScale * SCALE_BY;

    // Constrain zoom
    const boundedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    // Adjust offset to zoom around pointer
    const mouseWorldBefore = screenToWorld(pointer.x, pointer.y);
    setScale(boundedScale);
    const mouseWorldAfter = screenToWorld(pointer.x, pointer.y);
    setOffsetX(offsetX + (mouseWorldAfter.x - mouseWorldBefore.x) * boundedScale);
    setOffsetY(offsetY + (mouseWorldAfter.y - mouseWorldBefore.y) * boundedScale);
  };

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(canvasWidth, CANVAS_HEIGHT);

    // Vertical lines
    const startX = Math.floor(topLeft.x / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil(bottomRight.x / GRID_SIZE) * GRID_SIZE;
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const screenStart = worldToScreen(x, topLeft.y);
      const screenEnd = worldToScreen(x, bottomRight.y);
      lines.push(
        <Line
          key={`v-${x}`}
          points={[screenStart.x, screenStart.y, screenEnd.x, screenEnd.y]}
          stroke={GRID_COLOR}
          strokeWidth={1 / scale}
        />
      );
    }

    // Horizontal lines
    const startY = Math.floor(topLeft.y / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil(bottomRight.y / GRID_SIZE) * GRID_SIZE;
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      const screenStart = worldToScreen(topLeft.x, y);
      const screenEnd = worldToScreen(bottomRight.x, y);
      lines.push(
        <Line
          key={`h-${y}`}
          points={[screenStart.x, screenStart.y, screenEnd.x, screenEnd.y]}
          stroke={GRID_COLOR}
          strokeWidth={1 / scale}
        />
      );
    }

    return lines;
  };

  // Render shapes (lines, rectangles, circles)
  const renderShapes = () =>
    lines.map((item, i) => {
      if (item.shape === "rectangle") {
        const screenStart = worldToScreen(item.start.x, item.start.y);
        const screenEnd = worldToScreen(item.end.x, item.end.y);
        const width = screenEnd.x - screenStart.x;
        const height = screenEnd.y - screenStart.y;
        return (
          <Rect
            key={i}
            x={screenStart.x}
            y={screenStart.y}
            width={width}
            height={height}
            stroke={item.stroke}
            strokeWidth={item.strokeWidth / scale}
          />
        );
      } else if (item.shape === "circle") {
        const screenStart = worldToScreen(item.start.x, item.start.y);
        const screenEnd = worldToScreen(item.end.x, item.end.y);
        const radius = Math.sqrt(
          Math.pow(screenEnd.x - screenStart.x, 2) + Math.pow(screenEnd.y - screenStart.y, 2)
        );
        return (
          <Line
            key={i}
            points={[screenStart.x, screenStart.y, screenEnd.x, screenEnd.y]}
            stroke={item.stroke}
            strokeWidth={item.strokeWidth / scale}
            closed
            tension={1}
          />
        );
      } else {
        const screenPoints = [];
        for (let j = 0; j < item.points.length; j += 2) {
          const screenPoint = worldToScreen(item.points[j], item.points[j + 1]);
          screenPoints.push(screenPoint.x, screenPoint.y);
        }
        return (
          <Line
            key={i}
            points={screenPoints}
            stroke={item.stroke}
            strokeWidth={item.strokeWidth / scale}
            tension={0.5}
            lineCap="round"
            globalCompositeOperation="source-over"
          />
        );
      }
    });

  // Handle clear canvas
  const handleClear = () => {
    setLines([]);
    onClear();
  };

  // Prevent right-click context menu
  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
  };

  return (
    <div
      className="bg-white rounded-lg shadow-xl overflow-hidden"
      style={{ width: canvasWidth, height: CANVAS_HEIGHT }}
    >
      <Stage
        width={canvasWidth}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        ref={stageRef}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={CANVAS_HEIGHT}
            fill={BACKGROUND_COLOR}
          />
          {generateGridLines()}
        </Layer>
        <Layer>{renderShapes()}</Layer>
      </Stage>
    </div>
  );
};

// Export with dynamic import to disable SSR
export default Canvas;
