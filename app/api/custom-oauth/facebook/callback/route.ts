import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import connectDB from "../../../_lib/db";
import User from "@/app/api/models/User";
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = JSON.parse(url.searchParams.get("state") || "{}");
// Dynamically construct redirect URI from request headers
    const host = req.headers.get('host') || 'localhost:3000'; // Fallback for local
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const redirectUri = `${protocol}://${host}/api/custom-oauth/facebook/callback`;

    if (!code) {
      const errorPage = `
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: 'Missing authorization code'
              }, '${process.env.BASE_URL}');
              window.close();
            </script>
          </body>
        </html>
      `;
      return new NextResponse(errorPage, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    console.log('Authorization code:', code);
    console.log('Redirect URI:', redirectUri);
    // Exchange code for access token
const tokenRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FACEBOOK_SECRET}&code=${code}`);

    const { access_token } = tokenRes.data;

    // Get user profile
    const profileRes = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`);

    const { email, name, id: facebookId } = profileRes.data;

    // Verify email matches if provided in state
    if (state.email && state.email !== email) {
      const errorPage = `
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: 'Email mismatch. Please use the same email address (${state.email}) that you entered.'
              }, '${process.env.BASE_URL}');
              window.close();
            </script>
          </body>
        </html>
      `;
      return new NextResponse(errorPage, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (state.isVerification) {
      // Update user's OAuth verification status
      await User.findOneAndUpdate(
        { email },
        { 
          oauthVerified: true,
          $addToSet: {
            oauthProviders: {
              provider: 'facebook',
              providerId: facebookId,
              verifiedAt: new Date()
            }
          }
        },
        { upsert: false }
      );

      const successPage = `
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'OAUTH_VERIFICATION_SUCCESS',
                email: '${email}'
              }, '${process.env.BASE_URL}');
              window.close();
            </script>
          </body>
        </html>
      `;
      return new NextResponse(successPage, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle login/registration
    let user = await User.findOne({ email });
    
    if (!user && state.isRegister) {
      // Create new user with OAuth
      user = await User.create({
        email,
        name,
        oauthVerified: true,
        oauthProviders: [{
          provider: 'facebook',
          providerId: facebookId,
          verifiedAt: new Date()
        }]
      });
    } else if (user && !user.oauthVerified) {
      // Update existing user with OAuth verification
      await User.findOneAndUpdate(
        { email },
        { 
          oauthVerified: true,
          $addToSet: {
            oauthProviders: {
              provider: 'facebook',
              providerId: facebookId,
              verifiedAt: new Date()
            }
          }
        }
      );
      user = await User.findOne({ email }); // Refresh user data
    }

    if (!user) {
      const errorPage = `
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: 'User not found. Please register first.'
              }, '${process.env.BASE_URL}');
              window.close();
            </script>
          </body>
        </html>
      `;
      return new NextResponse(errorPage, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Generate JWT for login
    const appToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "1h" }
    );

    const successPage = `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              token: '${appToken}',
              user: {
                id: '${user._id}',
                email: '${user.email}',
                name: '${user.name}'
              }
            }, '${process.env.BASE_URL}');
            window.close();
          </script>
        </body>
      </html>
    `;
    return new NextResponse(successPage, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (err:any) {
console.error('Facebook OAuth callback error:', JSON.stringify(err.response?.data, null, 2) || err.message);
    const errorPage = `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: 'Facebook OAuth authentication failed. Please try again.'
            }, '${process.env.BASE_URL}');
            window.close();
          </script>
        </body>
      </html>
    `;
    return new NextResponse(errorPage, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}