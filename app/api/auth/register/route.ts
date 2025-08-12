import { NextResponse, NextRequest } from "next/server";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from "@/app/api/_lib/db";
import User from "../../models/User";

export async function POST(req: NextRequest) {
  await connectDB();

  type Data = { 
    email: string,
    password?: string,
    name: string,
    oauthProvider?: {
      provider: string,
      providerId: string
    }
  }

  const body: Data = await req.json();
  const { email, name, password, oauthProvider } = body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return NextResponse.json({ message: "User already exists!" }, { status: 400 });
    }

    const userData: any = { 
      email, 
      name,
      oauthVerified: !!oauthProvider
    };

    // For regular registration, password is required
    if (!oauthProvider) {
      if (!password) {
        return NextResponse.json({ message: "Password is required for regular registration" }, { status: 400 });
      }
      userData.password = await bcrypt.hash(password, 10);
    }

    // For OAuth registration, add provider info
    if (oauthProvider) {
      userData.oauthProviders = [{
        provider: oauthProvider.provider,
        providerId: oauthProvider.providerId,
        verifiedAt: new Date()
      }];
    }

    user = new User(userData);
    await user.save();

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