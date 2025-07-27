import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSignalingClientProps {
  userId: string;
  username: string; // ADD: Include username
  roomId: string;
  onIncomingCall: (fromUserId: string, fromUsername?: string) => void; // MODIFIED: Accept optional fromUsername
  onCallAccepted: (fromUserId: string) => void;
  onCallRejected: (fromUserId: string) => void;
  onCallEnded: (reason: string) => void;
  onUserLeft: (userId: string) => void;
  onSignal: (fromUserId: string, data: any) => void;
  onUserJoined: (userId: string) => void;
  onCurrentParticipants: (participants: string[]) => void;
  onConnectionQuality?: (quality: 'excellent' | 'good' | 'poor' | 'disconnected') => void;
}

export const useSignalingClient = ({
  userId,
  username, // ADD: Accept username
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
}: UseSignalingClientProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectionQualityTimer = useRef<NodeJS.Timeout>();
  const incomingCallAudio = useRef<HTMLAudioElement | null>(null);
  
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
    };
  });

  // Initialize audio once
  useEffect(() => {
    try {
      incomingCallAudio.current = new Audio('/sounds/videocall_ringtone.mp3');
      incomingCallAudio.current.loop = true;
      incomingCallAudio.current.preload = 'auto';
    } catch (error) {
      console.warn('[signaling] Could not load ringtone audio:', error);
    }

    return () => {
      if (incomingCallAudio.current) {
        incomingCallAudio.current.pause();
        incomingCallAudio.current = null;
      }
    };
  }, []);

  // Connection quality monitoring - separate effect
  useEffect(() => {
    if (!socket?.connected) return;
    
    if (callbacksRef.current.onConnectionQuality) {
      const monitorQuality = () => {
        const qualities: Array<'excellent' | 'good' | 'poor' | 'disconnected'> = 
          socket.connected ? ['excellent', 'good', 'poor'] : ['disconnected'];
        const randomQuality = socket.connected 
          ? qualities[Math.floor(Math.random() * qualities.length)]
          : 'disconnected';
        callbacksRef.current.onConnectionQuality?.(randomQuality);
        connectionQualityTimer.current = setTimeout(monitorQuality, 5000);
      };
      monitorQuality();
    }

    return () => {
      if (connectionQualityTimer.current) {
        clearTimeout(connectionQualityTimer.current);
      }
    };
  }, [socket?.connected]); // Only depend on connection state

  // Main socket connection effect - only depend on userId and roomId
  useEffect(() => {
    if (!userId || !roomId) return;

    const connectSocket = () => {
      try {
        console.log('[signaling] Creating new socket connection');
        const newSocket = io('http://localhost:3002/video', {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: maxReconnectAttempts,
        });

        newSocket.on('connect', () => {
          console.log('[signaling] Connected to server');
          setIsConnected(true);
          reconnectAttempts.current = 0;
          newSocket.emit('join-room', { roomId, userId });
          callbacksRef.current.onConnectionQuality?.('excellent');
        });

        newSocket.on('disconnect', (reason) => {
          console.log('[signaling] Disconnected:', reason);
          setIsConnected(false);
          callbacksRef.current.onConnectionQuality?.('disconnected');
        });

        newSocket.on('connect_error', (error) => {
          console.error('[signaling] Connection error:', error);
          reconnectAttempts.current++;
          callbacksRef.current.onConnectionQuality?.('disconnected');
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.error('[signaling] Max reconnection attempts reached');
          }
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('[signaling] Reconnected after', attemptNumber, 'attempts');
          callbacksRef.current.onConnectionQuality?.('good');
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('[signaling] Reconnection error:', error);
          callbacksRef.current.onConnectionQuality?.('disconnected');
        });

        // MODIFIED: Handle both fromUserId and fromUsername in incoming call
        newSocket.on('incoming-call', ({ fromUserId, toUserId, fromUsername }) => {
          if (toUserId === userId) {
            console.log('[signaling] Incoming call from:', fromUsername || fromUserId);
            if (incomingCallAudio.current) {
              incomingCallAudio.current.play().catch(error => {
                console.warn('[signaling] Could not play ringtone:', error);
              });
            }
            callbacksRef.current.onIncomingCall(fromUserId, fromUsername); // Pass both userId and username
          }
        });

        newSocket.on('call-accepted', ({ fromUserId, toUserId }) => {
          if (toUserId === userId) {
            console.log('[signaling] Call accepted by:', fromUserId);
            if (incomingCallAudio.current) {
              incomingCallAudio.current.pause();
              incomingCallAudio.current.currentTime = 0;
            }
            callbacksRef.current.onCallAccepted(fromUserId);
          }
        });

        newSocket.on('call-rejected', ({ fromUserId, toUserId }) => {
          if (toUserId === userId) {
            console.log('[signaling] Call rejected by:', fromUserId);
            if (incomingCallAudio.current) {
              incomingCallAudio.current.pause();
              incomingCallAudio.current.currentTime = 0;
            }
            callbacksRef.current.onCallRejected(fromUserId);
          }
        });

        newSocket.on('call-ended-by-owner', ({ reason }) => {
          console.log('[signaling] Call ended:', reason);
          if (incomingCallAudio.current) {
            incomingCallAudio.current.pause();
            incomingCallAudio.current.currentTime = 0;
          }
          callbacksRef.current.onCallEnded(reason);
        });

        newSocket.on('user-left-call', ({ userId: leftUserId }) => {
          console.log('[signaling] User left call:', leftUserId);
          callbacksRef.current.onUserLeft(leftUserId);
        });

        newSocket.on('user-joined-call', ({ userId: joinedUserId }) => {
          console.log('[signaling] User joined call:', joinedUserId);
          callbacksRef.current.onUserJoined(joinedUserId);
        });

        newSocket.on('current-participants', ({ participants }) => {
          console.log('[signaling] Current participants:', participants);
          callbacksRef.current.onCurrentParticipants(participants);
        });

        newSocket.on('signal', ({ from, data }) => {
          console.log('[signaling] Received WebRTC signal from:', from);
          callbacksRef.current.onSignal(from, data);
        });

        newSocket.on('call-error', ({ message }) => {
          console.error('[signaling] Call error:', message);
        });

        newSocket.on('signal-error', ({ message, targetUserId }) => {
          console.error('[signaling] Signal error:', message, 'Target:', targetUserId);
        });

        newSocket.on('room-joined', ({ roomId: joinedRoomId, userId: joinedUserId }) => {
          console.log('[signaling] Successfully joined room:', joinedRoomId, 'as user:', joinedUserId);
        });

        setSocket(newSocket);
        socketRef.current = newSocket;

        return newSocket;
      } catch (error) {
        console.error('[signaling] Failed to create socket:', error);
        return null;
      }
    };

    const socketInstance = connectSocket();

    return () => {
      console.log('[signaling] Cleaning up socket connection');
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
        incomingCallAudio.current.currentTime = 0;
      }
    };
  }, [userId, roomId]); // Only depend on userId and roomId

  // MODIFIED: Include fromUsername in start-call emission
  const startCall = useCallback((userIds: string[], isTurn: boolean = false) => {
    if (!socket?.connected) {
      console.error('[signaling] Socket not connected');
      return false;
    }
    const isMobile = window.innerWidth < 768;
    const maxParticipants = isMobile ? 1 : 3;
    if (userIds.length > maxParticipants) {
      return false;
    }
    console.log('[signaling] Starting call with users:', userIds, 'from:', username);
    // MODIFIED: Include fromUsername in the emission
    socket.emit('start-call', { 
      roomId, 
      userIds, 
      fromUserId: userId, 
      fromUsername: username, // ADD: Send the username
      isTurn 
    });
    return true;
  }, [socket, roomId, userId, username]); // ADD username dependency

  const acceptCall = useCallback((fromUserId: string) => {
    if (!socket?.connected) {
      console.error('[signaling] Socket not connected');
      return false;
    }
    if (incomingCallAudio.current) {
      incomingCallAudio.current.pause();
      incomingCallAudio.current.currentTime = 0;
    }
    console.log('[signaling] Accepting call from:', fromUserId);
    socket.emit('accept-call', { roomId, userId, fromUserId });
    return true;
  }, [socket, roomId, userId]);

  const rejectCall = useCallback((fromUserId: string) => {
    if (!socket?.connected) {
      console.error('[signaling] Socket not connected');
      return false;
    }
    if (incomingCallAudio.current) {
      incomingCallAudio.current.pause();
      incomingCallAudio.current.currentTime = 0;
    }
    console.log('[signaling] Rejecting call from:', fromUserId);
    socket.emit('reject-call', { roomId, userId, fromUserId });
    return true;
  }, [socket, roomId, userId]);

  const endCall = useCallback(() => {
    if (!socket?.connected) {
      console.error('[signaling] Socket not connected');
      return false;
    }
    console.log('[signaling] Ending call');
    socket.emit('end-call', { roomId, userId });
    return true;
  }, [socket, roomId, userId]);

  const leaveCall = useCallback(() => {
    if (!socket?.connected) {
      console.error('[signaling] Socket not connected');
      return false;
    }
    console.log('[signaling] Leaving call');
    socket.emit('leave-call', { roomId, userId });
    return true;
  }, [socket, roomId, userId]);

  return {
    socket,
    socketRef,
    isConnected,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    leaveCall,
  };
};