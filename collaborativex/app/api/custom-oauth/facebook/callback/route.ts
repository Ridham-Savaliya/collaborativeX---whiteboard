import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import connectDB from "../../../_lib/db";
import User from "@/app/api/models/User";
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = JSON.parse(url.searchParams.get("state") || "{}");

    // Construct redirect URI dynamically
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const redirectUri = `${protocol}://${host}/api/custom-oauth/facebook/callback`;

    if (!code) {
      return sendError("Missing authorization code");
    }

    // 1️⃣ Exchange code for access token
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FACEBOOK_SECRET}&code=${code}`
    );
    const { access_token } = tokenRes.data;

    // 2️⃣ Get user profile (with email request)
    const profileRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
    );
    const { email, name, id: facebookId } = profileRes.data;

    // 3️⃣ Try finding existing user
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      user = await User.findOne({
        "oauthProviders.provider": "facebook",
        "oauthProviders.providerId": facebookId
      });
    }

    // 4️⃣ Handle verification flow
    if (state.isVerification) {
      if (!email && !user) {
        return sendError("Your Facebook account did not return an email. Please use another sign-in method.");
      }
      if (!user) {
        return sendError("No account found for verification.");
      }
      await User.findByIdAndUpdate(user._id, {
        oauthVerified: true,
        $addToSet: {
          oauthProviders: {
            provider: "facebook",
            providerId: facebookId,
            verifiedAt: new Date()
          }
        }
      });
      return sendSuccess("OAUTH_VERIFICATION_SUCCESS", { email: user.email });
    }

    // 5️⃣ Registration flow
    if (!user && state.isRegister) {
      if (!email) {
        return sendError("Facebook did not return an email. Cannot register without an email.");
      }
      user = await User.create({
        email,
        name,
        oauthVerified: true,
        oauthProviders: [{
          provider: "facebook",
          providerId: facebookId,
          verifiedAt: new Date()
        }]
      });
    }

    // 6️⃣ If still no user → error
    if (!user) {
      return sendError("User not found. Please register first.");
    }

    // 7️⃣ Ensure OAuth provider is linked
    const hasProvider = user.oauthProviders?.some(
      (p: any) => p.provider === "facebook" && p.providerId === facebookId
    );
    if (!hasProvider) {
      await User.findByIdAndUpdate(user._id, {
        $addToSet: {
          oauthProviders: {
            provider: "facebook",
            providerId: facebookId,
            verifiedAt: new Date()
          }
        },
        oauthVerified: true
      });
    }

    // 8️⃣ Generate JWT
    const appToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "1h" }
    );

    return sendSuccess("OAUTH_SUCCESS", {
      token: appToken,
      user: { id: user._id, email: user.email, name: user.name }
    });

  } catch (err: any) {
    console.error("Facebook OAuth callback error:", err.response?.data || err.message);
    return sendError("Facebook OAuth authentication failed. Please try again.");
  }
}

/* ---------- Helpers ---------- */
function sendError(message: string) {
  return new NextResponse(`
    <html><body><script>
      window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${message}' }, '${process.env.BASE_URL}');
      window.close();
    </script></body></html>
  `, { headers: { "Content-Type": "text/html" } });
}

function sendSuccess(type: string, payload: any) {
  return new NextResponse(`
    <html><body><script>
      window.opener.postMessage({ type: '${type}', ...${JSON.stringify(payload)} }, '${process.env.BASE_URL}');
      window.close();
    </script></body></html>
  `, { headers: { "Content-Type": "text/html" } });
}
