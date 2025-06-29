import { NextResponse, NextRequest } from "next/server";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from "@/app/api/_lib/db";
import { User } from "@/models";

export async function POST(req: NextRequest) {
  await connectDB();

  type Data = { 
  email: string,
  password: string,
  name: string
}
  // Await the JSON parsing of request body

  const body:Data = await req.json();
  const {email,name,password}= body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return NextResponse.json({ message: "User already exists!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, password: hashedPassword, name });
    await user.save();

    // Make sure NEXTAUTH_SECRET exists
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is not set in environment variables");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      secret,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      message: "User registered successfully!",
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
