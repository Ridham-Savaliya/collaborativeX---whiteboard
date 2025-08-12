import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * OAuth Callback Handler
 * 
 * Handles OAuth callbacks from various providers and exchanges authorization codes
 * for user information, then obtains custom tokens from backend
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_error`);
  }

  try {
    // Parse state to get provider info
    const { provider, isRegister, email, collaboratorEmail } = JSON.parse(decodeURIComponent(state));
    
    // Exchange code for user information based on provider
    let userInfo;
    switch (provider) {
      case 'google':
        userInfo = await handleGoogleCallback(code);
        break;
      case 'microsoft':
        userInfo = await handleMicrosoftCallback(code);
        break;
      case 'linkedin':
        userInfo = await handleLinkedInCallback(code);
        break;
      case 'facebook':
        userInfo = await handleFacebookCallback(code);
        break;
      default:
        throw new Error('Unsupported provider');
    }

    // Check if this is for forgot password verification
    const forgotPasswordEmail = request.cookies.get('forgotPasswordEmail')?.value;
    if (forgotPasswordEmail) {
      // Verify email matches
      if (userInfo.email !== forgotPasswordEmail) {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=email_mismatch`);
      }
      
      // Clear cookie and redirect back to forgot password with verification flag
      const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauthVerified=true`);
      response.cookies.delete('forgotPasswordEmail');
      return response;
    }

    // Handle regular OAuth authentication
    // Send user info to your custom backend for token generation
    const authResponse = await axios.post(`http://localhost:3000/api/auth/oauth`, {
      provider,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
      isRegister,
      collaboratorEmail
    });

    // Get custom token from your backend
    const { token, user } = authResponse.data;
    
    // Create response with redirect
    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/${isRegister ? 'register' : 'login'}?oauth_success=true`
    );
    
    // Set token in httpOnly cookie for security
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Also set in localStorage via client-side script (less secure but required for your current setup)
    const html = `
      <script>
        localStorage.setItem('token', '${token}');
        localStorage.setItem('userId', '${user.id}');
        window.location.href = '${isRegister ? '/register' : '/login'}?oauth_success=true&name=${encodeURIComponent(user.name)}';
      </script>
    `;
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_callback_failed`);
  }
}

/**
 * Handle Google OAuth callback
 */
async function handleGoogleCallback(code: string) {
  // Exchange code for access token
  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_SECRET,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/google`,
    grant_type: 'authorization_code'
  });

  const { access_token } = tokenResponse.data;

  // Get user info
  const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  return {
    email: userResponse.data.email,
    name: userResponse.data.name,
    picture: userResponse.data.picture
  };
}

/**
 * Handle Microsoft OAuth callback
 */
async function handleMicrosoftCallback(code: string) {
  // Exchange code for access token
  const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    code,
    client_id: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
    client_secret: process.env.AZURE_AD_CLIENT_SECRET,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/`,
    grant_type: 'authorization_code'
  });

  const { access_token } = tokenResponse.data;

  // Get user info
  const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  return {
    email: userResponse.data.mail || userResponse.data.userPrincipalName,
    name: userResponse.data.displayName,
    picture: null // Microsoft Graph doesn't provide profile picture in basic call
  };
}

/**
 * Handle LinkedIn OAuth callback
 */
async function handleLinkedInCallback(code: string) {
  // Exchange code for access token
  const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
    code,
    client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_SECRET,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`,
    grant_type: 'authorization_code'
  });

  const { access_token } = tokenResponse.data;

  // Get user info
  const [profileResponse, emailResponse] = await Promise.all([
    axios.get('https://api.linkedin.com/v2/people/~', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }),
    axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
  ]);

  return {
    email: emailResponse.data.elements[0]['handle~'].emailAddress,
    name: `${profileResponse.data.firstName.localized.en_US} ${profileResponse.data.lastName.localized.en_US}`,
    picture: null
  };
}

/**
 * Handle Facebook OAuth callback
 */
async function handleFacebookCallback(code: string) {
  // Exchange code for access token
  const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
    params: {
      code,
      client_id: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_SECRET,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`
    }
  });

  const { access_token } = tokenResponse.data;

  // Get user info
  const userResponse = await axios.get('https://graph.facebook.com/me', {
    params: {
      fields: 'id,name,email,picture',
      access_token
    }
  });

  return {
    email: userResponse.data.email,
    name: userResponse.data.name,
    picture: userResponse.data.picture?.data?.url
  };
}