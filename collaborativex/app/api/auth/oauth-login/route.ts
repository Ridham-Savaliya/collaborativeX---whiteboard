import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/api/_lib/db";
import User from "../../models/User";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  await connectDB();
  const { email, name, provider, providerId } = await req.json();
  if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email, name: name || email.split("@")[0], provider, providerId });
    await user.save();
  }

  const token = jwt.sign({ userId: user._id, email: user.email, name: user.name }, process.env.NEXTAUTH_SECRET!, { expiresIn: "1h" });
  return NextResponse.json({ token, user: { id: user._id, email: user.email, name: user.name } });
}