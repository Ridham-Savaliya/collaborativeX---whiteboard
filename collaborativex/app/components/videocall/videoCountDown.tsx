import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Crown, Clock } from 'lucide-react';

interface CallEndCountdownProps {
  onComplete: () => void;
  reason: string;
  isOwner?: boolean;
  duration?: number;
}

/**
 * 🔧 CRITICAL FIX: Call End Countdown Component
 * 
 * This component addresses Bug #3: Automatic page reload after call termination
 * 
 * Features:
 * - Shows countdown timer for participants before page reload
 * - Provides proper cleanup message for call owners
 * - Smooth animations and professional styling
 * - Different behavior for owners vs participants
 */
export const CallEndCountdown: React.FC<CallEndCountdownProps> = ({
  onComplete,
  reason,
  isOwner = false,
  duration = 2,
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsCompleted(true);
          clearInterval(timer);
          // Small delay to show completion state
          setTimeout(() => {
            onComplete();
          }, 200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete, isCompleted]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 border border-red-200 dark:border-red-700">
        <div className="text-center">
          {/* Status Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 dark:bg-gradient-to-br dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center shadow-lg">
            {isCompleted ? (
              <Loader2 className="w-10 h-10 text-red-600 dark:text-red-400 animate-spin" />
            ) : (
              <div className="relative">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Call Ended
          </h2>

          {/* Reason */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-sm">
            {reason}
          </p>

          {/* Owner Badge */}
          {isOwner && (
            <div className="flex items-center justify-center gap-2 mb-6 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700/50">
              <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                You were the host
              </span>
            </div>
          )}

          {/* Countdown or Completion State */}
          {isCompleted ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-lg font-medium">
                  {isOwner ? 'Cleaning up resources...' : 'Reloading page...'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Countdown Circle */}
              <div className="relative mx-auto w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - (duration - countdown) / duration)}`}
                    className="text-red-500 transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {countdown}
                  </span>
                </div>
              </div>

              {/* Action Description */}
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {isOwner ? 'Cleanup in Progress' : 'Auto-reload in Progress'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isOwner 
                    ? 'Stopping your camera and microphone...' 
                    : 'Page will refresh automatically to clean up the call...'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CallEndCountdown;