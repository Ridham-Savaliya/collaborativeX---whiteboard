import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask {
  id: string;
  content: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface IColumn {
  id: string;
  title: string;
  color: string;
  tasks: ITask[];
}

export interface IKanbanBoard extends Document {
  whiteboard: string;
  columns: Map<string, IColumn>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    id: { type: String, required: true, unique: true },
    content: { type: String, required: true, trim: true },
    createdAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    tags: [{ type: String, trim: true }],
  },
  { _id: false }
);

const ColumnSchema = new Schema<IColumn>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    tasks: { type: [TaskSchema], default: [] },
  },
  { _id: false }
);

const KanbanBoardSchema = new Schema<IKanbanBoard>(
  {
    whiteboard: {
      type: String,
      required: true,
      trim: true,
      index: true, // Only declare index once
    },
    columns: {
      type: Map,
      of: ColumnSchema,
      required: true,
      validate: {
        validator: (columns: Map<string, IColumn>) => {
          const required = ['todo', 'inProgress', 'done'];
          return required.every((col) => columns.has(col));
        },
        message: 'Kanban board must have todo, inProgress, and done columns',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // manually handled
  }
);

// Avoid duplicate index declarations
// Only declare once for each field
KanbanBoardSchema.index({ updatedAt: -1 });

// Middleware to auto-update `updatedAt`
KanbanBoardSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

KanbanBoardSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Helpers for safe conversion
KanbanBoardSchema.statics.convertMapToObject = function (
  columnsMap: Map<string, IColumn>
): Record<string, IColumn> | null {
  if (!(columnsMap instanceof Map)) return null;
  try {
    return Object.fromEntries(columnsMap);
  } catch (err) {
    console.error("Error converting Map to Object:", err);
    return null;
  }
};

KanbanBoardSchema.statics.convertObjectToMap = function (
  columnsObj: Record<string, IColumn>
): Map<string, IColumn> | null {
  if (!columnsObj || typeof columnsObj !== 'object') return null;
  try {
    return new Map(Object.entries(columnsObj));
  } catch (err) {
    console.error("Error converting Object to Map:", err);
    return null;
  }
};

const KanbanBoard: Model<IKanbanBoard> = mongoose.model('KanbanBoard', KanbanBoardSchema);

export default KanbanBoard;
