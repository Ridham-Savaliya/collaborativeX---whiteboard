import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import connectDB from "../../../_lib/db";
import User from "@/app/api/models/User";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    console.log("=== LinkedIn OAuth Callback Hit ===");

    await connectDB();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const rawState = url.searchParams.get("state");
    const state = JSON.parse(rawState || "{}");
    const redirectUri = `${process.env.BASE_URL}/api/custom-oauth/linkedin/callback`;

    console.log("OAuth Code:", code);
    console.log("OAuth State (raw):", rawState);
    console.log("OAuth State (parsed):", state);
    console.log("Redirect URI being used:", redirectUri);

    if (!code) {
      console.error("❌ Missing authorization code");
      return oauthError("Missing authorization code");
    }

    // Exchange code for access token
    console.log("🔄 Requesting LinkedIn Access Token...");
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_SECRET!,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("✅ Token Response:", tokenRes.data);
    const { access_token } = tokenRes.data;

    if (!access_token) {
      console.error("❌ Failed to obtain access token");
      return oauthError("Failed to obtain access token from LinkedIn");
    }

    // Get profile and email
    console.log("📄 Fetching LinkedIn profile and email...");
    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    console.log("✅ Profile Response:", profileRes.data);

    const linkedinId = profileRes.data.sub; // Use 'sub' as the unique identifier
    const firstName = profileRes.data.given_name || "";
    const lastName = profileRes.data.family_name || "";
    const email = profileRes.data.email || "";
    const name = `${firstName} ${lastName}`.trim();

    console.log("Extracted User Info:", { linkedinId, firstName, lastName, email });

    if (!linkedinId || !email) {
      console.error("❌ Missing LinkedIn profile ID or email");
      return oauthError("Failed to retrieve LinkedIn profile or email");
    }

    // Email verification
    if (state.email && state.email !== email) {
      console.error(`❌ Email mismatch: expected ${state.email} but got ${email}`);
      return oauthError(
        `Email mismatch. Please use the same email address (${state.email}) that you entered.`
      );
    }

    if (state.isVerification) {
      console.log("🔒 Verification mode");
      await User.findOneAndUpdate(
        { email },
        {
          oauthVerified: true,
          $addToSet: {
            oauthProviders: {
              provider: "linkedin",
              providerId: linkedinId,
              verifiedAt: new Date(),
            },
          },
        },
        { upsert: false }
      );

      return oauthSuccess("OAUTH_VERIFICATION_SUCCESS", { email });
    }

    // Login or registration
    let user = await User.findOne({ email });
    console.log("User found in DB:", user);

    if (!user && state.isRegister) {
      console.log("🆕 Creating new user...");
      user = await User.create({
        email,
        name,
        oauthVerified: true,
        oauthProviders: [
          {
            provider: "linkedin",
            providerId: linkedinId,
            verifiedAt: new Date(),
          },
        ],
      });
    } else if (user && !user.oauthVerified) {
      console.log("🔄 Updating existing user to verified...");
      await User.findOneAndUpdate(
        { email },
        {
          oauthVerified: true,
          $addToSet: {
            oauthProviders: {
              provider: "linkedin",
              providerId: linkedinId,
              verifiedAt: new Date(),
            },
          },
        }
      );
      user = await User.findOne({ email });
    }

    if (!user) {
      console.error("❌ No user found after processing");
      return oauthError("User not found. Please register first.");
    }

    const appToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "1h" }
    );

    console.log("✅ Generated App Token:", appToken);

    return oauthSuccess("OAUTH_SUCCESS", {
      token: appToken,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    console.error("💥 LinkedIn OAuth callback error:", err.response?.data || err.message || err);
    return oauthError("LinkedIn OAuth authentication failed. Please try again.");
  }
}

// Helper to send success response
function oauthSuccess(type: string, payload: Record<string, any>) {
  const page = `
    <html>
      <body>
        <script>
          window.opener.postMessage({
            type: '${type}',
            ...${JSON.stringify(payload)}
          }, '${process.env.BASE_URL}');
          window.close();
        </script>
      </body>
    </html>
  `;
  return new NextResponse(page, { headers: { "Content-Type": "text/html" } });
}

// Helper to send error response
function oauthError(errorMessage: string) {
  const page = `
    <html>
      <body>
        <script>
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: '${errorMessage}'
          }, '${process.env.BASE_URL}');
          window.close();
        </script>
      </body>
    </html>
  `;
  return new NextResponse(page, { headers: { "Content-Type": "text/html" } });
}