import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Whiteboard,User } from "@/models";
import jwt from 'jsonwebtoken'
import connectDB from "@/app/api/_lib/db";

export async function POST(req: NextRequest) {

    await connectDB();
    type Data = {
        email: String,
        password: String
    }

    const data: Data = await req.json();
    const { email, password } = data;
    const isExisted = await User.findOne({ email });
    if (!isExisted) {
        return NextResponse.json({ message: "user not found!" }, { status: 404 })
    }

    const checkPassword = await bcrypt.compare(password as any, isExisted.password)
    if (!checkPassword) {
        return NextResponse.json({ message: "invalid credentials!" }, { status: 400 })
    } 

    const token = jwt.sign(
      { userId: isExisted._id, email: isExisted.email, name: isExisted.name },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: '1h' })

    return NextResponse.json({ token, message: "Login successfully!" }, { status: 200 });

}
