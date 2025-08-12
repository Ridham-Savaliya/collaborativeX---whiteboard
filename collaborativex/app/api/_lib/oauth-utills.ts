/**
 * OAuth Utilities
 * 
 * Utility functions for managing OAuth providers, domain-based suggestions,
 * and provider-specific configurations.
 */

import {
  Mail,
  Globe,
  Linkedin,
  Facebook
} from "lucide-react";

/**
 * OAuth Provider Configuration Interface
 */
export interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: React.ComponentType<any>;
  domains: string[];
  description: string;
}

/**
 * OAuth Providers Configuration
 * Maps provider IDs to their display information and domain associations
 */
export const oauthProviders: Record<string, OAuthProvider> = {
  google: {
    id: "google",
    name: "Google",
    displayName: "Google",
    color: "#4285F4",
    icon: Mail,
    domains: ["gmail.com", "googlemail.com"],
    description: "Sign in with your Google account"
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    displayName: "LinkedIn",
    color: "#0077B5",
    icon: Linkedin,
    domains: ["linkedin.com"],
    description: "Sign in with your LinkedIn account"
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    displayName: "Facebook",
    color: "#1877F2",
    icon: Facebook,
    domains: ["facebook.com", "fb.com"],
    description: "Sign in with your Facebook account"
  },
  "microsoft-entra-id": {
    id: "microsoft-entra-id",
    name: "Microsoft",
    displayName: "Microsoft",
    color: "#00A4EF",
    icon: Globe,
    domains: [
      "outlook.com",
      "hotmail.com",
      "live.com",
      "msn.com",
      "office365.com",
      "microsoft.com"
    ],
    description: "Sign in with your Microsoft account"
  }
};

/**
 * Get all available OAuth providers
 * @returns Array of all configured OAuth providers
 */
export const getAllProviders = (): OAuthProvider[] => {
  return Object.values(oauthProviders);
};

/**
 * Get OAuth providers suggested for a specific email domain
 * @param email - User's email address
 * @returns Array of suggested providers based on email domain
 */
export const getSuggestedProviders = (email: string): OAuthProvider[] => {
  if (!email || !email.includes('@')) {
    return getAllProviders();
  }

  const domain = email.toLowerCase().split('@')[1];
  const suggested: OAuthProvider[] = [];
  const others: OAuthProvider[] = [];

  // Categorize providers based on domain match
  getAllProviders().forEach(provider => {
    if (provider.domains.includes(domain)) {
      suggested.push(provider);
    } else {
      others.push(provider);
    }
  });

  // Return suggested providers first, then others
  return [...suggested, ...others];
};

/**
 * Get display text for OAuth provider button
 * @param provider - OAuth provider configuration
 * @param email - User's email address (optional)
 * @returns Formatted display text for the provider button
 */
export const getProviderDisplayText = (provider: OAuthProvider, email?: string): string => {
  const baseText = `Continue with ${provider.displayName}`;

  if (!email) return baseText;

  const domain = email.toLowerCase().split('@')[1];
  const isRecommended = provider.domains.includes(domain);

  return isRecommended ? `${baseText} (Recommended)` : baseText;
};

/**
 * Check if an email domain matches any OAuth provider domains
 * @param email - User's email address
 * @returns True if the email domain matches any configured OAuth provider
 */
export const hasOAuthProviderForDomain = (email: string): boolean => {
  if (!email || !email.includes('@')) return false;

  const domain = email.toLowerCase().split('@')[1];
  return getAllProviders().some(provider =>
    provider.domains.includes(domain)
  );
};

/**
 * Get OAuth provider by ID
 * @param providerId - OAuth provider identifier
 * @returns OAuth provider configuration or null if not found
 */
export const getProviderById = (providerId: string): OAuthProvider | null => {
  return oauthProviders[providerId] || null;
};

/**
 * Generate OAuth provider statistics for analytics
 * @returns Object with provider usage statistics
 */
export const getProviderStats = () => {
  const providers = getAllProviders();
  return {
    totalProviders: providers.length,
    domainsCovered: providers.reduce((acc, p) => acc + p.domains.length, 0),
    providersByPopularity: providers.sort((a, b) => b.domains.length - a.domains.length)
  };
};

/**
 * Validate OAuth provider configuration
 * @param providerId - OAuth provider identifier
 * @returns True if provider is properly configured
 */
export const isProviderConfigured = (providerId: string): boolean => {
  const provider = getProviderById(providerId);
  if (!provider) return false;

  // Check if required environment variables are set
  switch (providerId) {
    case 'google':
      return !!(process.env.NEXT_PUBLIC_GOOGLE_ID);
    case 'linkedin':
      return !!(process.env.NEXT_PUBLIC_LINKEDIN_ID);

    case 'facebook':
      return !!(process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID);
    case 'microsoft-entra-id':
      return !!(process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID);
    default:
      return false;
  }
};

/**
 * Get list of properly configured OAuth providers
 * @returns Array of configured OAuth providers
 */
export const getConfiguredProviders = (): OAuthProvider[] => {
  return getAllProviders().filter(provider =>
    isProviderConfigured(provider.id)
  );
};