import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Collaborativex app is alive ✅",
    timestamp: new Date().toISOString(),
  });
}
