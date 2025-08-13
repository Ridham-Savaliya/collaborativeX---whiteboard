import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Cardio } from 'ldrs/react';

interface InviteValidationProps {
  whiteboardId: string;
  onValidationComplete: (isValid: boolean, email?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  HandleInviteeEmail: (email:string) => void;
}

/**
 * InviteValidation Component
 * 
 * Core security component for whiteboard invitation system.
 * Implements secure validation flow that must complete successfully
 * before any other whiteboard API calls are allowed.
 * 
 * Security Features:
 * - Token validation with backend before any operations
 * - Email consistency checking with URL parameters
 * - Proper error handling and user feedback
 * - Prevents unauthorized API calls through validation gating
 * 
 * Flow:
 * 1. Extract invite token from URL parameters
 * 2. Show email input modal if token exists
 * 3. Validate token + email with secure backend API
 * 4. Handle user existence scenarios (login vs registration)
 * 5. Redirect with pre-filled secure parameters
 * 6. Only allow whiteboard access after successful validation
 */
const InviteValidation: React.FC<InviteValidationProps> = ({
  whiteboardId,
  onValidationComplete,
  showToast,
  HandleInviteeEmail
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management for secure invite validation flow
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showNotRegistered, setShowNotRegistered] = useState(false);
  const [validationAttempts, setValidationAttempts] = useState(0);
  const [isValidationComplete, setIsValidationComplete] = useState(false);
  
  // Extract invite token and collaborator email from URL
  const inviteToken = searchParams.get('inviteetoken');
  const collaboratorEmail = searchParams.get('collaborator');
  
  // Maximum validation attempts for security
  const MAX_VALIDATION_ATTEMPTS = 3;
  
  /**
   * Initialize component and determine if invite validation is required
   * This is the entry point that decides the flow
   */
  useEffect(() => {
    if (inviteToken) {
      // Invite token exists - validation required
      setShowEmailModal(true);
      
      // Pre-fill email if collaborator parameter exists
      if (collaboratorEmail) {
        setEmail(decodeURIComponent(collaboratorEmail));
        showToast('Email pre-filled from your invitation', 'success');
      }
    } else {
      // No invite token - allow normal whiteboard access
      setIsValidationComplete(true);
      onValidationComplete(true);
    }
  }, [inviteToken, collaboratorEmail, onValidationComplete, showToast]);

  /**
   * Core security function: Validates invite link with backend
   * 
   * This function implements the security-first approach by:
   * 1. Validating all input data before API calls
   * 2. Making secure API call with proper error handling
   * 3. Processing response according to user existence
   * 4. Implementing rate limiting for security
   * 
   * @param userEmail - Email entered by the user
   */
  const validateInviteLink = async (userEmail: string) => {
    // Input validation - security first approach
    if (!userEmail.trim()) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      showToast('Please enter a valid email address', 'warning');
      return;
    }

    // Rate limiting check for security
    if (validationAttempts >= MAX_VALIDATION_ATTEMPTS) {
      showToast('Too many validation attempts. Please refresh the page and try again.', 'error');
      return;
    }

    // Email consistency validation for invite flows
    if (collaboratorEmail && userEmail.toLowerCase() !== decodeURIComponent(collaboratorEmail).toLowerCase()) {
      showToast(
        'Email must match the invited collaborator email from your invitation link', 
        'warning'
      );
      return;
    }

    setIsValidating(true);
    setValidationAttempts(prev => prev + 1);

    try {
      // Secure API call to backend for token and email validation
      const response = await axios.post('/api/whiteboard/checkInvitees', {
        token: inviteToken,
        email: userEmail.trim().toLowerCase()
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout for security
      });

      if (response.status === 200) {
        const { isExisted, inviteeRole, message } = response.data;
        
        showToast(message || 'Invite link verified successfully!', 'success');
        
        // Hide the email modal
        setShowEmailModal(false);
        
        // Mark validation as complete - this gates all other API calls
        setIsValidationComplete(true);
        
        if (!isExisted) {
          // User doesn't exist - show registration flow
          setShowNotRegistered(true);
          
          // Redirect to registration with secure pre-filled data
          setTimeout(() => {
            const registrationUrl = new URL('/register', window.location.origin);
            registrationUrl.searchParams.set('postRegister', `/whiteboard/${whiteboardId}`);
            registrationUrl.searchParams.set('collaborator', userEmail);
            if (inviteeRole) {
              registrationUrl.searchParams.set('role', inviteeRole);
            }
            router.push(registrationUrl.toString());
          }, 2500);
        } else {
          // User exists - redirect to login with secure pre-filled data
          const loginUrl = new URL('/login', window.location.origin);
          loginUrl.searchParams.set('postLogin', `/whiteboard/${whiteboardId}`);
          loginUrl.searchParams.set('collaborator', userEmail);
          if (inviteeRole) {
            loginUrl.searchParams.set('role', inviteeRole);
          }
          router.push(loginUrl.toString());
        }
        
        // Signal successful validation to parent component
        onValidationComplete(true, userEmail);
      }
    } catch (error: any) {
      // Comprehensive error handling for different scenarios
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      
      if (status === 401) {
        if (message?.includes('expired')) {
          showToast('This invitation link has expired. Please request a new invitation.', 'error');
        } else {
          showToast('This invitation link is invalid or has been revoked.', 'error');
        }
      } else if (status === 400) {
        showToast('Invalid request data. Please check your email and try again.', 'warning');
      } else if (status === 403) {
        showToast('You are not authorized to access this whiteboard.', 'error');
      } else if (error.code === 'ECONNABORTED') {
        showToast('Request timed out. Please check your connection and try again.', 'error');
      } else {
        showToast(message || 'Validation failed. Please try again.', 'error');
      }
      
      // Signal failed validation to parent component
      onValidationComplete(false);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle form submission for email validation
   * Prevents default form behavior and triggers secure validation
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateInviteLink(email);
  };

  /**
   * Handle email input changes with real-time validation feedback
   * Provides immediate feedback for email consistency
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const email = e.target.value;
    setEmail(value);
    HandleInviteeEmail(email);
    // Real-time email consistency validation
    if (collaboratorEmail && value && value.toLowerCase() !== decodeURIComponent(collaboratorEmail).toLowerCase()) {
      showToast('Email should match your whiteboard invitation', 'warning');
    }


  };

  // Email Input Modal - Security gateway for invite access
  if (showEmailModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
            {/* Header with security indicators */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Secure Whiteboard Access
              </h1>
              <p className="text-gray-600">
                Please verify your email to join this collaborative whiteboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}

                  onChange={handleEmailChange}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-800"
                  required
                  disabled={isValidating}
                />
                {collaboratorEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 This should match the email from your invitation
                  </p>
                )}
              </div>

              {/* Security information */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Secure Verification</p>
                    <p className="text-xs text-purple-600">Your invitation will be validated before access is granted</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isValidating || !email.trim() || validationAttempts >= MAX_VALIDATION_ATTEMPTS}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold 
                         hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 transform hover:scale-105"
              >
                {isValidating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Cardio size="20" stroke="3" speed="2" color="white" />
                    <span>Validating Invitation...</span>
                  </div>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>

            {/* Security footer with attempt tracking */}
            <div className="text-center text-xs text-gray-500 mt-6">
              <p>🔒 Secure invitation system powered by CollaborativeX</p>
              {validationAttempts > 0 && validationAttempts < MAX_VALIDATION_ATTEMPTS && (
                <p className="mt-1 text-orange-600">
                  Attempts remaining: {MAX_VALIDATION_ATTEMPTS - validationAttempts}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Required Modal - User doesn't exist in system
  if (showNotRegistered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white">
        <div className="text-center max-w-md mx-4 p-8">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome to CollaborativeX!</h2>
            <p className="text-xl text-white/90 mb-3">
              You're invited to collaborate, but need to create an account first.
            </p>
            <p className="text-white/80 leading-relaxed">
              Don't worry - we'll create your account and bring you right back to the whiteboard. 
              Your email will be pre-filled to make it quick and easy! 
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-3 text-white/70">
              <Cardio size="24" stroke="2" speed="1.5" color="currentColor" />
              <span className="font-medium">Setting up your account...</span>
            </div>
            <div className="text-sm text-white/60">
              You'll be redirected to registration in a few seconds
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteValidation;