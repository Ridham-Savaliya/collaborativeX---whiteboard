/**
 * Optimized sticky note component with transform-based positioning
 * Provides smooth interactions and efficient rendering
 */

import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { StickyNote, TextStyles } from '../types/WhiteboardTypes';

interface StickyNoteProps {
  note: StickyNote;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeNoteId: string | null;
  editingNoteId: string | null;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, noteId: string) => void;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>, noteId: string) => void;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>, noteId: string) => void;
  onFinishEditing: () => void;
  onDelete: (noteId: string) => void;
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>, noteId: string, direction: string) => void;
  onColorChange: (noteId: string, x: number, y: number) => void;
  textStyles: TextStyles;
  textFontSize: number;
}

/**
 * Color palette for sticky notes with accessibility considerations
 */
const COLOR_PALETTE = [
  { bg: '#FEF7CD', text: '#000000', name: 'Light Yellow' },
  { bg: '#D3E4FD', text: '#000000', name: 'Light Blue' },
  { bg: '#E5DEFF', text: '#000000', name: 'Light Purple' },
  { bg: '#F2FCE2', text: '#000000', name: 'Light Green' },
  { bg: '#FFDEE2', text: '#000000', name: 'Light Pink' },
  { bg: '#FDE1D3', text: '#000000', name: 'Light Orange' },
  { bg: '#FFD700', text: '#000000', name: 'Gold' },
  { bg: '#98FB98', text: '#000000', name: 'Pale Green' },
  { bg: '#FFB6C1', text: '#000000', name: 'Light Pink' },
  { bg: '#ADD8E6', text: '#000000', name: 'Light Blue' },
  { bg: '#FFFFFF', text: '#000000', name: 'White' },
  { bg: '#000000', text: '#FFFFFF', name: 'Black' },
] as const;

/**
 * Utility function to validate and sanitize note ID
 */
const isValidId = (id: string | undefined): boolean => {
  return Boolean(id && typeof id === 'string' && id.trim().length > 0);
};

/**
 * Utility function to darken color for visual feedback
 */
const darkenColor = (hex: string, percent: number): string => {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) {
    return '#000000';
  }
  
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B)
    .toString(16)
    .slice(1)
    .padStart(6, '0')}`;
};

/**
 * Resize handle component for better modularity
 */
const ResizeHandle = memo<{
  direction: string;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}>(({ direction, onMouseDown, className = '' }) => {
  const cursorClass = `cursor-${direction}-resize`;
  
  return (
    <div
      className={`absolute w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full 
                  transform hover:bg-purple-700 hover:scale-125 transition-all duration-200 z-30 ${cursorClass} ${className}`}
      onMouseDown={onMouseDown}
      role="button"
      aria-label={`Resize ${direction}`}
    />
  );
});

ResizeHandle.displayName = 'ResizeHandle';

export const StickyNoteComponent = memo<StickyNoteProps>(({
  note,
  zoomLevel,
  panOffset,
  activeNoteId,
  editingNoteId,
  onMouseDown,
  onDoubleClick,
  onTextChange,
  onFinishEditing,
  onDelete,
  onResizeStart,
  onColorChange,
  textStyles,
  textFontSize,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validate note ID and early return if invalid
  if (!isValidId(note.id)) {
    console.error('Invalid note ID:', note);
    return null;
  }

  // Memoized calculations for performance
  const transform = useMemo(() => {
    const adjustedX = note.x * zoomLevel + panOffset.x;
    const adjustedY = note.y * zoomLevel + panOffset.y;
    
    return {
      x: adjustedX,
      y: adjustedY,
      width: note.width * zoomLevel,
      height: note.height * zoomLevel,
    };
  }, [note.x, note.y, note.width, note.height, zoomLevel, panOffset]);

  // Memoized style calculations
  const noteStyles = useMemo(() => {
    const bgColor = note.bgColor || note.color || '#FEF7CD';
    const textColor = note.textColor || '#000000';
    
    return {
      container: {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        width: `${transform.width}px`,
        height: `${transform.height}px`,
        background: bgColor,
        border: `1px solid ${darkenColor(bgColor, 15)}`,
      },
      text: {
        color: textColor,
        fontSize: `${textFontSize * zoomLevel}px`,
        fontWeight: textStyles.bold ? 'bold' : 'normal',
        fontStyle: textStyles.italic ? 'italic' : 'normal',
        textDecoration: textStyles.underline ? 'underline' : 'none',
        fontFamily: textStyles.fontFamily,
      },
    };
  }, [transform, note.bgColor, note.color, note.textColor, textFontSize, zoomLevel, textStyles]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    onMouseDown(e, note.id);
  }, [onMouseDown, note.id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    onDoubleClick(e, note.id);
  }, [onDoubleClick, note.id]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e, note.id);
  }, [onTextChange, note.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  }, [onDelete, note.id]);

  const handleColorPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onColorChange(note.id, rect.right + 8, rect.top);
  }, [onColorChange, note.id]);

  // Create resize handlers
  const createResizeHandler = useCallback((direction: string) => 
    (e: React.MouseEvent<HTMLDivElement>) => {
      onResizeStart(e, note.id, direction);
    }, [onResizeStart, note.id]);

  const resizeHandlers = useMemo(() => ({
    nw: createResizeHandler('nw'),
    ne: createResizeHandler('ne'),
    sw: createResizeHandler('sw'),
    se: createResizeHandler('se'),
  }), [createResizeHandler]);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (editingNoteId === note.id && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();
    }
  }, [editingNoteId, note.id]);

  const isActive = activeNoteId === note.id;
  const isEditing = editingNoteId === note.id;
  const displayText = note.text || note.content || '';

  return (
    <div
      data-note-id={note.id}
      className={`absolute rounded-lg overflow-hidden transition-all duration-300 ease-in-out select-none
                  ${isActive 
                    ? 'z-50 shadow-2xl ring-2 ring-purple-400 scale-105' 
                    : 'z-40 shadow-lg hover:shadow-xl'}`}
      style={noteStyles.container}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      role="region"
      aria-label={`Sticky note: ${displayText || 'Empty note'}`}
    >
      {/* Header with controls */}
      <div className="flex justify-between items-center p-2 bg-gradient-to-r from-black/5 to-transparent">
        <button
          className="relative group bg-gradient-to-br from-purple-500 to-purple-700 text-white 
                     rounded-full p-1.5 hover:from-purple-600 hover:to-purple-800 
                     transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-300"
          onClick={handleColorPicker}
          aria-label="Change color"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={noteStyles.container.background} stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span className="absolute hidden group-hover:block text-xs text-white bg-gray-800 
                           rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
            Change Color
          </span>
        </button>
        
        <button
          className="relative group bg-gradient-to-br from-red-500 to-red-700 text-white 
                     rounded-full p-1.5 hover:from-red-600 hover:to-red-800 
                     transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
          onClick={handleDelete}
          aria-label="Delete note"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span className="absolute hidden group-hover:block text-xs text-white bg-gray-800 
                           rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
            Delete
          </span>
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 p-3 h-full">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="w-full h-full bg-transparent border-none resize-none focus:outline-none 
                       focus:ring-2 focus:ring-purple-300 rounded-md p-2 transition-all duration-200 
                       whitespace-normal break-words"
            style={noteStyles.text}
            value={displayText}
            onChange={handleTextChange}
            onBlur={onFinishEditing}
            placeholder="Enter text here..."
            rows={5}
            aria-label="Note content"
            autoFocus
          />
        ) : (
          <div
            className="w-full h-full overflow-y-auto overflow-x-hidden cursor-move 
                       whitespace-normal break-words select-text"
            style={noteStyles.text}
            aria-label={displayText || 'Empty note - double-click to edit'}
          >
            {displayText || 'Double-click to edit'}
          </div>
        )}
      </div>

      {/* Resize handles - only show when active and not editing */}
      {isActive && !isEditing && (
        <>
          <ResizeHandle
            direction="nw"
            onMouseDown={resizeHandlers.nw}
            className="top-0 left-0 -translate-x-1/2 -translate-y-1/2"
          />
          <ResizeHandle
            direction="ne"
            onMouseDown={resizeHandlers.ne}
            className="top-0 right-0 translate-x-1/2 -translate-y-1/2"
          />
          <ResizeHandle
            direction="sw"
            onMouseDown={resizeHandlers.sw}
            className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2"
          />
          <ResizeHandle
            direction="se"
            onMouseDown={resizeHandlers.se}
            className="bottom-0 right-0 translate-x-1/2 translate-y-1/2"
          />
        </>
      )}
    </div>
  );
});

StickyNoteComponent.displayName = 'StickyNoteComponent';
