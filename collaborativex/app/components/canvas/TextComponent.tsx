/**
 * Optimized text component with efficient rendering and editing capabilities
 * Handles text elements with transform-based positioning and proper styling
 */

import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { TextElement, TextStyles } from '../types/WhiteboardTypes';

interface TextComponentProps {
  textElement: TextElement;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeTextId: string | null;
  editingTextId: string | null;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, textId: string) => void;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>, textId: string) => void;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>, textId: string) => void;
  onFinishEditing: () => void;
  onDelete: (textId: string) => void;
  textStyles: TextStyles;
  textFontSize: number;
}

/**
 * Utility function to validate text element ID
 */
const isValidId = (id: string | undefined): boolean => {
  return Boolean(id && typeof id === 'string' && id.trim().length > 0);
};

/**
 * Delete button component for better modularity
 */
const DeleteButton = memo<{
  onDelete: () => void;
}>(({ onDelete }) => (
  <button
    className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full 
               -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 
               hover:bg-red-600 transition-all duration-200 transform hover:scale-105
               focus:outline-none focus:ring-2 focus:ring-red-300"
    onClick={onDelete}
    aria-label="Delete text"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
));

DeleteButton.displayName = 'DeleteButton';

export const TextComponent = memo<TextComponentProps>(({
  textElement,
  zoomLevel,
  panOffset,
  activeTextId,
  editingTextId,
  onMouseDown,
  onDoubleClick,
  onTextChange,
  onFinishEditing,
  onDelete,
  textStyles,
  textFontSize,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validate text element ID and early return if invalid
  if (!isValidId(textElement.id)) {
    console.error('Invalid text element ID:', textElement);
    return null;
  }

  // Memoized transform calculations for performance
  const transform = useMemo(() => {
    const adjustedX = textElement.x * zoomLevel + panOffset.x;
    const adjustedY = textElement.y * zoomLevel + panOffset.y;
    
    return {
      x: adjustedX,
      y: adjustedY,
      transform: `translate3d(${adjustedX}px, ${adjustedY}px, 0)`,
    };
  }, [textElement.x, textElement.y, zoomLevel, panOffset]);

  // Memoized text styles for performance
  const computedTextStyles = useMemo(() => ({
    color: textElement.color,
    fontSize: `${textFontSize * zoomLevel}px`,
    fontWeight: textStyles.bold ? 'bold' : 'normal',
    fontStyle: textStyles.italic ? 'italic' : 'normal',
    textDecoration: textStyles.underline ? 'underline' : 'none',
    fontFamily: textStyles.fontFamily,
    minWidth: '100px',
    minHeight: '30px',
  }), [textElement.color, textFontSize, zoomLevel, textStyles]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    onMouseDown(e, textElement.id);
  }, [onMouseDown, textElement.id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    onDoubleClick(e, textElement.id);
  }, [onDoubleClick, textElement.id]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e, textElement.id);
  }, [onTextChange, textElement.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(textElement.id);
  }, [onDelete, textElement.id]);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (editingTextId === textElement.id && textareaRef.current) {
      const textarea = textareaRef.current;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.select();
      });
    }
  }, [editingTextId, textElement.id]);

  const isActive = activeTextId === textElement.id;
  const isEditing = editingTextId === textElement.id;
  const displayText = textElement.text || '';

  return (
    <div
      data-text-id={textElement.id}
      className={`absolute shadow-md rounded-md overflow-visible transition-all duration-200 select-none
                  ${isActive 
                    ? 'z-20 shadow-xl ring-2 ring-purple-500' 
                    : 'z-10 hover:shadow-lg'}`}
      style={{
        transform: transform.transform,
        cursor: isEditing ? 'text' : 'move',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      role="textbox"
      aria-label={`Text element: ${displayText || 'Empty text'}`}
      tabIndex={isActive ? 0 : -1}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="bg-transparent border-none resize-none focus:outline-none p-1 rounded-md 
                     overflow-y-auto overflow-x-hidden whitespace-pre-wrap
                     focus:ring-2 focus:ring-purple-300 transition-all duration-200"
          style={computedTextStyles}
          value={displayText}
          onChange={handleTextChange}
          onBlur={onFinishEditing}
          placeholder="Enter text here..."
          aria-label="Text content"
          autoFocus
        />
      ) : (
        <div
          className="p-1 rounded-md overflow-y-auto overflow-x-hidden cursor-move 
                     whitespace-pre-wrap select-text hover:bg-purple-50/10 
                     transition-all duration-200"
          style={computedTextStyles}
          aria-label={displayText || 'Empty text - double-click to edit'}
        >
          {displayText || 'Double-click to edit'}
        </div>
      )}

      {/* Delete button - only show when active and not editing */}
      {isActive && !isEditing && (
        <DeleteButton onDelete={handleDelete} />
      )}
    </div>
  );
});

TextComponent.displayName = 'TextComponent';
