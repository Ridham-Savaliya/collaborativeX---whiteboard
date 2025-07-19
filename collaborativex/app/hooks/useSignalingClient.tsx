// Frontend: useSignalingClient Hook
import { useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

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
}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:3001/video', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[signaling] Connected: ${socket.id}, joining room ${roomId} as ${userId}`);
      socket.emit('join-room', { roomId, userId });
    });

    socket.on('incoming-call', ({ fromUserId, toUserId }) => {
      if (toUserId === userId) {
        onIncomingCall(fromUserId);
      }
    });

    socket.on('call-accepted', ({ fromUserId }) => {
      onCallAccepted(fromUserId);
    });

    socket.on('call-rejected', ({ fromUserId }) => {
      onCallRejected(fromUserId);
    });

    socket.on('signal', ({ from, data }) => {
      onSignal(from, data);
    });

    socket.on('call-ended-by-owner', ({ reason }) => {
      onCallEnded(reason);
    });

    socket.on('user-left-call', ({ userId }) => {
      onUserLeft(userId);
    });

    socket.on('user-joined-call', ({ userId }) => {
      onUserJoined(userId);
    });

    socket.on('current-participants', ({ participants }) => {
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

  const startCall = (targetUserIds, isTurn) => {
    socketRef.current?.emit('start-call', { roomId, fromUserId: userId, userIds: targetUserIds, isTurn });
  };

  const acceptCall = (fromUserId) => {
    socketRef.current?.emit('accept-call', { roomId, userId, fromUserId });
  };

  const rejectCall = (fromUserId) => {
    socketRef.current?.emit('reject-call', { roomId, userId, fromUserId });
  };

  const sendSignal = (toUserId, data) => {
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
