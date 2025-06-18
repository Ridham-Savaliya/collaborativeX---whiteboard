import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiteboard extends Document {
  name: string;
  purpose: string;
  collaborators: Array<string>;
  isFavorite: boolean;
  isShared: boolean,
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
    purpose: {
      type: String, required: true,
      enum: [
        "Project Planning",
        "Team Brainstorm",
        "Design Sprint",
        "Strategy Session",
        "Other"
      ]
    },
    isShared: { type: Boolean, default: false },
    collaborators: [{ type: String }],
    isFavorite: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    elements: [
      {
        id: { type: String, required: false },
        type: {
          type: String,
          enum: ['pen', 'eraser', 'highlighter', 'shape', 'text'],
          required: false,
        },
        points: [{ x: { type: Number, required: false }, y: { type: Number, required: false } }],
        color: { type: String, required: false },
        lineWidth: { type: Number, required: false },
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
        id: { type: String, required: false },
        content: { type: String, required: false },
        x: { type: Number, required: false },
        y: { type: Number, required: false },
        width: { type: Number, required: false },
        height: { type: Number, required: false },
        color: { type: String, required: false },
      },
    ],
    history: [
      {
        elements: [
          {
            id: { type: String, required: false },
            type: {
              type: String,
              enum: ['pen', 'eraser', 'highlighter', 'shape', 'text'],
              required: false,
            },
            points: [
              { x: { type: Number, required: false }, y: { type: Number, required: false } },
            ],
            color: { type: String, required: false },
            lineWidth: { type: Number, required: false },
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
            id: { type: String, required: false },
            content: { type: String, required: false },
            x: { type: Number, required: false },
            y: { type: Number, required: false },
            width: { type: Number, required: false },
            height: { type: Number, required: false },
            color: { type: String, required: false },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Whiteboard || mongoose.model<IWhiteboard>('Whiteboard', WhiteboardSchema);
