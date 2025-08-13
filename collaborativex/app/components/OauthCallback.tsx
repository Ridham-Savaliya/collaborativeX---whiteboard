import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../utills/ToastProvider';
import { useGlobalLoader } from '../hooks/useGlobalLoader';

/**
 * OAuth Callback Component
 * Handles OAuth provider callbacks and exchanges authorization codes for tokens
 */
const OAuthCallback: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { navigateWithLoader } = useGlobalLoader();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Handle OAuth errors
        if (error) {
          showToast(`OAuth error: ${error}`, 'error');
          navigateWithLoader(router, '/login');
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          showToast('Invalid OAuth callback parameters', 'error');
          navigateWithLoader(router, '/login');
          return;
        }

        // Parse state to get provider info
        const { provider, isRegister, email, collaboratorEmail } = JSON.parse(decodeURIComponent(state));

        // Check if this is for forgot password verification
        const forgotPasswordEmail = localStorage.getItem('forgotPasswordEmail');
        if (forgotPasswordEmail) {
          // Handle forgot password OAuth verification
          await handleForgotPasswordVerification(code, provider, forgotPasswordEmail);
          return;
        }

        // Handle regular OAuth authentication
        await handleOAuthAuthentication(code, provider, isRegister, email, collaboratorEmail);

      } catch (error) {
        console.error('OAuth callback error:', error);
        showToast('OAuth authentication failed', 'error');
        navigateWithLoader(router, '/login');
      }
    };

    const handleForgotPasswordVerification = async (code: string, provider: string, email: string) => {
      try {
        // Get user info from OAuth provider
        const userInfo = await exchangeCodeForUserInfo(code, provider);
        
        // Verify email matches
        if (userInfo.email !== email) {
          showToast('Email verification failed - email mismatch', 'error');
          navigateWithLoader(router, '/login');
          return;
        }

        // Clear stored email and redirect back with verification flag
        localStorage.removeItem('forgotPasswordEmail');
        navigateWithLoader(router, '/login?oauthVerified=true');
        showToast('Email verified successfully!', 'success');

      } catch (error) {
        console.error('Forgot password verification error:', error);
        showToast('Email verification failed', 'error');
        navigateWithLoader(router, '/login');
      }
    };

    const handleOAuthAuthentication = async (
      code: string, 
      provider: string, 
      isRegister: boolean, 
      email?: string, 
      collaboratorEmail?: string
    ) => {
      try {
        // Get user info from OAuth provider
        const userInfo = await exchangeCodeForUserInfo(code, provider);

        // Send user info to your backend for token generation
        const response = await fetch('/api/auth/oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            email: userInfo.email,
            name: userInfo.name,
            providerId: userInfo.id,
            isRegister,
            collaboratorEmail
          }),
        });

        if (!response.ok) {
          throw new Error('Backend authentication failed');
        }

        const { token, user } = await response.json();

        // Store token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);

        // Show success message
        showToast(`Welcome, ${user.name}!`, 'success');

        // Redirect to appropriate page
        const urlParams = new URLSearchParams(window.location.search);
        const postLogin = urlParams.get('postLogin');
        const postRegister = urlParams.get('postRegister');
        
        if (isRegister && postRegister) {
          navigateWithLoader(router, postRegister);
        } else if (!isRegister && postLogin) {
          navigateWithLoader(router, postLogin);
        } else {
          navigateWithLoader(router, '/onboarding');
        }

      } catch (error) {
        console.error('OAuth authentication error:', error);
        showToast('Authentication failed', 'error');
        navigateWithLoader(router, '/login');
      }
    };

    const exchangeCodeForUserInfo = async (code: string, provider: string) => {
      switch (provider) {
        case 'google':
          return await handleGoogleCallback(code);
        case 'microsoft':
          return await handleMicrosoftCallback(code);
        case 'linkedin':
          return await handleLinkedInCallback(code);
        case 'facebook':
          return await handleFacebookCallback(code);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    };

    const handleGoogleCallback = async (code: string) => {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          client_id: process.env.NEXT_PUBLIC_CLIENT_GOOGLE_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET, // This should be handled by your backend
          redirect_uri: `${window.location.origin}/oauth/callback/google`,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const { access_token } = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      };
    };

    const handleMicrosoftCallback = async (code: string) => {
      // Similar implementation for Microsoft
      throw new Error('Microsoft OAuth not implemented yet');
    };

    const handleLinkedInCallback = async (code: string) => {
      // Similar implementation for LinkedIn
      throw new Error('LinkedIn OAuth not implemented yet');
    };

    const handleFacebookCallback = async (code: string) => {
      // Similar implementation for Facebook
      throw new Error('Facebook OAuth not implemented yet');
    };

    handleOAuthCallback();
  }, [router, showToast, navigateWithLoader]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Completing Authentication</h2>
        <p className="text-gray-500">Please wait while we verify your credentials...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;