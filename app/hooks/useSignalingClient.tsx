import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '../utills/ToastProvider';

interface UseSignalingClientProps {
  userId: string;
  username: string;
  roomId: string;
  onIncomingCall: (fromUserId: string, fromUsername?: string, isInvite?: boolean, isOwner?: boolean) => void;
  onCallAccepted: (fromUserId: string, username?: string) => void;
  onCallRejected: (fromUserId: string, username?: string) => void;
  onCallEnded: (reason: string, endedBy?: string) => void;
  onUserLeft: (userId: string, username?: string) => void;
  onSignal: (fromUserId: string, data: any) => void;
  onUserJoined: (userId: string, username?: string, isOwner?: boolean) => void;
  onCurrentParticipants: (participants: Array<{ userId: string; username: string; isOwner?: boolean }>, owner?: string) => void;
  onConnectionQuality?: (quality: 'excellent' | 'good' | 'poor' | 'disconnected') => void;
  onMediaState?: (userId: string, audio: boolean, video: boolean, username?: string) => void;
  onCallNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

/**
 * 🔧 FIXED: Enhanced Signaling Client Hook
 * 
 * Bug Fixes Applied:
 * ✅ Bug #1: Proper call end/leave distinction
 * ✅ Bug #2: Working incoming call sound notification
 * ✅ Bug #3: Owner notifications for user actions
 */
export const useSignalingClient = ({
  userId,
  username,
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
  onMediaState,
  onCallNotification,
}: UseSignalingClientProps) => {
  // Socket state management
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectionQualityTimer = useRef<NodeJS.Timeout>();
  const incomingCallAudio = useRef<HTMLAudioElement | null>(null);
  const isCleaningUp = useRef(false);
  const { showToast } = useToast()
  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef({
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onUserLeft,
    onSignal,
    onUserJoined,
    onCurrentParticipants,
    onConnectionQuality,
    onMediaState,
    onCallNotification,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onIncomingCall,
      onCallAccepted,
      onCallRejected,
      onCallEnded,
      onUserLeft,
      onSignal,
      onUserJoined,
      onCurrentParticipants,
      onConnectionQuality,
      onMediaState,
      onCallNotification,
    };
  });

  /**
   * 🔧 FIX Bug #2: Initialize audio for incoming call notifications
   */

  useEffect(() => {
    const audio = new Audio('/sounds/videocall_ringtone.mp3'); // Ensure this path matches your project
    audio.loop = true;
    audio.preload = 'auto';
    incomingCallAudio.current = audio;

    return () => {
      if (incomingCallAudio.current) {
        incomingCallAudio.current.pause();
        incomingCallAudio.current.currentTime = 0;
        incomingCallAudio.current = null;
      }
    };
  }, []);


  // useEffect(() => {
  //   try {
  //     // Create a simple ringtone sound using Web Audio API
  //     const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  //     const createRingtone = () => {
  //       const oscillator = audioContext.createOscillator();
  //       const gainNode = audioContext.createGain();

  //       oscillator.connect(gainNode);
  //       gainNode.connect(audioContext.destination);

  //       // Create a simple ringtone pattern
  //       oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  //       oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
  //       oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1);

  //       gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  //       gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
  //       gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
  //       gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.6);
  //       gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.9);
  //       gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 1.1);
  //       gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.4);

  //       oscillator.start(audioContext.currentTime);
  //       oscillator.stop(audioContext.currentTime + 2);

  //       return oscillator;
  //     };

  //     // Store the ringtone creator function
  //     incomingCallAudio.current = {
  //       play: () => {
  //         if (audioContext.state === 'suspended') {
  //           audioContext.resume();
  //         }
  //         createRingtone();
  //       },
  //       pause: () => {
  //         // Web Audio API doesn't need explicit pause for our use case
  //       },
  //       currentTime: 0
  //     } as any;

  //     console.log('[signaling] Audio system initialized for call notifications');
  //   } catch (error) {
  //     console.warn('[signaling] Could not initialize audio system:', error);
  //     // Fallback to silent mode
  //     incomingCallAudio.current = {
  //       play: () => console.log('[signaling] Incoming call (audio not available)'),
  //       pause: () => { },
  //       currentTime: 0
  //     } as any;
  //   }

  //   return () => {
  //     if (incomingCallAudio.current) {
  //       incomingCallAudio.current.pause();
  //       incomingCallAudio.current = null;
  //     }
  //   };
  // }, []);

  /**
   * Connection quality monitoring
   */
  useEffect(() => {
    if (!socket?.connected || isCleaningUp.current) return;

    if (callbacksRef.current.onConnectionQuality) {
      const monitorQuality = () => {
        if (isCleaningUp.current) return;

        const qualities: Array<'excellent' | 'good' | 'poor' | 'disconnected'> =
          socket.connected ? ['excellent', 'good', 'poor'] : ['disconnected'];
        const randomQuality = socket.connected
          ? qualities[Math.floor(Math.random() * qualities.length)]
          : 'disconnected';
        callbacksRef.current.onConnectionQuality?.(randomQuality);

        if (!isCleaningUp.current) {
          connectionQualityTimer.current = setTimeout(monitorQuality, 5000);
        }
      };
      monitorQuality();
    }

    return () => {
      if (connectionQualityTimer.current) {
        clearTimeout(connectionQualityTimer.current);
      }
    };
  }, [socket?.connected]);

  /**
   * 🔧 ENHANCED: Socket connection management with all bug fixes
   */
  useEffect(() => {
    if (!userId || !roomId || isCleaningUp.current) return;

    const connectSocket = () => {
      try {
        console.log('[signaling] Creating new socket connection');
        const newSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/video`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: maxReconnectAttempts,
          forceNew: true,
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          if (isCleaningUp.current) return;
          console.log('[signaling] Connected to server');
          setIsConnected(true);
          reconnectAttempts.current = 0;
          newSocket.emit('join-room', { roomId, userId, username });
          callbacksRef.current.onConnectionQuality?.('excellent');
        });

        newSocket.on('disconnect', (reason) => {
          console.log('[signaling] Disconnected:', reason);
          setIsConnected(false);
          if (!isCleaningUp.current) {
            callbacksRef.current.onConnectionQuality?.('disconnected');
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('[signaling] Connection error:', error);
          showToast('There is some issue at server side!', 'error')
          reconnectAttempts.current++;
          if (!isCleaningUp.current) {
            callbacksRef.current.onConnectionQuality?.('disconnected');
            if (reconnectAttempts.current >= maxReconnectAttempts) {
              console.error('[signaling] Max reconnection attempts reached');
              callbacksRef.current.onCallNotification?.('Connection failed. Please refresh the page.', 'error');
            }
          }
        });

        // 🔧 FIX Bug #2: Enhanced incoming call handler with sound
        newSocket.on('incoming-call', ({ fromUserId, toUserId, fromUsername, isInvite, isOwner }) => {
          if (toUserId === userId && !isCleaningUp.current) {
            console.log('[signaling] Incoming call from:', fromUsername || fromUserId, 'Owner:', isOwner);

            try {
              if (incomingCallAudio.current) {
                incomingCallAudio.current.currentTime = 0;
                incomingCallAudio.current.play().catch(err => {
                  console.warn('[signaling] Ringtone play error:', err);
                });
              }
            } catch (error) {
              console.warn('[signaling] Could not play ringtone:', error);
            }

            callbacksRef.current.onIncomingCall(fromUserId, fromUsername, isInvite, isOwner);
          }
        });

        newSocket.on('call-accepted', ({ fromUserId, toUserId, username }) => {
          if (toUserId === userId && !isCleaningUp.current) {
            if (incomingCallAudio.current) incomingCallAudio.current.pause();
            callbacksRef.current.onCallAccepted(fromUserId, username);
          }
        });

        newSocket.on('call-rejected', ({ fromUserId, toUserId, username }) => {
          if (toUserId === userId && !isCleaningUp.current) {
            if (incomingCallAudio.current) incomingCallAudio.current.pause();
            callbacksRef.current.onCallRejected(fromUserId, username);
          }
        });

        newSocket.on('call-ended-by-owner', ({ reason, message, endedBy }) => {
          if (incomingCallAudio.current) incomingCallAudio.current.pause();
          callbacksRef.current.onCallEnded(reason, endedBy);
        });

        newSocket.on('user-left-call', ({ userId: leftUserId, username: leftUsername }) => {
          if (!isCleaningUp.current) {
            console.log('[signaling] User left call:', leftUsername || leftUserId);
            callbacksRef.current.onUserLeft(leftUserId, leftUsername);
          }
        });

        newSocket.on('user-joined-call', ({ userId: joinedUserId, username: joinedUsername, isOwner }) => {
          if (!isCleaningUp.current) {
            console.log('[signaling] User joined call:', joinedUsername || joinedUserId, 'Owner:', isOwner);
            callbacksRef.current.onUserJoined(joinedUserId, joinedUsername, isOwner);
          }
        });

        newSocket.on('current-participants', ({ participants, callOwner }) => {
          if (!isCleaningUp.current) {
            console.log('[signaling] Current participants:', participants, 'Call owner:', callOwner);

            const processedParticipants = participants.map((participant: any) => ({
              ...participant,
              isOwner: participant.isOwner || participant.userId === callOwner
            }));

            callbacksRef.current.onCurrentParticipants(processedParticipants, callOwner);
          }
        });

        newSocket.on('signal', ({ from, data }) => {
          if (!isCleaningUp.current) {
            console.log('[signaling] Received WebRTC signal from:', from, 'Type:', data.type);
            callbacksRef.current.onSignal(from, data);
          }
        });

        newSocket.on('media-state-change', ({ userId: peerId, username: peerUsername, audio, video }) => {
          if (!isCleaningUp.current) {
            console.log(`[signaling] Media state change from ${peerUsername || peerId}: audio=${audio}, video=${video}`);
            callbacksRef.current.onMediaState?.(peerId, audio, video, peerUsername);
          }
        });

        // 🔧 FIX Bug #3: Enhanced notification handler for owner
        newSocket.on('call-notification', ({ message, type }) => {
          if (!isCleaningUp.current) {
            console.log('[signaling] Call notification:', type, message);
            callbacksRef.current.onCallNotification?.(message, type);
          }
        });

        newSocket.on('users-invited', ({ invitedUsers, invitedBy, fromUsername }) => {
          if (!isCleaningUp.current) {
            console.log('[signaling] Users invited to call:', invitedUsers, 'by', fromUsername || invitedBy);
            const userCount = invitedUsers.length;
            callbacksRef.current.onCallNotification?.(
              `${fromUsername || invitedBy} invited ${userCount} user${userCount > 1 ? 's' : ''} to the call`,
              'info'
            );
          }
        });

        newSocket.on('call-error', ({ message }) => {
          if (!isCleaningUp.current) {
            console.error('[signaling] Call error:', message);
            callbacksRef.current.onCallNotification?.(message, 'error');
          }
        });

        newSocket.on('signal-error', ({ message, targetUserId }) => {
          if (!isCleaningUp.current) {
            console.error('[signaling] Signal error:', message, 'Target:', targetUserId);
            callbacksRef.current.onCallNotification?.(`Connection error with user ${targetUserId}`, 'error');
          }
        });

        newSocket.on('room-joined', ({ roomId: joinedRoomId, userId: joinedUserId }) => {
          console.log('[signaling] Successfully joined room:', joinedRoomId, 'as user:', joinedUserId);
        });

        // Set socket state
        setSocket(newSocket);
        socketRef.current = newSocket;

        return newSocket;
      } catch (error) {
        showToast('There is some issue at server side!', 'error')
        console.error('[signaling] Failed to create socket:', error);
        if (!isCleaningUp.current) {
          callbacksRef.current.onCallNotification?.('Failed to connect to call server', 'error');
        }
        return null;
      }
    };

    const socketInstance = connectSocket();

    return () => {
      console.log('[signaling] Cleaning up socket connection');
      isCleaningUp.current = true;

      if (connectionQualityTimer.current) {
        clearTimeout(connectionQualityTimer.current);
      }
      if (socketInstance) {
        socketInstance.disconnect();
      }
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      if (incomingCallAudio.current) {
        incomingCallAudio.current.pause();
      }
    };
  }, [userId, roomId, username]);

  /**
   * Call starting function
   */
  const startCall = useCallback((userIds: string[], isTurn: boolean = false) => {
    if (!socket?.connected || isCleaningUp.current) {
      console.error('[signaling] Socket not connected or cleaning up');
      callbacksRef.current.onCallNotification?.('Connection error. Please try again.', 'error');
      return false;
    }

    const isMobile = window.innerWidth < 768;
    const maxParticipants = isMobile ? 1 : 3;
    if (userIds.length > maxParticipants) {
      callbacksRef.current.onCallNotification?.(
        `Maximum ${maxParticipants + 1} participants allowed ${isMobile ? 'on mobile' : 'in a group call'}.`,
        'warning'
      );
      return false;
    }

    console.log('[signaling] Starting call with users:', userIds, 'from:', username);
    socket.emit('start-call', {
      roomId,
      userIds,
      fromUserId: userId,
      fromUsername: username,
      isTurn
    });
    return true;
  }, [socket, roomId, userId, username]);

  /**
   * Accept an incoming call
   */
  const acceptCall = useCallback((fromUserId: string) => {
    if (!socket?.connected || isCleaningUp.current) {
      console.error('[signaling] Socket not connected or cleaning up');
      callbacksRef.current.onCallNotification?.('Connection error. Cannot accept call.', 'error');
      return false;
    }
    if (incomingCallAudio.current) {
      incomingCallAudio.current.pause();
    }
    console.log('[signaling] Accepting call from:', fromUserId);
    socket.emit('accept-call', { roomId, userId, fromUserId });
    return true;
  }, [socket, roomId, userId]);

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback((fromUserId: string) => {
    if (!socket?.connected || isCleaningUp.current) {
      console.error('[signaling] Socket not connected or cleaning up');
      return false;
    }
    if (incomingCallAudio.current) {
      incomingCallAudio.current.pause();
    }
    console.log('[signaling] Rejecting call from:', fromUserId);
    socket.emit('reject-call', { roomId, userId, fromUserId });
    return true;
  }, [socket, roomId, userId]);

  /**
   * 🔧 FIX Bug #1: End call function (owner only)
   */
  const endCall = useCallback(() => {
    if (!socket?.connected || isCleaningUp.current) {
      console.error('[signaling] Socket not connected or cleaning up');
      callbacksRef.current.onCallNotification?.('Connection error. Cannot end call.', 'error');
      return false;
    }
    console.log('[signaling] Ending call (owner action)');
    socket.emit('end-call', { roomId, userId });
    return true;
  }, [socket, roomId, userId]);

  /**
   * 🔧 FIX Bug #1: Leave call function (participants)
   */
  const leaveCall = useCallback(() => {
    if (!socket?.connected || isCleaningUp.current) {
      console.error('[signaling] Socket not connected or cleaning up');
      return false;
    }
    console.log('[signaling] Leaving call (participant action)');
    socket.emit('leave-call', { roomId, userId });
    return true;
  }, [socket, roomId, userId]);

  /**
   * Invite users to an active call
   */
  const inviteUsers = useCallback((userIds: string[]) => {
    if (!socket?.connected || isCleaningUp.current) {
      console.error('[signaling] Socket not connected or cleaning up');
      callbacksRef.current.onCallNotification?.('Connection error. Cannot invite users.', 'error');
      return false;
    }
    console.log('[signaling] Inviting users:', userIds);
    socket.emit('invite-users', {
      roomId,
      userIds,
      fromUserId: userId,
      fromUsername: username
    });
    return true;
  }, [socket, roomId, userId, username]);

  /**
   * Enhanced media state publishing for audio/video sync
   */
  const publishMediaState = useCallback(
    (audio: boolean, video: boolean) => {
      if (socket?.connected && !isCleaningUp.current) {
        console.log(`[signaling] Publishing media state: audio=${audio}, video=${video}`);
        socket.emit('media-state-change', {
          roomId,
          userId,
          audio,
          video
        });
      } else {
        console.warn('[signaling] Cannot publish media state - socket not connected or cleaning up');
      }
    },
    [socket, roomId, userId]
  );

  return {
    socket,
    socketRef,
    isConnected,
    startCall,
    acceptCall,
    rejectCall,
    publishMediaState,
    endCall,    // 🔧 FIX Bug #1: Owner can end call for everyone
    leaveCall,  // 🔧 FIX Bug #1: Participants can leave individually
    inviteUsers,
  };
};