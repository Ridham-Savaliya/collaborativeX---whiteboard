// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/app/api/_lib/db";
import OTP from "@/models/OTP";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await connectDB();

  const { otpId, verificationCode, newPassword, cPassword } = await req.json();

  if (!otpId || !verificationCode || !newPassword || !cPassword) {
    return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
  }

  const otpRecord = await OTP.findById(otpId);
  if (!otpRecord) {
    return NextResponse.json({ success: false, message: "Invalid or expired OTP." }, { status: 400 });
  }

  const isMatch = await bcrypt.compare(verificationCode, otpRecord.otp);
  if (!isMatch) {
    return NextResponse.json({ success: false, message: "Incorrect OTP." }, { status: 401 });
  }

  const user = await User.findById(otpRecord.userId);
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
  }

  const samePassword = await bcrypt.compare(newPassword, user.password);
  if (samePassword) {
    return NextResponse.json({ success: false, message: "New password should be different." }, { status: 400 });
  }

  if (newPassword !== cPassword) {
    return NextResponse.json({ success: false, message: "Passwords do not match." }, { status: 400 });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  await OTP.findByIdAndDelete(otpId);

  return NextResponse.json({ success: true, message: "Password updated successfully." });
}
