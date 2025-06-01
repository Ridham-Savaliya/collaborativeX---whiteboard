// app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/app/utills/generateOTP";
import { sendMail } from "@/app/utills/sendMail";
import User from "@/app/models/User";
import OTP from "@/app/models/OTP";
import connectDB from "@/app/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  await connectDB();

  const { email }: { email: string } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, message: "Email is required!" }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found!" }, { status: 404 });
  }

  const generatedOtp = generateOTP();
  const hashedOtp = await bcrypt.hash(generatedOtp, 10);

  const otpRecord = await OTP.create({ userId: user._id, otp: hashedOtp });
  const otpId = otpRecord._id;

  await sendMail(
    email,
    "Your OTP for Reset Password",
    `... your HTML with OTP code: <b>${generatedOtp}</b> ...`
  );

  return NextResponse.json({
    success: true,
    message: "OTP sent to your email.",
    otpId,
  });
}
