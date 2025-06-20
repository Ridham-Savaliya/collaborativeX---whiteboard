import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiteboard extends Document {
  name: string;
  purpose: string;
  collaborators: Array<string>;
  isFavorite: boolean;
  isShared: boolean;
  owner: mongoose.Types.ObjectId;
  elements: Array<{
    id: string;
    type: 'path' | 'shape' | 'text';
    points?: Array<{ x: number; y: number }>; // For paths
    tool?: 'pen' | 'eraser' | 'highlighter'; // For paths
    color: string;
    lineWidth?: number; // For paths and shapes
    shapeType?: string; // For shapes
    x?: number; // For shapes and text
    y?: number; // For shapes and text
    width?: number; // For shapes
    height?: number; // For shapes
    text?: string; // For text
    fontSize?: number; // For text
    fontFamily?: string; // For text
    bold?: boolean; // For text
    italic?: boolean; // For text
    underline?: boolean; // For text
  }>;
  stickyNotes: Array<{
    id: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }>;
  history: Array<any>;
  createdAt: Date;
  updatedAt: Date;
}

const WhiteboardSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    purpose: {
      type: String,
      required: true,
      enum: ["Project Planning", "Team Brainstorm", "Design Sprint", "Strategy Session", "Other"],
    },
    isShared: { type: Boolean, default: false },
    collaborators: [{ type: String }],
    isFavorite: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    elements: [
      {
        id: { type: String, required: true },
        type: { type: String, enum: ['path', 'shape', 'text'], required: true },
        points: [{ x: Number, y: Number }],
        tool: { type: String, enum: ['pen', 'eraser', 'highlighter'] },
        color: { type: String },
        lineWidth: { type: Number },
        shapeType: {
          type: String,
          enum: [
            'rectangle', 'circle', 'line', 'triangle', 'diamond', 'star',
            'arrowRight', 'arrowLeft', 'arrowUp', 'arrowDown', 'heart',
            'pentagon', 'hexagon', 'heptagon', 'octagon', 'cross', 'smiley', 'cloud',
          ],
        },
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
        text: { type: String },
        fontSize: { type: Number },
        fontFamily: { type: String },
        bold: { type: Boolean },
        italic: { type: Boolean },
        underline: { type: Boolean },
      },
    ],
    stickyNotes: [
      {
        id: { type: String, required: true },
        content: { type: String },
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
        color: { type: String },
      },
    ],
    history: [{ elements: Array, stickyNotes: Array }],
  },
  { timestamps: true }
);

export default mongoose.models.Whiteboard || mongoose.model<IWhiteboard>('Whiteboard', WhiteboardSchema);
