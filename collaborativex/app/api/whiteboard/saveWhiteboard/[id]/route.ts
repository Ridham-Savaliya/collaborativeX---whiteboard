import Whiteboard from '@/app/api/models/Whiteboard';
import connectDB from '../../../_lib/db';
import { authenticate } from '../../../_lib/authMiddleware';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const { whiteboardId, elements, stickyNotes } = await req.json();
    if (!whiteboardId || !Array.isArray(elements) || !Array.isArray(stickyNotes)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const whiteboard = await Whiteboard.findOneAndUpdate(
      { _id: whiteboardId },
      { elements, stickyNotes, updatedAt: Date.now() },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: 'Whiteboard saved successfully', whiteboard });
  } catch (error) {
    console.error('Error saving whiteboard:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  try {
    const { id } = params;
    const whiteboard = await Whiteboard.findById(id);
    if (!whiteboard) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }
    return NextResponse.json({
      whiteboardId: whiteboard._id,
      elements: whiteboard.elements,
      stickyNotes: whiteboard.stickyNotes,
    });
  } catch (error) {
    console.error("Error fetching whiteboard:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
