import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/api/_lib/db';
import User from '../../models/User';
import { authenticate } from '../../_lib/authMiddleware';

type AuthenticatedUser = { userId: string };

export async function POST(req: NextRequest) {
    await connectDB();
    const authResult = await authenticate(req);

    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult as AuthenticatedUser;

    const user = await User.findById(userId);

    if (user) {
        user.RideOffered = true;   // assign directly
        await user.save();         // save to DB
    }

    return NextResponse.json({ message: 'User got their whiteboard onboarding guide-tour', success: true }, { status: 200 })
}