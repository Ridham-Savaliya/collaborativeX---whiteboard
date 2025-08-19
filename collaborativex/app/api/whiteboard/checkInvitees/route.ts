import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../../models/User";
import Whiteboard from "../../models/Whiteboard";
import connectDB from "../../_lib/db";


export async function POST(req: NextRequest) {
    await connectDB();

    const body = await req.json();
    const { token, email } = body;

    if (!token || !email) {
        return NextResponse.json(
            { message: "token and email are required" },
            { status: 400 }
        );
    }

    // check if user exists
    const isInviteeExist = await User.findOne({ email }).select("_id");
    const isExisted = !!isInviteeExist;

    let inviteeRole;

    try {
        const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        inviteeRole = decoded.role;
        const whiteboardId = decoded.whiteboardId;


        const ownerWhiteboard = await Whiteboard.findById(whiteboardId);
        if (!ownerWhiteboard) {
            return NextResponse.json(
                { message: "whiteboard not found", success: false },
                { status: 404 }
            );
        }

        // add collaborator (no duplicates)
        await Whiteboard.findByIdAndUpdate(whiteboardId, {
            $addToSet: { collaborators: email },
        });
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            return NextResponse.json(
                { message: "invite link has expired", success: false },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { message: "invite token is not valid", success: false },
            { status: 401 }
        );
    }

    return NextResponse.json(
        { message: "inviteLink is verified successfully", isExisted, inviteeRole },
        { status: 200 }
    );
}
