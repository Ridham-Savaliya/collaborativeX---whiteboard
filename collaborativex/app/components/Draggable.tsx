'use client';

import React, { useState } from 'react';
import { DndContext, useDraggable, DragEndEvent } from '@dnd-kit/core';

type DraggableProps = {
  id?: string;
  children: React.ReactNode;
};

export const Draggable = ({ id = 'draggable-ui', children }: DraggableProps) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });

  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const handleDragEnd = (event: DragEndEvent) => {
    if (transform) {
      setPosition((prev) => ({
        x: prev.x + transform.x,
        y: prev.y + transform.y,
      }));
    }
  };

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${position.x + transform.x}px, ${position.y + transform.y}px)`
      : `translate(${position.x}px, ${position.y}px)`,
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    cursor: 'grab',
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
      >
        {children}
      </div>
    </DndContext>
  );
};
