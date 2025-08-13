import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/api/_lib/db";
import Whiteboard from "../../models/Whiteboard";
import { authenticate } from "../../_lib/authMiddleware";

export async function POST(req: NextRequest) {
    await connectDB();

    const authResult: any = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    const body = await req.json();
    const { whiteboardId } = body;

    try {
        if (!whiteboardId) {
            return NextResponse.json({ message: "whiteboardId is required" }, { status: 400 })
        }

        const isAccessible = await Whiteboard.findById(whiteboardId);

        const isOwner = isAccessible?.owner?.toString() === user.userId;

        if (!isAccessible || (!isAccessible.isShared && !isOwner)) {
            return NextResponse.json(
                {
                    message: "whiteboard is not accessible",
                    reason: "not_authorized",
                },
                { status: 401 }
            );
        }


        return NextResponse.json({ message: "user is authorized to access the whiteboard", success: true }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: error.data.message }, { status: 500 })
    }

}
