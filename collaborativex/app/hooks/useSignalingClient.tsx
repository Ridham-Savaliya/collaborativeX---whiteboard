import { useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

interface SignalingClientOptions {
  userId: string;
  roomId: string;
  onIncomingCall: (fromUserId: string) => void;
  onCallAccepted: (fromUserId: string) => void;
  onCallRejected: (fromUserId: string) => void;
  onSignal: (fromUserId: string, data: any) => void;
  onCallEnded: (reason: string) => void;
  onUserLeft: (userId: string) => void;
  onUserJoined: (userId: string) => void;
  onCurrentParticipants: (participants: string[]) => void;
}

export function useSignalingClient({
  userId,
  roomId,
  onIncomingCall,
  onCallAccepted,
  onCallRejected,
  onSignal,
  onCallEnded,
  onUserLeft,
  onUserJoined,
  onCurrentParticipants,
}: SignalingClientOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`colloboartivex-backend-production.up.railway.app/video`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[signaling] Connected: ${socket.id}, joining room ${roomId} as ${userId}`);
      socket.emit('join-room', { roomId, userId });
    });

    socket.on('incoming-call', ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) => {
      if (toUserId === userId) {
        onIncomingCall(fromUserId);
      }
    });

    socket.on('call-accepted', ({ fromUserId }: { fromUserId: string }) => {
      onCallAccepted(fromUserId);
    });

    socket.on('call-rejected', ({ fromUserId }: { fromUserId: string }) => {
      onCallRejected(fromUserId);
    });

    // FIX: onSignal now passes from (userId) and data
    socket.on('signal', ({ from, data }: { from: string; data: any }) => {
      onSignal(from, data);
    });

    socket.on('call-ended-by-owner', ({ reason }: { reason: string }) => {
      onCallEnded(reason);
    });

    socket.on('user-left-call', ({ userId }: { userId: string }) => {
      onUserLeft(userId);
    });

    socket.on('user-joined-call', ({ userId }: { userId: string }) => {
      onUserJoined(userId);
    });

    socket.on('current-participants', ({ participants }: { participants: string[] }) => {
      onCurrentParticipants(participants);
    });

    socket.on('connect_error', (err) => {
      console.error('[signaling] Connection error:', err);
      alert('Failed to connect to the signaling server. Please try again.');
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, userId, onIncomingCall, onCallAccepted, onCallRejected, onSignal, onCallEnded, onUserLeft, onUserJoined, onCurrentParticipants]);

  const startCall = (targetUserIds: string[], isTurn: boolean) => {
    socketRef.current?.emit('start-call', { roomId, fromUserId: userId, userIds: targetUserIds, isTurn });
  };

  const acceptCall = (fromUserId: string) => {
    socketRef.current?.emit('accept-call', { roomId, userId, fromUserId });
  };

  const rejectCall = (fromUserId: string) => {
    socketRef.current?.emit('reject-call', { roomId, userId, fromUserId });
  };

  const sendSignal = (toUserId: string, data: any) => {
    socketRef.current?.emit('signal', { from: userId, to: toUserId, data });
  };

  const endCall = () => {
    socketRef.current?.emit('end-call', { roomId, userId });
  };

  const leaveCall = () => {
    socketRef.current?.emit('leave-call', { roomId, userId });
  };

  return { socket: socketRef.current, startCall, acceptCall, rejectCall, sendSignal, endCall, leaveCall };
}
