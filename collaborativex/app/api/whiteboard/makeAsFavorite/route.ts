import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import Whiteboard from "@/app/models/Whiteboard";
import { authenticate } from "../../_lib/authMiddleware";

export async function PATCH(req: NextRequest) {
    await connectDB();
    const authResult: any = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const whiteboardId: string = body.whiteboardId;

    const updateWhiteboard = await Whiteboard.findByIdAndUpdate({ _id: whiteboardId }, { isFavorite: true },{new:true})

    return NextResponse.json({ message: "Whiteboard marked as favorite!",updateWhiteboard, status: 200 }, { status: 200 })

}
