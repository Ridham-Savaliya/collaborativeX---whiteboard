import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/app/utills/generateOTP";
import { sendMail } from "@/app/utills/sendMail";
import User from "../../models/User";
import OTP from "../../models/OTP";
import connectDB from "@/app/api/_lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  await connectDB();

  const { email, oauthVerified }: { email: string, oauthVerified: boolean } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, message: "Email is required!" }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found!" }, { status: 404 });
  }

  // Check if OAuth verification is required for this email domain
  const emailDomain = email.split('@')[1]?.toLowerCase();
  const oauthDomains = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'microsoft.com'];

  if (oauthDomains.includes(emailDomain) && !oauthVerified && !user.oauthVerified) {
    return NextResponse.json(
      { message: "OAuth verification required for this email domain" },
      { status: 403 }
    );
  }

  // const generatedOtp = generateOTP();
  // const hashedOtp = await bcrypt.hash(generatedOtp, 10);

  // const otpRecord = await OTP.create({ userId: user._id, otp: hashedOtp });
  // const otpId = otpRecord._id;

  //   await sendMail(
  //     email,
  //     "Your OTP for Reset Password",
  //     `<!DOCTYPE html>
  // <html lang="en">
  // <head>
  //   <meta charset="UTF-8">
  //   <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //   <title>Your OTP for CollaborativeX Password Reset</title>
  // </head>
  // <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F5F3FF;">
  //   <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #F5F3FF;">
  //     <tr>
  //       <td align="center" style="padding: 40px 0;">
  //         <!-- Container -->
  //         <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);">
  //           <!-- Header with Wave Pattern -->
  //           <tr>
  //             <td style="background-color: #EDE9FE; border-top-left-radius: 12px; border-top-right-radius: 12px; text-align: center; padding: 32px 24px 0 24px; position: relative;">
  //               <img src="https://res.cloudinary.com/dzrzfsu9u/image/upload/v1748849092/promotions/v2vqh2xjmdemfqsqnhpb.png" alt="CollaborativeX Logo" style="max-width: 150px; height: auto; margin-bottom: 24px;" />
  //               <!-- Wave Pattern -->
  //               <div style="position: absolute; bottom: 0; left: 0; width: 100%; overflow: hidden; line-height: 0;">
  //                 <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style="width: 100%; height: 60px; background: #FFFFFF;">
  //                   <path d="M0,0 C200,120 400,0 600,120 C800,0 1000,120 1200,0 L1200,120 L0,120 Z" fill="#EDE9FE"></path>
  //                 </svg>
  //               </div>
  //             </td>
  //           </tr>
  //           <!-- Body -->
  //           <tr>
  //             <td style="padding: 32px 24px; text-align: center;">
  //               <h1 style="font-size: 28px; font-weight: bold; color: #1F2937; margin-bottom: 16px;">Your OTP for Password Reset</h1>
  //               <p style="font-size: 16px; color: #4B5563; margin-bottom: 16px;">
  //                 Hello ${user.name},
  //               </p>
  //               <p style="font-size: 16px; color: #4B5563; margin-bottom: 24px; line-height: 1.5;">
  //                 We received a request to reset your password for your CollaborativeX account. Use the OTP below to proceed. This code is valid for the next 10 minutes.
  //               </p>
  //               <!-- OTP Display -->
  //               <div style="display: inline-block; padding: 16px 32px; background-color: #EDE9FE; border-radius: 8px; margin-bottom: 24px;">
  //                 <span style="font-size: 24px; font-weight: bold; color: #7C3AED; letter-spacing: 4px;">${generatedOtp}</span>
  //               </div>
  //               <p style="font-size: 14px; color: #6B7280; margin-bottom: 24px;">
  //                 If you didn't request a password reset, please ignore this email or contact our support team.
  //               </p>
  //               <a href="${process.env.BASE_URL}/auth/reset-password" style="display: inline-block; padding: 12px 32px; background: linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%); color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
  //                 Reset Your Password
  //               </a>
  //               <p style="font-size: 14px; color: #6B7280;">
  //                 If the button above doesn't work, copy and paste this link: <br />
  //                 <a href="${process.env.BASE_URL}/auth/reset-password" style="color: #7C3AED; text-decoration: underline;">${process.env.BASE_URL}/auth/reset-password</a>
  //               </p>
  //             </td>
  //           </tr>
  //           <!-- Footer -->
  //           <tr>
  //             <td style="padding: 24px; background-color: #EDE9FE; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; text-align: center;">
  //               <p style="font-size: 14px; color: #4B5563; margin-bottom: 16px;">
  //                 Follow us on:
  //                 <a href="#" style="color: #7C3AED; text-decoration: none; margin-left: 8px;">Twitter</a> |
  //                 <a href="#" style="color: #7C3AED; text-decoration: none; margin-left: 8px;">LinkedIn</a>
  //               </p>
  //               <p style="font-size: 14px; color: #4B5563; margin-bottom: 16px;">
  //                 © 2025 CollaborativeX. All rights reserved.
  //               </p>
  //               <p style="font-size: 14px; color: #4B5563;">
  //                 Don't want to receive these emails? <a href="#" style="color: #7C3AED; text-decoration: underline;">Unsubscribe</a>
  //               </p>
  //             </td>
  //           </tr>
  //         </table>
  //       </td>
  //     </tr>
  //   </table>
  // </body>
  // </html>`
  //   );

  return NextResponse.json({
    success: true,
    message: "User has been verfied by OAuthProvider!.",
    userId: user._id,
    // generatedOtp
  });
}