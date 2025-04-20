'use client';

import { useEffect, useRef, useState } from 'react';

const WhiteboardDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('var(--primary)');
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial drawing style
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    setLastX(x);
    setLastY(y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    
    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lineWidth * 2;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div className="glass-card p-4 relative w-full rounded-xl overflow-hidden" style={{ minHeight: '350px', height: '60vh' }}>
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white px-4 py-2 rounded-full text-sm shadow-md">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-medium">Live Demo</span>
        </div>
        <div className="flex items-center space-x-3 bg-[var(--background)] bg-opacity-90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-[var(--glass-bg)] mt-4 md:mt-0">
          <button
            onClick={() => setTool('pen')}
            className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${tool === 'pen' ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-md' : 'hover:bg-[var(--glass-bg)]'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${tool === 'eraser' ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-md' : 'hover:bg-[var(--glass-bg)]'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border-2 border-[var(--glass-bg)] transition-transform hover:scale-105"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-28 cursor-pointer accent-[var(--primary)]"
          />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-lg cursor-crosshair shadow-inner"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ height: 'calc(100% - 20px)' }}
      />
      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-lg transform transition-transform hover:scale-105 cursor-pointer">
          Share your feedback!
        </div>
      </div>
    </div>
  );
};

export default WhiteboardDemo;
