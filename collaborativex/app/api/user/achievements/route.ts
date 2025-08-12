import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/api/_lib/db';
import User from '../../models/User';
import { authenticate } from '../../_lib/authMiddleware';
import { ACHIEVEMENT_PRESETS } from "../../constants/achievements";

type AuthenticatedUser = { userId: string };

export async function POST(req: NextRequest) {
  await connectDB();
  const authResult = await authenticate(req);

  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult as AuthenticatedUser;

  const user = await User.findById(userId);

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const alreadyUnlocked = new Set(user.achievements?.map((a: any) => a.id));

  // Filter new achievements
  const newAchievements = ACHIEVEMENT_PRESETS.filter((achievement) => {
    return !alreadyUnlocked.has(achievement.id) && achievement.condition(user);
  });

  // Prepare new achievement data
  const insertData = newAchievements.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: true,
    date: new Date(),
  }));

  // Add to user if there are new achievements
  let updatedUser = user;

  if (insertData.length > 0) {
    updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          achievements: { $each: insertData },
        },
        $inc: { 'stats.achievements': insertData.length },
      },
      { new: true, projection: { achievements: 1 } }
    );
  }

  return NextResponse.json(
    {
      message: insertData.length > 0
        ? "New achievements unlocked!"
        : "No new achievements.",
      achievements: updatedUser.achievements, // send full list
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {

  await connectDB();
  const authResult = await authenticate(req);

  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult as AuthenticatedUser;

  const user = await User.findById(userId);

  if (!user) {
    return NextResponse.json({ message: "User is not authenticated!" })
  }

  return NextResponse.json({ success: true, message: "Achievements Fetched successfully!", ACHIEVEMENT_PRESETS })

}
