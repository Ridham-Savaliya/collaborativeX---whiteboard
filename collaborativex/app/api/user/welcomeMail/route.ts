import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/api/_lib/db';
import User from '../../models/User';
import { authenticate } from '../../_lib/authMiddleware';
import { sendMail } from '@/app/utills/sendMail';


type AuthenticatedUser = { email: string, name: string };

export async function POST(req: NextRequest) {
    await connectDB();
    const authResult = await authenticate(req);

    if (authResult instanceof NextResponse) return authResult;

    const { email, name } = authResult as AuthenticatedUser;

    await sendMail(email, 'Welcome to CollaborativeX', `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to CollaborativeX</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8f7fc;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f7fc; padding: 20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 4px 14px rgba(0,0,0,0.1); overflow:hidden; font-family:Arial, sans-serif;">
            <!-- Header -->
            <tr>
              <td align="center" style="background-color:#8f06ee; padding:40px 20px;">
                <h1 style="color:#ffffff; font-size:30px; margin:0;">Welcome to CollaborativeX 🚀</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;">
                <h2 style="color:#8f06ee; font-size:22px; margin:0 0 15px 0;">Hello,${name}</h2>
                <p style="font-size:16px; color:#333333; line-height:1.6; margin:0 0 15px 0;">
                  Thank you for signing up to <strong>CollaborativeX</strong> — your new favorite place for real-time whiteboard collaboration and visual brainstorming.
                </p>
                <p style="font-size:16px; color:#333333; line-height:1.6; margin:0 0 15px 0;">
                  We built this platform to empower people like you to collaborate effortlessly and turn ideas into action.
                </p>

                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
                  <tr>
                    <td style="background-color:#f3e8ff; padding:15px; border-left:4px solid #8f06ee; color:#5a2d91; font-style:italic;">
                      “Great ideas start with great collaboration.”
                    </td>
                  </tr>
                </table>

                <p style="font-size:16px; color:#333333; line-height:1.6; margin:0 0 25px 0;">
                  Click below to jump into your dashboard and start creating:
                </p>

                <p>
                  <a href="https://collaborativex.com/dashboard" style="background-color:#8f06ee; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:30px; font-weight:bold; display:inline-block;">
                    Go to Dashboard
                  </a>
                </p>

                <p style="font-size:15px; color:#555; margin-top:40px;">
                  Cheers,<br />
                  <strong>Ridham Savaliya</strong><br />
                  Founder, CollaborativeX
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color:#f2f2f2; padding:20px; font-size:13px; color:#777777;">
                &copy; 2025 CollaborativeX • <a href="https://collaborativex.com" style="color:#8f06ee; text-decoration:none;">collaborativex.com</a>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

      `)


    return NextResponse.json({ message: "new user got welcome email" }, { status: 200 })

}
