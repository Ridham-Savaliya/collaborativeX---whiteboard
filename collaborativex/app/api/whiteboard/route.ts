import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/api/_lib/db";
import Whiteboard from "@/app/models/Whiteboard";
import User from "@/app/models/User";
import { authenticate } from "../_lib/authMiddleware";


export async function POST(req: NextRequest, res: NextResponse) {
  await connectDB();

  const authResult: any = await authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;
  const body = await req.json();
  const { name, purpose, collaborators } = body;

  if (!name || !purpose) {
    return NextResponse.json({ message: "Name and purpose are required" }, { status: 400 });
  }

  // Sanitize collaborators: split comma-separated strings, trim, filter
  const rawCollaborators = Array.isArray(collaborators) ? collaborators : [collaborators];

  // Sanitize collaborators: split comma-separated strings, trim, filter
  const collaboratorsArray = rawCollaborators
    .flatMap(item =>
      typeof item === "string" ? item.split(",") : []
    )
    .map(email => email.trim())
    .filter(email =>
      email &&
      email.includes("@") &&
      !email.endsWith(",") &&
      email.length > 5
    );

  const newWhiteboard = new Whiteboard({
    name,
    purpose,
    collaborators: collaboratorsArray,
    isFavorite: false,
    owner: user.userId,
    elements: [],
    stickyNotes: [],
    history: [],
  });

  await newWhiteboard.save();

  const userRecord = await User.findByIdAndUpdate(
    user.userId,
    {
      $push: {
        whiteboards: newWhiteboard._id,
      },  
      $set:{isOnboarded:true},
      ...(collaboratorsArray.length
        ? {
          $addToSet: {
            invitees: { $each: collaboratorsArray },
          },

        }
        : {}),
      $inc: { "stats.whiteboards": 1 },
    },
    { new: true }
  );

  // Now manually increment collaborations if collaborators exist
  if (collaborators?.length) {
    userRecord.stats.collaborations += 1;
    await userRecord.save();
  }

  return NextResponse.json({ whiteboard: newWhiteboard }, { status: 201 });
}


export async function GET(req: NextRequest) {
  await connectDB();
  type AuthResult = { userId: string } | NextResponse;

  const authResult: any = await authenticate(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const owner = authResult.userId;

  const whiteboards = await Whiteboard.find({ owner: owner }).select('name purpose collaborators isFavorite createdAt updatedAt')

  return NextResponse.json({ message: "Whiteboards for the user has been found!", whiteboards: whiteboards }, { status: 200 })

}

export async function DELETE(req: NextRequest) {
  await connectDB();
  const authResult: any = await authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const whiteboardId: string = body.whiteboardId;

  const deleteWhiteboard = await Whiteboard.deleteOne({ _id: whiteboardId, owner: authResult.userId })
  if (deleteWhiteboard.deletedCount === 0) {
    return NextResponse.json({ message: "No whiteboard found or not authorized!" }, { status: 404 });
  }


  await User.findByIdAndUpdate(authResult.userId, {
    $pull: { whiteboards: whiteboardId },
    $inc: { 'stats.whiteboards': -1 }
  })

  return NextResponse.json({ message: "whiteboard deleted successfully!", deleteWhiteboard }, { status: 200 })
}

