"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "../utills/ToastProvider";

interface OAuthProvider {
  name: string;
  icon: React.ReactNode;
  clientId: string;
  domains?: string[];
  color: string;
  authUrl: string;
  scope: string;
  callbackPath: string;
}

const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    domains: ['gmail.com', 'googlemail.com'],
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    callbackPath: '/api/custom-oauth/google/callback'
  },
  {
    name: 'Microsoft',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#f25022" d="M11.4 11.4H0V0h11.4v11.4z" />
        <path fill="#00a4ef" d="M24 11.4H12.6V0H24v11.4z" />
        <path fill="#7fba00" d="M11.4 24H0V12.6h11.4V24z" />
        <path fill="#ffb900" d="M24 24H12.6V12.6H24V24z" />
      </svg>
    ),
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID!,
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'microsoft.com'],
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    authUrl: `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize`,
    scope: 'openid email profile User.read',
    callbackPath: '/api/custom-oauth/microsoft/callback'
  },
  {
    name: 'LinkedIn',
    icon: (
      <svg className="w-5 h-5" fill="#0077B5" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
    domains: ['linkedin.com', 'linkedin.co', 'linkedin.in'],
    color: 'bg-blue-700 hover:bg-blue-800 text-white',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scope: 'openid profile email',
    callbackPath: '/api/custom-oauth/linkedin/callback'
  },
  {
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!,
    domains: ['facebook.com', 'fb.com'],
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'email',
    callbackPath: '/api/custom-oauth/facebook/callback'
  }
];


const EnhancedAuthPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLogin = pathname === "/login";

  const [isLoading, setIsLoading] = useState(false);
  const [isForgetPwd, setIsForgetPwd] = useState(false);
  const [otpId, setOtpId] = useState(null);
  const [step, setStep] = useState(1);
  const [detectedProvider, setDetectedProvider] = useState<OAuthProvider | null>(null);
  const [oauthVerified, setOauthVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const { showToast } = useToast();
  const [otpDetails, setOtpDetails] = useState({
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [collaboratorEmail, setCollaboratorEmail] = useState<string | null>(null);

  const navigateWithLoader = (router: any, path: string) => {
    router.push(path);
  };

  const detectProviderFromEmail = (email: string): OAuthProvider | null => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    return OAUTH_PROVIDERS.find(provider => provider.domains?.includes(domain)) || null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email' && value.includes('@')) {
      const provider = detectProviderFromEmail(value);
      setDetectedProvider(provider);
    }
  };

  const generateOAuthUrl = (provider: OAuthProvider, state: any): string => {
    const redirectUri = `${window.location.origin}${provider.callbackPath}`;
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: provider.scope,
      state: JSON.stringify(state),
    });

    // Special handling for Microsoft
    if (provider.name === 'Microsoft') {
      params.append('response_mode', 'query');
    }

    return `${provider.authUrl}?${params.toString()}`;
  };

  const handleOAuthLogin = async (provider: OAuthProvider, isRegister = false) => {
    setIsLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const postLogin = urlParams.get('postLogin');
    const postRegister = urlParams.get('postRegister');

    try {
      const state = {
        provider: provider.name.toLowerCase(),
        isRegister,
        email: formData.email,
        collaboratorEmail,
        returnUrl: window.location.href,
        postLogin,
        postRegister
      };

      const oauthUrl = generateOAuthUrl(provider, state);
      const popup = window.open(oauthUrl, 'oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'OAUTH_SUCCESS') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          localStorage.setItem('token', event.data.token);
          localStorage.setItem('userId', event.data.user.id);
          showToast(`Welcome, ${event.data.user.name || event.data.user.email}!`, 'success');
          navigateWithLoader(router, '/onboarding');
          setIsLoading(false);
        } else if (event.data.type === 'OAUTH_ERROR') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          showToast(event.data.error || 'OAuth authentication failed', 'error');
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);
    } catch (error: any) {
      showToast(error.message || 'OAuth initialization failed', 'error');
      setIsLoading(false);
    }
  };

  const handleOAuthVerification = async () => {
    if (!detectedProvider) {
      showToast('No OAuth provider detected for this email domain', 'warning');
      return;
    }

    if (!formData.email) {
      showToast('Please enter your email address first', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      localStorage.setItem('forgotPasswordEmail', formData.email);
      const state = {
        provider: detectedProvider.name.toLowerCase(),
        isVerification: true,
        email: formData.email,
        returnUrl: window.location.href,
      };

      const oauthUrl = generateOAuthUrl(detectedProvider, state);
      const popup = window.open(oauthUrl, 'oauth-verify', 'width=500,height=600,scrollbars=yes,resizable=yes');

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'OAUTH_VERIFICATION_SUCCESS') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          showToast('Email verified successfully! Now sending OTP...', 'success');
          setOauthVerified(true);
          setStep(2);

          // Send OTP after verification
          axios.post("/api/auth/forget-password", { email: formData.email, oauthVerified: true })
            .then((res) => {
              setOtpId(res.data?.otpId);
              showToast(res.data?.message || 'OTP sent successfully!', 'success');
              setIsLoading(false);
            })
            .catch((error) => {
              showToast(error?.response?.data?.message || 'Failed to send OTP', 'error');
              setStep(1);
              setOauthVerified(false);
              setIsLoading(false);
            });
        } else if (event.data.type === 'OAUTH_ERROR') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          showToast(event.data.error || 'OAuth verification failed', 'error');
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);
    } catch (error: any) {
      showToast('OAuth verification failed', 'error');
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtpDetails((prev) => ({ ...prev, [name]: value }));
  };

  const resetPasswordModal = () => {
    setIsForgetPwd(false);
    setStep(1);
    setOauthVerified(false);
    setDetectedProvider(null);
    setFormData(prev => ({ ...prev, email: "" }));
    setOtpDetails({ otp: "", newPassword: "", confirmNewPassword: "" });
  };

  useEffect(() => {
    const collaborator = searchParams.get('collaborator');
    const oauthVerifiedParam = searchParams.get('oauthVerified');
    const email = searchParams.get('email');

    if (collaborator) {
      setCollaboratorEmail(collaborator);
      setFormData((prev) => ({ ...prev, email: collaborator }));
    }

    if (oauthVerifiedParam === 'true' && email) {
      const decodedEmail = decodeURIComponent(email);
      setIsForgetPwd(true);
      setOauthVerified(true);
      setFormData((prev) => ({ ...prev, email: decodedEmail }));
      setDetectedProvider(detectProviderFromEmail(decodedEmail));
      setStep(2);

      showToast('Email verified! Sending OTP...', 'success');

      axios.post("/api/auth/send-otp", { email: decodedEmail, oauthVerified: true })
        .then((res) => {
          setOtpId(res.data?.otpId);
          showToast(res.data?.message || 'OTP sent successfully!', 'success');
        })
        .catch((error) => {
          showToast(error?.response?.data?.message || 'Failed to send OTP', 'error');
          setIsForgetPwd(false);
          setStep(1);
          setOauthVerified(false);
        });
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const postLogin = searchParams.get('postLogin');
      const postRegister = searchParams.get('postRegister');
      if (isLogin && postLogin) {
        navigateWithLoader(router, postLogin);
      } else if (!isLogin && postRegister) {
        navigateWithLoader(router, postRegister);
      } else {
        navigateWithLoader(router, '/onboarding');
      }
    }
  }, [isLogin, router, searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (collaboratorEmail && formData.email !== collaboratorEmail) {
      showToast(`Please use the invitation email address: ${collaboratorEmail}`, "warning");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (!formData.name.trim()) {
      showToast("Please enter your full name", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/register", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      showToast(`Welcome, ${formData.name}!`, "success");

      const postRegister = searchParams.get('postRegister');
      if (postRegister) {
        navigateWithLoader(router, postRegister);
      } else {
        navigateWithLoader(router, '/onboarding');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "Registration failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (collaboratorEmail && formData.email !== collaboratorEmail) {
      showToast(`Please use the invitation email address: ${collaboratorEmail}`, "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/login", {
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user?.id || '');
      showToast(`Welcome back, ${res.data?.name || formData.email.split('@')[0]}!`, "success");

      const postLogin = searchParams.get('postLogin');
      if (postLogin) {
        navigateWithLoader(router, postLogin);
      } else {
        navigateWithLoader(router, "/onboarding");
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "Login failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (step === 1) {
        if (!formData.email || !formData.email.includes('@')) {
          showToast("Enter a valid email address", 'warning');
          setIsLoading(false);
          return;
        }

        if (detectedProvider && !oauthVerified) {
          showToast(`Please verify with ${detectedProvider.name} first for security.`, 'info');
          setIsLoading(false);
          return;
        }

        const res = await axios.post("/api/auth/send-otp", {
          email: formData.email,
          oauthVerified: oauthVerified
        });

        showToast(res.data?.message || "OTP sent successfully!", "success");
        setOtpId(res.data?.otpId);
        setStep(2);
      } else {
        if (!otpDetails.otp.trim()) {
          showToast("Please enter the OTP", "warning");
          setIsLoading(false);
          return;
        }

        if (otpDetails.newPassword !== otpDetails.confirmNewPassword) {
          showToast("Passwords do not match", "warning");
          setIsLoading(false);
          return;
        }

        if (otpDetails.newPassword.length < 6) {
          showToast("Password must be at least 6 characters long", "warning");
          setIsLoading(false);
          return;
        }

        const res = await axios.post("/api/auth/verify-otp", {
          otpId,
          verificationCode: otpDetails.otp,
          newPassword: otpDetails.newPassword,
          cPassword: otpDetails.confirmNewPassword,
        });

        showToast(res.data?.message || "Password reset successful!", "success");
        resetPasswordModal();
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Reset failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl flex bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-l-3xl"></div>
          <div className="relative z-10 text-white">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              {isLogin ? "Welcome Back!" : "Join Our Platform"}
            </h1>
            <p className="text-xl text-purple-100 mb-8 leading-relaxed">
              {isLogin ? "Continue your journey with secure, fast authentication" : "Create your account with multiple sign-in options"}
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-purple-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Secure OAuth authentication with trusted providers</span>
              </div>
              <div className="flex items-center space-x-3 text-purple-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Smart email domain detection and verification</span>
              </div>
              <div className="flex items-center space-x-3 text-purple-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Advanced password recovery with OAuth integration</span>
              </div>
              <div className="flex items-center space-x-3 text-purple-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Seamless single sign-on experience</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-12 flex items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                {isLogin ? "Sign In" : "Create Account"}
              </h2>
              <p className="text-purple-200">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => router.push(isLogin ? "/register" : "/login")}
                  className="text-purple-300 hover:text-white font-semibold transition-colors underline decoration-purple-300 hover:decoration-white"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-center text-sm text-purple-200 mb-6">
                Continue with your preferred provider
              </p>
              <div className="grid grid-cols-1 gap-3">
                {OAUTH_PROVIDERS.slice(0, 2).map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() => handleOAuthLogin(provider, !isLogin)}
                    disabled={isLoading}
                    className={`${provider.color} py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm`}
                  >
                    {provider.icon}
                    <span>Continue with {provider.name}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {OAUTH_PROVIDERS.slice(2).map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() => handleOAuthLogin(provider, !isLogin)}
                    disabled={isLoading}
                    className={`${provider.color} py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105`}
                  >
                    {provider.icon}
                    <span className="hidden sm:inline">{provider.name}</span>
                  </button>
                ))}
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-purple-200">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                />
                {formData.email && detectedProvider && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-purple-300">
                    <AlertCircle className="w-4 h-4" />
                    <span>We detected you use {detectedProvider.name} - try OAuth for faster access!</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm Password"
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (isLogin ? "Signing in..." : "Creating account...") : (isLogin ? "Sign In" : "Create Account")}
              </button>
            </form>

            {isLogin && (
              <div className="text-center">
                <button
                  onClick={() => setIsForgetPwd(true)}
                  className="text-sm text-purple-300 hover:text-white transition-colors underline decoration-purple-300 hover:decoration-white"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isForgetPwd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-md transform transition-all duration-300 relative">
            <button
              onClick={resetPasswordModal}
              className="absolute top-4 right-4 text-2xl font-bold text-purple-300 hover:text-white transition-colors"
            >
              ×
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {step === 1 ? "Reset Your Password" : "Enter OTP & New Password"}
              </h3>
              <p className="text-purple-200 text-sm">
                {step === 1 ? "We'll help you get back into your account securely" : "Check your email for the verification code"}
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your registered email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                    {detectedProvider && (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-purple-300">
                        <AlertCircle className="w-4 h-4" />
                        <span>We detected you use {detectedProvider.name} for this email</span>
                      </div>
                    )}
                  </div>

                  {detectedProvider && !oauthVerified && (
                    <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">Enhanced Security</h4>
                          <p className="text-purple-200 text-sm mb-3">
                            Verify your identity with {detectedProvider.name} for added security
                          </p>
                          <button
                            type="button"
                            onClick={handleOAuthVerification}
                            disabled={isLoading}
                            className={`${detectedProvider.color} py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium disabled:opacity-50 w-full justify-center shadow-lg hover:shadow-xl transform hover:scale-105`}
                          >
                            {detectedProvider.icon}
                            <span>Verify with {detectedProvider.name}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {oauthVerified && (
                    <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <div>
                          <p className="text-green-300 font-medium">Email Verified!</p>
                          <p className="text-green-200 text-sm">You can now proceed with password reset</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      name="otp"
                      value={otpDetails.otp}
                      onChange={handleOtpChange}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-lg tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                    <input
                      type="password"
                      name="newPassword"
                      value={otpDetails.newPassword}
                      onChange={handleOtpChange}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={otpDetails.confirmNewPassword}
                      onChange={handleOtpChange}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading || (step === 1 && detectedProvider && !oauthVerified)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? "Processing..." : step === 1 ? (detectedProvider && !oauthVerified ? "Verify Email First" : "Send Reset Code") : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAuthPage;