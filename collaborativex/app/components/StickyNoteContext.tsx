import { createContext } from 'react';
import { StickyNote } from './Types';

export interface StickyNoteContextType {
  addNote: (note: Omit<StickyNote, 'id'>) => void;
  setPendingNote: (note: Omit<StickyNote, 'id'> | null) => void;
  stickyNotes: StickyNote[];
  pendingNote: Omit<StickyNote, 'id'> | null;
}

export const StickyNoteContext = createContext<StickyNoteContextType | null>(null);
