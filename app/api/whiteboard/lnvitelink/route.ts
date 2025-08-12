import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import User from "../../models/User";
import Whiteboard from "../../models/Whiteboard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { whiteboardId, owner } = body;
    console.log(owner)

    if (!whiteboardId || !owner) {
      return NextResponse.json(
        { success: false, message: "Missing whiteboardId or owner" },
        { status: 400 }
      );
    }

    if (!process.env.NEXTAUTH_SECRET || !process.env.BASE_URL) {
      return NextResponse.json(
        { success: false, message: "Server config missing" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { whiteboardId, owner, role: "invitee" },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: "1h" }
    );

    const inviteLink = `${process.env.BASE_URL}/whiteboard/${whiteboardId}?inviteetoken=${token}`;



    // ✅ Generate base64 image of QR code
    const qrCodeImage = await QRCode.toDataURL(inviteLink);

    const whiteboardShared = await Whiteboard.findOneAndUpdate(
      { _id: whiteboardId },               // Filter
      { $set: { isShared: true } },        // Update
      { new: true }                        // Options: return updated document
    );


    return NextResponse.json({
      success: true,
      message: "QR code generated successfully",
      inviteLink,
      qrCodeImage,
    });
  } catch (error) {
    console.error("QR code generation failed:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
