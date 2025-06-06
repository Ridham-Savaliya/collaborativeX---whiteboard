import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import { authenticate } from '../../../_lib/authMiddleware';
import { v4 as uuidv4 } from 'uuid';


// Helper to convert 'Xh Ym' string to total seconds
function timeStringToSeconds(timeStr: string): number {
    if (!timeStr || typeof timeStr !== 'string') return 0;

    const match = timeStr.match(/(\d+)h\s*(\d+)?m?/);
    if (!match) return 0;

    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    return hours * 3600 + minutes * 60;
}


// Convert seconds back into 'Xh Ym' string format
function secondsToTimeString(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);        // Get full hours
    const minutes = Math.floor((totalSeconds % 3600) / 60); // Get leftover minutes
    return `${hours}h ${minutes}m`;                        // Format string nicely
}

export async function POST(req: NextRequest) {
    await connectDB();
    const auth: any = await authenticate(req);
    if (auth instanceof NextResponse) return auth;

    const { sessionDurationSeconds } = await req.json();
    const user = await User.findById(auth.userId);
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    // Get current total time spent, convert it to seconds
    const currentSeconds = user.stats.timeSpent ? timeStringToSeconds(user.stats.timeSpent) : '0h';

    // Add this session's seconds to total
    const updatedSeconds = currentSeconds + sessionDurationSeconds;

    // Convert total seconds back to string and save
    user.stats.timeSpent = secondsToTimeString(updatedSeconds);

    await user.save();  // Save user data back to DB

    console.log("Time string:", user.stats.timeSpent);
    console.log("Session duration:", sessionDurationSeconds);


    // Respond success with updated total time spent
    return NextResponse.json({ message: 'Time spent updated', timeSpent: user.stats.timeSpent });

}
