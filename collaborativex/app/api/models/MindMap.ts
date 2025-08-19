// models/MindMap.js
import mongoose from "mongoose";

const mindMapSchema = new mongoose.Schema({
  whiteboardId: { type: String, required: true, unique: true },
  nodes: { type: Array, default: [] },
  edges: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.MindMap || mongoose.model("MindMap", mindMapSchema);
