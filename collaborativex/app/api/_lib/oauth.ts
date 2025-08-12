/**
 * OAuth Utility Functions
 * 
 * Contains helper functions for OAuth integration and provider detection
 */

export interface OAuthProvider {
  name: string;
  icon: string;
  clientId: string;
  domains?: string[];
  color: string;
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    name: 'Google',
    icon: '🔍',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    domains: ['gmail.com', 'googlemail.com'],
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    name: 'Microsoft',
    icon: '🏢',
    clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!,
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'microsoft.com'],
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
    domains: [],
    color: 'bg-blue-700 hover:bg-blue-800'
  },
  {
    name: 'Facebook',
    icon: '👥',
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!,
    domains: [],
    color: 'bg-blue-600 hover:bg-blue-700'
  }
];

/**
 * Detect OAuth provider based on email domain
 */
export const detectProviderFromEmail = (email: string): OAuthProvider | null => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  
  return OAUTH_PROVIDERS.find(provider => 
    provider.domains?.includes(domain)
  ) || null;
};

/**
 * Generate OAuth URL for a given provider
 */
export const generateOAuthURL = (
  provider: OAuthProvider, 
  isRegister: boolean, 
  email?: string, 
  collaboratorEmail?: string | null
): string => {
  const redirectUri = `${window.location.origin}/oauth/callback/${provider.name.toLowerCase()}`;
  const state = JSON.stringify({ 
    provider: provider.name.toLowerCase(),
    isRegister,
    email,
    collaboratorEmail 
  });

  switch (provider.name.toLowerCase()) {
    case 'google':
      return `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${provider.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `state=${encodeURIComponent(state)}`;
    
    case 'microsoft':
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${provider.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `state=${encodeURIComponent(state)}`;
    
    case 'linkedin':
      return `https://www.linkedin.com/oauth/v2/authorization?` +
        `client_id=${provider.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=r_liteprofile r_emailaddress&` +
        `state=${encodeURIComponent(state)}`;
    
    case 'facebook':
      return `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${provider.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=email&` +
        `state=${encodeURIComponent(state)}`;
    
    default:
      throw new Error(`Unsupported provider: ${provider.name}`);
  }
};


// utils/oauth.ts
export function getGoogleOAuthURL() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options = {
    redirect_uri: `${window.location.origin}/api/custom-oauth/google/callback`,
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: ["openid", "email", "profile"].join(" ")
  };

  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
}


/**
 * Handle OAuth success callback
 */
export const handleOAuthSuccess = (name: string, token: string, userId: string) => {
  // Store authentication data
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
  
  // Show success message
  return `Welcome, ${name}!`;
};

/**
 * Check if email domain suggests OAuth provider
 */
export const suggestOAuthProvider = (email: string): string | null => {
  const provider = detectProviderFromEmail(email);
  return provider ? `Consider signing in with ${provider.name} for faster access!` : null;
};