import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/app/api/_lib/db";
import User from "../../models/User";

export async function POST(req: NextRequest) {
  await connectDB();

  type Data = {
    email: string;
    password: string;
  };

  const data: Data = await req.json();
  const { email, password } = data;

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const isExisted = await User.findOne({ email });
  if (!isExisted) {
    return NextResponse.json({ message: "User not found!" }, { status: 404 });
  }


  // Check if the user has a password (i.e., not an OAuth-only account)
  if (!isExisted.password) {
    return NextResponse.json(
      { message: "This account uses OAuth. Please log in with your OAuth provider." },
      { status: 400 }
    );
  }

  const checkPassword = await bcrypt.compare(password, isExisted.password);
  if (!checkPassword) {
    return NextResponse.json({ message: "Invalid credentials!" }, { status: 400 });
  }

  const token = jwt.sign(
    { userId: isExisted._id, email: isExisted.email, name: isExisted.name },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "1h" }
  );

  return NextResponse.json(
    { token, name: isExisted.name, RideOffered: isExisted?.RideOffered ?? false, message: "Login successfully!" },
    { status: 200 },
  );
}