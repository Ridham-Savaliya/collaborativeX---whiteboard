import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/api/_lib/db";
import Whiteboard from "@/models/Whiteboard";
import User from "@/models/User";
import { authenticate } from "../../_lib/authMiddleware";

export async function POST(req: NextRequest) {

    await connectDB();
    const authResult: any = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    // const { email } = authResult;
    const body = await req.json();
    const { email, WhiteboardId } = body;

    if (!email || !WhiteboardId) {
        return NextResponse.json({ message: "email and WhiteboardId is required!" })
    }

    const isRegistered = await User.findOne({ email });

    if (!isRegistered) {
        return NextResponse.json({ message: "user is not Registered" })

    }

    const isInvited = await Whiteboard.findOne({
        _id: WhiteboardId,
        collaborators: email,
    });

    if (!isInvited) {
        return NextResponse.json({ message: "user is not invited to this whiteboard" })
    }


    return NextResponse.json({ message: "user is eligible to collaborate!", email })

}
