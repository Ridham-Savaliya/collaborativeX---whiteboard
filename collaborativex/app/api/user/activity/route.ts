import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/api/_lib/db';
import User from '@/app/models/User';
import { authenticate } from '../../_lib/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import Whiteboard from '@/app/models/Whiteboard';

type AuthenticatedUser = { userId: string };

export async function POST(req: NextRequest) {
    await connectDB();
    const authResult = await authenticate(req);

    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult as AuthenticatedUser;

    const user = await User.findById(userId);

    if (!user || user.whiteboards.length === 0) {
        return NextResponse.json({ history: [] });
    }

    const whiteboards = await Whiteboard.find({ _id: { $in: user.whiteboards } })
        .sort({ updatedAt: -1 })
        .limit(8)
        .select("name purpose createdAt updatedAt collaborators owner")

    const history = whiteboards.map((wb) => {
        const isOwner = String(wb.owner) === String(userId);
        const isUpdated = wb.createdAt.getTime() !== wb.updatedAt.getTime();
        const isShared = wb.collaborators?.length > 0;
        const isJustCreated = wb.createdAt.getTime() === wb.updatedAt.getTime();

        let type = "created";
        let description = `Created a new whiteboard for ${wb.purpose.toLowerCase()}`;

        if (!isOwner) {
            type = 'collaborated';
            description = `Collaborated with team on ${wb.name}`;
        } else if (isJustCreated) {
            // Keep type as "created"
        } else if (isUpdated) {
            type = 'edited';
            description = `Made updates to ${wb.name}`;
        } else if (isShared) {
            type = 'shared';
            description = `Shared whiteboard with collaborators: ${wb.collaborators.slice(0, 2).join(', ')}`;
        }


        return {
            id: uuidv4(),
            type,
            title: wb.name,
            description,
            timestamp: wb.updatedAt,
        };
    });

    // ✅ Only add truly new entries
    const existingActivities = user.recentActivity || [];

    const newHistory = history.filter((newItem) => {
        return !existingActivities.some((oldItem: any) =>
            oldItem.title === newItem.title &&
            oldItem.type === newItem.type &&
            new Date(oldItem.timestamp).getTime() === new Date(newItem.timestamp).getTime()
        );
    });

    if (newHistory.length > 0) {
        user.recentActivity = [
            ...newHistory,
            ...existingActivities,
        ].slice(0, 20); // Keep only 20 most recent
        await user.save();
    }

    return NextResponse.json({ history: user.recentActivity });

}
