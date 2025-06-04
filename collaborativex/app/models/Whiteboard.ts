import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiteboard extends Document {
  name: string;
  purpose: string;
  collaborators: Array<string>;
  isFavorite: boolean;
  owner: mongoose.Types.ObjectId;
  elements: Array<{
    id: string;
    type: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'text';
    points: Array<{ x: number; y: number }>;
    color: string;
    lineWidth: number;
    shapeType?:
      | 'rectangle'
      | 'circle'
      | 'line'
      | 'triangle'
      | 'diamond'
      | 'star'
      | 'arrowRight'
      | 'arrowLeft'
      | 'arrowUp'
      | 'arrowDown'
      | 'heart'
      | 'pentagon'
      | 'hexagon'
      | 'heptagon'
      | 'octagon'
      | 'cross'
      | 'smiley'
      | 'cloud';
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
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
  history: Array<{
    elements: Array<{
      id: string;
      type: 'pen' | 'eraser' | 'highlighter' | 'shape' | 'text';
      points: Array<{ x: number; y: number }>;
      color: string;
      lineWidth: number;
      shapeType?:
        | 'rectangle'
        | 'circle'
        | 'line'
        | 'triangle'
        | 'diamond'
        | 'star'
        | 'arrowRight'
        | 'arrowLeft'
        | 'arrowUp'
        | 'arrowDown'
        | 'heart'
        | 'pentagon'
        | 'hexagon'
        | 'heptagon'
        | 'octagon'
        | 'cross'
        | 'smiley'
        | 'cloud';
      text?: string;
      fontSize?: number;
      fontFamily?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
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
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const WhiteboardSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    collaborators: [{ type: String }],
    isFavorite: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    elements: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: ['pen', 'eraser', 'highlighter', 'shape', 'text'],
          required: true,
        },
        points: [{ x: { type: Number, required: true }, y: { type: Number, required: true } }],
        color: { type: String, required: true },
        lineWidth: { type: Number, required: true },
        shapeType: {
          type: String,
          enum: [
            'rectangle',
            'circle',
            'line',
            'triangle',
            'diamond',
            'star',
            'arrowRight',
            'arrowLeft',
            'arrowUp',
            'arrowDown',
            'heart',
            'pentagon',
            'hexagon',
            'heptagon',
            'octagon',
            'cross',
            'smiley',
            'cloud',
          ],
        },
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
        content: { type: String, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        color: { type: String, required: true },
      },
    ],
    history: [
      {
        elements: [
          {
            id: { type: String, required: true },
            type: {
              type: String,
              enum: ['pen', 'eraser', 'highlighter', 'shape', 'text'],
              required: true,
            },
            points: [
              { x: { type: Number, required: true }, y: { type: Number, required: true } },
            ],
            color: { type: String, required: true },
            lineWidth: { type: Number, required: true },
            shapeType: {
              type: String,
              enum: [
                'rectangle',
                'circle',
                'line',
                'triangle',
                'diamond',
                'star',
                'arrowRight',
                'arrowLeft',
                'arrowUp',
                'arrowDown',
                'heart',
                'pentagon',
                'hexagon',
                'heptagon',
                'octagon',
                'cross',
                'smiley',
                'cloud',
              ],
            },
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
            content: { type: String, required: true },
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            width: { type: Number, required: true },
            height: { type: Number, required: true },
            color: { type: String, required: true },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Whiteboard || mongoose.model<IWhiteboard>('Whiteboard', WhiteboardSchema);
