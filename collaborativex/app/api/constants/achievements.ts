// app/constants/achievements.ts
import User from "@/models/User";
import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/app/api/_lib/db";
import { authenticate } from "../_lib/authMiddleware";
import { v4 as uuidv4 } from "uuid"


const id = uuidv4();

export const ACHIEVEMENT_PRESETS = [
    {
        id: 'First Whiteboard',
        title: 'First Whiteboard',
        description: 'Created your first whiteboard',
        icon: '🎨',
        condition: (user: any) => user.stats.whiteboards >= 1,
    },
    {
        id: 'Collaborator',
        title: 'Collaborator',
        description: 'Invited 10 people to collaborate',
        icon: '🤝',
        condition: (user: any) => (user.invitees?.length || 0) >= 10,
    },
    {
        id: 'Creative Streak',
        title: 'Creative Streak',
        description: 'Used the platform for 30 consecutive days',
        icon: '🔥',
        condition: (user: any) => {
            const createdAt = new Date(user.createdAt);
            const today = new Date();

            const diffInTime = today.getTime() - createdAt.getTime();
            const diffInDays = diffInTime / (1000 * 3600 * 24);

            return diffInDays >= 30;
        },
    },
    {
        id: 'Master Creator',
        title: 'Master Creator',
        description: 'Created 50 whiteboards',
        icon: '👑',
        condition: (user: any) => user.stats.whiteboards >= 50,
    },
];
