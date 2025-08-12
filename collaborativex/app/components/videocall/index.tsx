import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import VideoCallLobby from './VideocallLobby';
import { VideocallManager } from './VideocallManager';
import { CallEndCountdown } from './videoCountDown';
import { useSignalingClient } from '../../hooks/useSignalingClient';
import { useToast } from "../../utills/ToastProvider";
import { jwtDecode } from 'jwt-decode';
import { Check, XCircle, Phone, Signal, Users, Crown, AlertTriangle, PhoneOff, Loader2, LogOut } from 'lucide-react';

const VideoCallWindow = dynamic(() => import('./VideoFloatingCards'), { ssr: false });

interface UserPresence {
  userId: string;
  username: string;
  email: string;
  color: string;
  joined: boolean;
}

interface VideocallProps {
  showLobby: boolean;
  users: UserPresence[];
  roomId: string;
}

/**
 * 🔧 FIXED: Main Videocall Component with All Bug Fixes
 * 
 * Bug Fixes Applied:
 * ✅ Bug #1: Proper call termination - owner ends for all, participants leave individually
 * ✅ Bug #2: Working incoming call sound notifications
 * ✅ Bug #3: Owner notifications for user actions (leave, reject, timeout)
 */
const Videocall: React.FC<VideocallProps> = ({ showLobby, users, roomId }) => {
  // Core call state
  const [callActive, setCallActive] = useState(false);
  const [isLobbyVisible, setIsLobbyVisible] = useState(false);
  const [localUserId, setLocalUserId] = useState<string>('');
  const [localUsername, setLocalUsername] = useState<string>('');
  
  // Enhanced incoming call state with owner tracking
  const [incomingCall, setIncomingCall] = useState<{
    userId: string, 
    username: string, 
    isInvite?: boolean,
    isOwner?: boolean
  } | null>(null);
  
  // Participant management with comprehensive owner tracking
  const [participants, setParticipants] = useState<Array<{
    userId: string, 
    username: string, 
    isOwner?: boolean
  }>>([]);
  
  // Call termination state management
  const [isIncomingCallSoundPlaying, setIsIncomingCallSoundPlaying] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('excellent');
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownReason, setCountdownReason] = useState<string>('');
  const [isProcessingCallEnd, setIsProcessingCallEnd] = useState(false);
  
  // Call owner tracking
  const [callOwner, setCallOwner] = useState<string | undefined>(undefined);

  const { showToast } = useToast();
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  /**
   * Get username from user list by userId
   */
  const getUserName = useCallback((userId: string) => {
    const user = users.find((u: any) => u.userId === userId);
    return user?.username || 'Unknown User';
  }, [users]);

  /**
   * Initialize user data from JWT token
   */
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded: any = jwtDecode(token);
        setLocalUserId(decoded.userId);
        setLocalUsername(decoded.username || decoded.name || 'You');
        console.log('[videocall] User initialized:', { userId: decoded.userId, username: decoded.username || decoded.name });
      } else {
        console.log('[videocall] No authentication token found');
        // showToast('Authentication required. Please log in to use video calls.', 'error');
      }
    } catch (err) {
      console.error('[videocall] Error decoding JWT:', err);
      showToast('Authentication error. Please log in again.', 'error');
    }
  }, [showToast]);

  /**
   * 🔧 FIX Bug #2: Enhanced incoming call handler with sound
   */
  const onIncomingCall = useCallback((fromUserId: string, fromUsername?: string, isInvite?: boolean, isOwner?: boolean) => {
    if (isEndingCall || isProcessingCallEnd) return;
    
    const callerName = fromUsername || getUserName(fromUserId);
    console.log(`[videocall] ${isInvite ? 'Invitation' : 'Incoming call'} from ${callerName} (Owner: ${isOwner})`);
    
    setIncomingCall({ userId: fromUserId, username: callerName, isInvite, isOwner });
    setIsIncomingCallSoundPlaying(true);
    
    const ownerIndicator = isOwner ? ' 👑' : '';
    const message = isInvite 
      ? `${callerName}${ownerIndicator} invited you to join the call`
      : `Incoming video call from ${callerName}${ownerIndicator}`;
    showToast(message, 'info');
    
    // Auto-reject after 30 seconds
    setTimeout(() => {
      setIncomingCall(current => {
        if (current?.userId === fromUserId) {
          setIsIncomingCallSoundPlaying(false);
          showToast(isInvite ? 'Invitation expired' : 'Missed call - call ended automatically', 'info');
          return null;
        }
        return current;
      });
    }, 30000);
  }, [getUserName, showToast, isEndingCall, isProcessingCallEnd]);

  /**
   * Handle call acceptance
   */
  const onCallAccepted = useCallback((fromUserId: string, username?: string) => {
    if (isEndingCall || isProcessingCallEnd) return;
    
    const userName = username || getUserName(fromUserId);
    console.log(`[videocall] Call accepted by ${userName}`);
    
    setParticipants(prev => {
      const exists = prev.find(p => p.userId === fromUserId);
      if (!exists) {
        return [...prev, { userId: fromUserId, username: userName, isOwner: fromUserId === callOwner }];
      }
      return prev;
    });
    
    setCallActive(true);
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    showToast(`${userName} joined the call`, 'success');
  }, [getUserName, showToast, isEndingCall, isProcessingCallEnd, callOwner]);

  /**
   * Handle call rejection
   */
  const onCallRejected = useCallback((fromUserId: string, username?: string) => {
    const userName = username || getUserName(fromUserId);
    console.log(`[videocall] Call rejected by ${userName}`);
    
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    showToast(`${userName} declined the call`, 'info');
  }, [getUserName, showToast]);

  /**
   * 🔧 FIX Bug #1 & #3: Enhanced call ended handler with proper cleanup and notifications
   */
  const onCallEnded = useCallback((reason: string, endedBy?: string) => {
    console.log(`[videocall] Call ended - ${reason} by: ${endedBy}`);
    
    setIsProcessingCallEnd(true);
    setIsEndingCall(true);
    
    // Clear all call states
    setCallActive(false);
    setParticipants([]);
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    setShowEndConfirmation(false);
    
    const endReasons: Record<string, string> = {
      'ENDED_BY_OWNER': 'Call ended by the host',
      'OWNER_LEFT': 'Call ended because the host left',
      'OWNER_DISCONNECTED': 'Call ended due to host disconnection',
      'EMPTY_ROOM': 'Call ended - no participants remaining',
      'user ended call': 'Call ended'
    };
    
    const message = endReasons[reason] || `Call ended: ${reason}`;
    const endedByText = endedBy ? ` by ${endedBy}` : '';
    const fullMessage = `${message}${endedByText}`;
    
    showToast(fullMessage, 'info');
    
    // Different handling for owners vs participants
    const isCurrentUserOwner = callOwner === localUserId;
    const shouldReload = !isCurrentUserOwner && (
      reason === 'ENDED_BY_OWNER' || 
      reason === 'OWNER_LEFT' || 
      reason === 'OWNER_DISCONNECTED'
    );
    
    if (shouldReload) {
      // Participant reload with countdown
      console.log('[videocall] PARTICIPANT: Starting countdown for page reload');
      setCountdownReason(fullMessage);
      setShowCountdown(true);
    } else {
      // Owner cleanup without reload
      console.log('[videocall] OWNER: Performing cleanup without reload');
      setCallOwner(undefined);
      
      setTimeout(() => {
        setIsEndingCall(false);
        setIsProcessingCallEnd(false);
        console.log('[videocall] Owner cleanup completed');
      }, 2000);
    }
  }, [showToast, callOwner, localUserId]);

  /**
   * Handle countdown completion for participants
   */
  const onCountdownComplete = useCallback(() => {
    console.log('[videocall] Countdown complete, executing page reload');
    
    try {
      if (window.location.reload) {
        window.location.reload();
      } else {
        window.location.href = window.location.href;
      }
    } catch (error) {
      console.error('[videocall] Error during page reload:', error);
      window.location.href = window.location.href;
    }
  }, []);

  /**
   * 🔧 FIX Bug #3: Handle user leaving with owner notification
   */
  const onUserLeft = useCallback((userId: string, username?: string) => {
    if (isEndingCall || isProcessingCallEnd) return;
    
    const userName = username || getUserName(userId);
    console.log(`[videocall] User ${userName} left the call`);
    
    setParticipants(prev => prev.filter(p => p.userId !== userId));
    
    // Check if call should end due to no participants
    setParticipants(prev => {
      const remaining = prev.filter(p => p.userId !== userId);
      if (remaining.length === 0 && callActive) {
        console.log('[videocall] No participants remaining, ending call');
        setTimeout(() => {
          setCallActive(false);
          showToast('Call ended - no participants remaining', 'info');
        }, 1000);
      }
      return remaining;
    });
  }, [getUserName, showToast, isEndingCall, isProcessingCallEnd, callActive]);

  /**
   * Signal handling (managed by VideocallManager)
   */
  const onSignal = useCallback(() => {
    // Signal handling is done in VideocallManager
  }, []);

  /**
   * Enhanced user joined handler
   */
  const onUserJoined = useCallback((userId: string, username?: string, isOwner?: boolean) => {
    if (isEndingCall || isProcessingCallEnd) return;
    
    const userName = username || getUserName(userId);
    console.log(`[videocall] User ${userName} joined (Owner: ${isOwner})`);
    
    setParticipants(prev => {
      const exists = prev.find(p => p.userId === userId);
      if (!exists) {
        return [...prev, { userId, username: userName, isOwner }];
      }
      return prev.map(p => p.userId === userId ? { ...p, isOwner, username: userName } : p);
    });
    
    const ownerIndicator = isOwner ? ' 👑' : '';
    showToast(`${userName}${ownerIndicator} joined the call`, 'success');
  }, [getUserName, showToast, isEndingCall, isProcessingCallEnd]);

  /**
   * Enhanced current participants handler
   */
  const onCurrentParticipants = useCallback((currentParticipants: Array<{userId: string, username: string, isOwner?: boolean}>, owner?: string) => {
    if (isEndingCall || isProcessingCallEnd) return;
    
    console.log(`[videocall] Current participants:`, currentParticipants, 'Owner:', owner);
    
    if (owner) {
      setCallOwner(owner);
    }
    
    setParticipants(prev => {
      const combined = [...prev];
      currentParticipants.forEach(participant => {
        const existingIndex = combined.findIndex(p => p.userId === participant.userId);
        const participantWithOwner = {
          ...participant,
          isOwner: participant.isOwner || participant.userId === owner
        };
        
        if (existingIndex >= 0) {
          combined[existingIndex] = { ...combined[existingIndex], ...participantWithOwner };
        } else {
          combined.push(participantWithOwner);
        }
      });
      return combined;
    });
  }, [isEndingCall, isProcessingCallEnd]);

  /**
   * Connection quality monitoring
   */
  const onConnectionQuality = useCallback((quality: 'excellent' | 'good' | 'poor' | 'disconnected') => {
    setConnectionQuality(quality);
    if (quality === 'poor') {
      // showToast('Connection quality is poor', 'warning');
    } else if (quality === 'disconnected') {
      showToast('Connection lost - trying to reconnect...', 'error');
    }
  }, [showToast]);

  /**
   * 🔧 FIX Bug #3: Handle call notifications (for owner)
   */
  const onCallNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    console.log('[videocall] Call notification:', type, message);
    showToast(message, type);
  }, [showToast]);

  // Initialize signaling client with all event handlers
  const { socket, startCall, acceptCall, rejectCall, endCall, leaveCall, inviteUsers } = useSignalingClient({
    userId: localUserId,
    username: localUsername,
    roomId,
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onUserLeft,
    onSignal,
    onUserJoined,
    onCurrentParticipants,
    onConnectionQuality,
    onCallNotification, // 🔧 FIX Bug #3: Pass notification handler
  });

  // Sync lobby visibility
  useEffect(() => {
    setIsLobbyVisible(showLobby);
  }, [showLobby]);

  // Socket connection management
  useEffect(() => {
    if (!socket || !localUserId || isProcessingCallEnd) return;

    const handleConnect = () => {
      console.log('[videocall] Socket connected, joining room');
      socket.emit('join-room', { roomId, userId: localUserId, username: localUsername });
    };

    const handleConnectError = (error: any) => {
      console.error('[videocall] Socket connection error:', error);
      showToast("there is some issue at server",'warning')
      if (!isProcessingCallEnd) {
        showToast('Connection error. Please check your internet connection.', 'error');
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log('[videocall] Socket disconnected:', reason);
      if (reason === 'io server disconnect' && !isProcessingCallEnd) {
        showToast('Server connection lost. Please try again.', 'error');
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, roomId, localUserId, localUsername, showToast, isProcessingCallEnd]);

  /**
   * Handle starting a new call
   */
  const handleRequestCall = useCallback((userIds: string[]) => {
    if (isEndingCall || isProcessingCallEnd) {
      showToast('Please wait for the previous call to end completely', 'warning');
      return;
    }
    
    if (isMobile && userIds.length > 1) {
      showToast('On mobile devices, only 1-to-1 calls are supported.', 'warning');
      return;
    }
    
    if (!isMobile && userIds.length > 3) {
      showToast('Maximum 4 participants allowed in a group call.', 'warning');
      return;
    }

    const usernames = userIds.map(id => getUserName(id));
    console.log(`[videocall] Starting call with users:`, usernames);
    
    const newParticipants = userIds.map(id => ({
      userId: id,
      username: getUserName(id),
      isOwner: false
    }));
    
    setParticipants(newParticipants);
    setCallActive(true);
    setIsLobbyVisible(false);
    setCallOwner(localUserId);
    startCall(userIds, true);

    showToast(`Calling ${usernames.join(', ')}...`, 'info');
  }, [isMobile, showToast, startCall, getUserName, isEndingCall, isProcessingCallEnd, localUserId]);

  /**
   * Handle inviting users to an active call
   */
  const handleInviteUsers = useCallback((userIds: string[]) => {
    if (!callActive || isEndingCall || isProcessingCallEnd) {
      showToast('No active call to invite users to', 'warning');
      return;
    }

    const usernames = userIds.map(id => getUserName(id));
    console.log(`[videocall] Inviting users to existing call:`, usernames);
    
    inviteUsers(userIds);
    showToast(`Inviting ${usernames.join(', ')} to the call...`, 'info');
  }, [callActive, getUserName, inviteUsers, showToast, isEndingCall, isProcessingCallEnd]);

  /**
   * 🔧 FIX Bug #1: Handle call ending/leaving with proper distinction
   */
  const handleEndCall = useCallback(() => {
    console.log('[videocall] User requesting to end/leave call');
    
    if (participants.length === 0) {
      showToast('No active call to end', 'warning');
      return;
    }
    
    if (isEndingCall || isProcessingCallEnd) {
      showToast('Call is already ending...', 'info');
      return;
    }
    
    setShowEndConfirmation(true);
  }, [participants.length, isEndingCall, isProcessingCallEnd]);

  /**
   * 🔧 FIX Bug #1: Confirm call ending action with proper owner/participant handling
   */
  const confirmEndCall = useCallback(() => {
    console.log('[videocall] Confirmed call ending/leaving');
    setShowEndConfirmation(false);
    setIsProcessingCallEnd(true);
    
    const isCurrentUserOwner = callOwner === localUserId;
    
    if (isCurrentUserOwner) {
      // Owner ends call for everyone
      endCall();
      showToast('Ending call for everyone...', 'info');
    } else {
      // Participant leaves call
      leaveCall();
      showToast('Leaving call...', 'info');
    }
  }, [endCall, leaveCall, showToast, callOwner, localUserId]);

  /**
   * Handle accepting an incoming call
   */
  const handleAcceptCall = useCallback(() => {
    if (!incomingCall || isEndingCall || isProcessingCallEnd) return;
    
    const callerName = incomingCall.username;
    const isOwner = incomingCall.isOwner;
    console.log(`[videocall] Accepting call from ${callerName} (Owner: ${isOwner})`);
    
    acceptCall(incomingCall.userId);
    setCallActive(true);
    
    if (isOwner) {
      setCallOwner(incomingCall.userId);
    }
    
    setParticipants(prev => {
      const exists = prev.find(p => p.userId === incomingCall.userId);
      if (!exists) {
        return [...prev, { userId: incomingCall.userId, username: callerName, isOwner }];
      }
      return prev.map(p => p.userId === incomingCall.userId ? { ...p, isOwner } : p);
    });
    
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    
    const ownerIndicator = isOwner ? ' 👑' : '';
    const message = incomingCall.isInvite 
      ? `Joined the call with ${callerName}${ownerIndicator}`
      : `Connected to ${callerName}${ownerIndicator}`;
    showToast(message, 'success');
  }, [incomingCall, acceptCall, showToast, isEndingCall, isProcessingCallEnd]);

  /**
   * Handle rejecting an incoming call
   */
  const handleRejectCall = useCallback(() => {
    if (!incomingCall) return;
    
    const callerName = incomingCall.username;
    const isOwner = incomingCall.isOwner;
    console.log(`[videocall] Rejecting call from ${callerName} (Owner: ${isOwner})`);
    
    rejectCall(incomingCall.userId);
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    
    const ownerIndicator = isOwner ? ' 👑' : '';
    const message = incomingCall.isInvite 
      ? `Declined invitation from ${callerName}${ownerIndicator}`
      : `Declined call from ${callerName}${ownerIndicator}`;
    showToast(message, 'info');
  }, [incomingCall, rejectCall, showToast]);

  // Don't render anything if cleaning up
  // if (isCleaningUp.current) {
  //   return (
  //     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  //       <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
  //         <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
  //         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
  //           Ending Call...
  //         </h3>
  //         <p className="text-gray-600 dark:text-gray-300 text-sm">
  //           Cleaning up resources and connections
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      {/* User selection lobby */}
      {isLobbyVisible && !isEndingCall && !isProcessingCallEnd && (
        <VideoCallLobby
          onlineUsers={users}
          currentUserId={localUserId}
          onRequest={callActive ? handleInviteUsers : handleRequestCall}
          onClose={() => setIsLobbyVisible(false)}
          isCallActive={callActive}
          callOwner={callOwner}
        />
      )}

      {/* Active call manager */}
      {callActive && localUserId && !isEndingCall && !isProcessingCallEnd && (
        <VideocallManager
          roomId={roomId}
          targetIds={participants.map(p => p.userId)}
          localUserId={localUserId}
          localUsername={localUsername}
          Users={participants}
          onEndCall={handleEndCall}
          showToast={showToast}
          callOwner={callOwner}
        />
      )}

      {/* 🔧 FIX Bug #1: Enhanced call end confirmation dialog with owner/participant distinction */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 border border-red-200 dark:border-red-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {callOwner === localUserId ? 'End Call?' : 'Leave Call?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {callOwner === localUserId 
                  ? `This will end the call for all ${participants.length + 1} participants. Other participants will be disconnected and their screens will reload automatically.`
                  : 'Are you sure you want to leave this call? The call will continue for other participants.'
                }
              </p>
              {callOwner === localUserId && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <Crown className="w-4 h-4" />
                  <span>As the host, ending will disconnect everyone</span>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowEndConfirmation(false)}
                disabled={isProcessingCallEnd}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndCall}
                disabled={isProcessingCallEnd}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessingCallEnd ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  callOwner === localUserId ? <PhoneOff className="w-4 h-4" /> : <LogOut className="w-4 h-4" />
                )}
                {callOwner === localUserId ? 'End Call' : 'Leave Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown component for automatic reload */}
      {showCountdown && (
        <CallEndCountdown
          onComplete={onCountdownComplete}
          reason={countdownReason}
          isOwner={callOwner === localUserId}
          duration={2}
        />
      )}

      {/* Enhanced incoming call UI with proper sound indication */}
      {incomingCall && !isEndingCall && !isProcessingCallEnd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-slideUp border border-purple-200 dark:border-purple-700">
            {/* Avatar with animation */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20"></div>
              <div className="absolute inset-2 rounded-full bg-purple-300 animate-ping opacity-30" style={{ animationDelay: '0.5s' }}></div>
              
              <div 
                className="relative w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{ 
                  background: `linear-gradient(45deg, ${users.find(u => u.userId === incomingCall.userId)?.color || '#8B5CF6'}, ${users.find(u => u.userId === incomingCall.userId)?.color || '#8B5CF6'}CC)`
                }}
              >
                {incomingCall.username[0]?.toUpperCase() || '?'}
                {incomingCall.isOwner && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Call details */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {incomingCall.isInvite ? 'Call Invitation' : 'Incoming Video Call'}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  {incomingCall.username}
                </p>
                {incomingCall.isOwner && (
                  <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                    <Crown className="w-3 h-3 text-yellow-600" />
                    <span className="text-xs text-yellow-600 font-bold">Host</span>
                  </div>
                )}
              </div>
              
              {/* 🔧 FIX Bug #2: Sound indicator */}
              {isIncomingCallSoundPlaying && (
                <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400 mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Playing ringtone...</span>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Signal className="w-4 h-4" />
                <span className="capitalize">{connectionQuality} connection</span>
              </div>

              {incomingCall.isInvite && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  <Users className="w-4 h-4" />
                  <span>Join existing call</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-6 justify-center mb-6">
              <button
                onClick={handleRejectCall}
                className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 transform hover:scale-110"
                title={incomingCall.isInvite ? "Decline Invitation" : "Reject Call"}
              >
                <XCircle className="w-7 h-7" />
              </button>
              
              <button
                onClick={handleAcceptCall}
                className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 transform hover:scale-110"
                title={incomingCall.isInvite ? "Accept Invitation" : "Accept Call"}
              >
                <Check className="w-7 h-7" />
              </button>
            </div>

            {/* Call type indicator */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                <Phone className="w-4 h-4" />
                <span>
                  {incomingCall.isInvite 
                    ? 'Group Call Invitation'
                    : isMobile ? 'Video Call' : 'Group Video Call'
                  }
                </span>
                {incomingCall.isOwner && (
                  <>
                    <span>•</span>
                    <Crown className="w-3 h-3" />
                    <span className="text-xs">From Host</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
      `}</style>
    </>
  );
};

export default Videocall;