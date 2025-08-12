import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../../models/User";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { token, email } = body;

    if (!token || !email) {
        return NextResponse.json(
            { message: "token and email are required" },
            { status: 400 }
        );
    }

    // Check if user exists
    const isInviteeExist = await User.findOne({ email }).select('_id');
    const isExisted = !!isInviteeExist;

    // Check if token is valid and not expired
    let inviteeRole
    try {
        const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        inviteeRole = decoded.role;
        // optionally: check email in token matches the request email
        // if (decoded.email !== email) return error
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
