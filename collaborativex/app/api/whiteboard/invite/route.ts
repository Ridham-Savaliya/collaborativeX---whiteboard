import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/api/_lib/db";
import Whiteboard from "../../models/Whiteboard";
import { authenticate } from "../../_lib/authMiddleware";
import { sendMail } from "@/app/utills/sendMail";

export async function POST(req: NextRequest) {
  await connectDB();

  const authResult: any = await authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult.name;

  const body = await req.json();
  const { WhiteboardId, inviteeData } = body;

  // Validate input
  if (!WhiteboardId || !inviteeData || !Array.isArray(inviteeData)) {
    return NextResponse.json({ message: "Invalid request data" }, { status: 400 });
  }

   inviteeData
  .flatMap((item: string) => item.split(","))
  .map((email: string) => email.trim())
  .filter((email: string) => email.length > 0); // optional: remove empty strings

  // Find the whiteboard
  const isWhiteboardExist = await Whiteboard.findById({ _id: WhiteboardId });

  if (!isWhiteboardExist) {
    return NextResponse.json({ message: "Whiteboard not found" }, { status: 404 });
  }

  // Merge new invitees into collaborators list
  const preinvitees: string[] = isWhiteboardExist.collaborators || [];
  const newInvitees = [...new Set([...preinvitees, ...inviteeData])]; // remove duplicates
  isWhiteboardExist.collaborators = newInvitees;
  isWhiteboardExist.isShared = true;

  await isWhiteboardExist.save();

  // Send invite email to each invitee
  inviteeData.forEach((email: string) => {
    const invitationLink = `https://collaborativex-whiteboard.vercel.app/whiteboard/${isWhiteboardExist._id}?collaborator=${email}`;

    sendMail(
      email,
      "CollaborativeX has invited you to collaborate on Whiteboard",
      `
     <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invite to Collaborate – CollaborativeX</title>
</head>
<body style="margin:0;padding:0;background:#f0f2ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2ff;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#8b5cf6,#7c3aed,#6d28d9);"></td>
          </tr>
          <tr>
            <td align="center" style="background:#9325ec;padding:40px;">
              <img src="https://res.cloudinary.com/dzrzfsu9u/image/upload/v1748849092/promotions/v2vqh2xjmdemfqsqnhpb.png" alt="CollaborativeX Logo" style="max-width: 150px; height: auto; margin-bottom: 24px;" />
              <h1 style="font-family:sans-serif;font-size:28px;color:#ffffff;margin:16px 0 8px;">CollaborativeX</h1>
              <p style="font-family:sans-serif;color:#ffffff;font-size:16px;margin:0;">🎨 Next‑Gen Whiteboard Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;font-family:sans-serif;color:#1a1a1a;">
              <h2 style="font-size:24px;margin-bottom:16px;">You're Invited to Create Magic!</h2>
              <p style="font-size:16px;line-height:1.5;margin-bottom:24px;">
                <strong style="color:#8b5cf6;">${user}</strong> has invited you to join an exclusive whiteboard collaboration session on CollaborativeX — where ideas come to life in real time.
              </p>
              <table align="center" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="border-radius:20px;" bgcolor="#9e34f7">
                    <a href="${invitationLink}" target="_blank" style="display:inline-block;padding:16px 32px;font-family:sans-serif;font-size:16px;color:#ffffff;font-weight:600;text-decoration:none;border-radius:20px;">
                      Join the Creative Session
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;font-family:sans-serif;margin-top:32px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <strong style="font-size:18px;color:#1f2937;">${isWhiteboardExist.purpose}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;line-height:1.5;color:#6b7280;">
                    Join our creative brainstorming session: sketch ideas, design wireframes, and collaborate in real time.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9ff;padding:30px;text-align:center;font-family:sans-serif;font-size:12px;color:#6b7280;">
              <p style="margin-bottom:16px;font-size:14px;color:#1f2937;font-weight:600;">Join over 50,000+ teams revolutionizing collaboration</p>
              <a href="#" style="color:#8b5cf6;text-decoration:none;margin:0 8px;">Help Center</a>|
              <a href="#" style="color:#8b5cf6;text-decoration:none;margin:0 8px;">Community</a>|
              <a href="#" style="color:#8b5cf6;text-decoration:none;margin:0 8px;">Privacy Policy</a>|
              <a href="#" style="color:#8b5cf6;text-decoration:none;">Unsubscribe</a>
              <p style="margin-top:20px;color:#9ca3af;">© 2025 CollaborativeX. Made with ❤️ by Ridham Savaliya.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    );
  });

  return NextResponse.json(
    { message: "Invitation to collaborators has been sent via emails!" ,inviteeData},
    
    { status: 200 }
  );
}
