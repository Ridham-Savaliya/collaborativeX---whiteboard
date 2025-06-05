import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export async function authenticate(req: NextRequest) {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ message: "Unauthorized,No token!" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!)

        return decoded
    } catch (error) {
        return NextResponse.json({ message: "Unauthorized: Invalid token" }, { status: 401 })
    }

}
