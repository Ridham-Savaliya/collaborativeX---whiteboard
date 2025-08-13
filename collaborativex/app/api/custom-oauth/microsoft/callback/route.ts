// app/api/custom-oauth/microsoft/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import connectDB from "../../../_lib/db";
import User from "../../../models/User";

const MICROSOFT_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET!;
const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
const BASE_URL = process.env.BASE_URL!;

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = JSON.parse(url.searchParams.get("state") || "{}");
    const redirectUri = `${BASE_URL}/api/custom-oauth/microsoft/callback`;

    if (!code) {
      const errorPage = `
        <html><body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: 'Missing authorization code'
            }, '${BASE_URL}');
            window.close();
          </script>
        </body></html>
      `;
      return new NextResponse(errorPage, { headers: { "Content-Type": "text/html" } });
    }

    // Step 1: Exchange code for token
    const tokenRes = await axios.post(
      "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("Failed to obtain Microsoft access token");

    // Step 2: Get Microsoft Graph profile
    const profileRes = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = profileRes.data;
    const email = profile.mail || profile.userPrincipalName;
    const name = profile.displayName || email?.split("@")[0] || "";

    if (!email) {
      const errorPage = `
        <html><body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: 'Microsoft account did not return an email address'
            }, '${BASE_URL}');
            window.close();
          </script>
        </body></html>
      `;
      return new NextResponse(errorPage, { headers: { "Content-Type": "text/html" } });
    }

    // Step 3: Email verification check (if in state)
    if (state.email && state.email !== email) {
      const errorPage = `
        <html><body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: 'Email mismatch. Please use the same email (${state.email}) that you entered.'
            }, '${BASE_URL}');
            window.close();
          </script>
        </body></html>
      `;
      return new NextResponse(errorPage, { headers: { "Content-Type": "text/html" } });
    }

    // Step 4: Verification mode
    if (state.isVerification) {
      await User.findOneAndUpdate(
        { email },
        {
          oauthVerified: true,
          $addToSet: {
            oauthProviders: {
              provider: "microsoft",
              providerId: profile.id,
              verifiedAt: new Date(),
            },
          },
        },
        { upsert: false }
      );

      const successPage = `
        <html><body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_VERIFICATION_SUCCESS',
              email: '${email}'
            }, '${BASE_URL}');
            window.close();
          </script>
        </body></html>
      `;
      return new NextResponse(successPage, { headers: { "Content-Type": "text/html" } });
    }

    // Step 5: Login / registration
    let user = await User.findOne({ email });

    if (!user && state.isRegister) {
      user = await User.create({
        email,
        name,
        oauthVerified: true,
        oauthProviders: [{
          provider: "microsoft",
          providerId: profile.id,
          verifiedAt: new Date(),
        }],
      });
    } else if (user && !user.oauthVerified) {
      await User.findOneAndUpdate(
        { email },
        {
          oauthVerified: true,
          $addToSet: {
            oauthProviders: {
              provider: "microsoft",
              providerId: profile.id,
              verifiedAt: new Date(),
            },
          },
        }
      );
      user = await User.findOne({ email });
    }

    if (!user) {
      const errorPage = `
        <html><body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: 'User not found. Please register first.'
            }, '${BASE_URL}');
            window.close();
          </script>
        </body></html>
      `;
      return new NextResponse(errorPage, { headers: { "Content-Type": "text/html" } });
    }

    // Step 6: JWT
    const appToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const successPage = `
      <html><body>
        <script>
          window.opener.postMessage({
            type: 'OAUTH_SUCCESS',
            token: '${appToken}',
            user: {
              id: '${user._id}',
              email: '${user.email}',
              name: '${user.name}'
            }
          }, '${BASE_URL}');
          window.close();
        </script>
      </body></html>
    `;
    return new NextResponse(successPage, { headers: { "Content-Type": "text/html" } });

  } catch (err: any) {
    console.error("Microsoft OAuth callback error:", err.response?.data || err.message);
    const errorPage = `
      <html><body>
        <script>
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: 'OAuth authentication failed. Please try again.'
          }, '${BASE_URL}');
          window.close();
        </script>
      </body></html>
    `;
    return new NextResponse(errorPage, { headers: { "Content-Type": "text/html" } });
  }
}
