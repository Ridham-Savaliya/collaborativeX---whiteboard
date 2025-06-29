/**
 * Canvas controls component with zoom and export functionality
 * Provides user interface controls for canvas operations
 */

import React, { memo } from 'react';
import { ZoomIn, ZoomOut, Download, FileText } from 'lucide-react';

interface CanvasControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  className?: string;
}

export const CanvasControls = memo<CanvasControlsProps>(({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onExportPNG,
  onExportPDF,
  className = '',
}) => {
  return (
    <div className={`fixed bottom-5 right-5 flex items-center gap-3 bg-white dark:bg-gray-800 
                    rounded-xl shadow-lg p-3 z-50 border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
        <button
          className="w-10 h-10 flex items-center justify-center bg-purple-600 dark:bg-purple-700 
                     rounded-lg hover:bg-purple-500 dark:hover:bg-purple-600 
                     transition-all duration-200 text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
          onClick={onZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 min-w-[50px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        
        <button
          className="w-10 h-10 flex items-center justify-center bg-purple-600 dark:bg-purple-700 
                     rounded-lg hover:bg-purple-500 dark:hover:bg-purple-600 
                     transition-all duration-200 text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
      </div>

    
    </div>
  );
});

CanvasControls.displayName = 'CanvasControls';
