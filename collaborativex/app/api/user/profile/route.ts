import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/api/_lib/db";
import User from "../../models/User";
import Whiteboard from "../../models/Whiteboard";
import { authenticate } from "../../_lib/authMiddleware";
import { POST } from "../../whiteboard/route";
import { AwardIcon } from "lucide-react";

type AuthenticatedUser = { userId: string };

export async function GET(req: NextRequest) {
    await connectDB();
    const authResult = await authenticate(req);


    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult as AuthenticatedUser;

    const user = await User.findById(userId).select("-password");

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {

    await connectDB();
    const authResult = await authenticate(req);

    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult as AuthenticatedUser;

    const body = await req.json();
    const allowedFields = ['name', 'bio','email', 'location', 'website', 'profilePicture'];
    const updates: any = {};
    
    allowedFields.forEach(field => {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    })

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    return NextResponse.json(updatedUser);

}
