import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import { authenticate } from '../../_lib/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import Whiteboard from '@/app/models/Whiteboard';
import {ACHIEVEMENT_PRESETS} from "../../constants/achievements"


type AuthenticatedUser = { userId: string };

export async function unlockAchievements(req: NextRequest) {

    await connectDB();
    const authResult = await authenticate(req);

    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult as AuthenticatedUser;

    const user = await User.findById({_id:userId})

   const alreadyUnlocked = new Set(user.achievements?.map((a:any)=>a.id));

   const newAchievements  = ACHIEVEMENT_PRESETS.filter((achievement)=>{
    return !alreadyUnlocked.has(achievement.id) && achievement.condition(user)
   })

     if (newAchievements.length === 0) return; // nothing new to unlock

     const insertData = newAchievements.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: true,
    date: new Date(),
  }));

   await User.findByIdAndUpdate(userId, {
    $push: { achievements: { $each: insertData } },
    $inc: { 'stats.achievements': insertData.length },
  });

}
