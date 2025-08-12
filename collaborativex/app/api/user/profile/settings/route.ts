import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/api/_lib/db";
import User from "@/app/api/models/User";
import { authenticate } from "@/app/api/_lib/authMiddleware";


export async function PATCH(req: NextRequest) {
    try {
        await connectDB();

        const authResult = await authenticate(req);
        if (authResult instanceof NextResponse) return authResult;

        const { userId } = authResult as { userId: string };

        const body = await req.json();
        const { theme, notifications, privacy, language } = body;

        const preferences = {
            theme: theme ?? "light",
            notifications: notifications ?? true,
            privacy: privacy ?? "public",
            language: language ?? "en",
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { preferences },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        return NextResponse.json({
            message: "Preferences have been updated successfully!",
            preferences: updatedUser.preferences,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "An error occurred.", error }, { status: 500 });
    }
}
