// Frontend: Videocall Component
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import VideoCallLobby from './VideocallLobby';
import {VideocallManager} from './VideocallManager';
import { useSignalingClient } from '../../hooks/useSignalingClient';
import { jwtDecode } from 'jwt-decode';

const VideoCallWindow = dynamic(() => import('./VideoFloatingCards'), { ssr: false });

const Videocall = ({ showLobby, Users, roomId }:any) => {
  const [callActive, setCallActive] = useState(false);
  const [isLobbyVisible, setIsLobbyVisible] = useState(false);
  const [targetIds, setTargetIds] = useState([]);
  const [localUserId, setLocalUserId] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    try {
      const token:any = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setLocalUserId(decoded.userId);
      } else {
        alert('No authentication token found. Please log in.');
      }
    } catch (err) {
      console.error('[video] Error decoding JWT:', err);
      alert('Error verifying user identity. Please log in again.');
    }
  }, []);

  const { socket, startCall, acceptCall, rejectCall, endCall, leaveCall } = useSignalingClient({
    userId: localUserId,
    roomId,
    onIncomingCall: (fromUserId) => {
      setIncomingCall(fromUserId);
    },
    onCallAccepted: (fromUserId) => {
      setParticipants((prev) => [...new Set([...prev, fromUserId])]);
      setCallActive(true);
      setIncomingCall(null);
    },
    onCallRejected: (fromUserId) => {
      setIncomingCall(null);
      alert(`${Users.find((u) => u.userId === fromUserId)?.username || 'A user'} rejected the call.`);
    },
    onCallEnded: (reason) => {
      setCallActive(false);
      setParticipants([]);
      setIncomingCall(null);
      alert(`Call ended: ${reason}`);
    },
    onUserLeft: (userId) => {
      setParticipants((prev) => prev.filter((id) => id !== userId));
      alert(`${Users.find((u) => u.userId === userId)?.username || userId} has left the call.`);
    },
    onSignal: () => {},
    onUserJoined: (userId) => {
      setParticipants((prev) => [...new Set([...prev, userId])]);
      alert(`${Users.find((u) => u.userId === userId)?.username || userId} has joined the call.`);
    },
    onCurrentParticipants: (currentParticipants) => {
      setParticipants((prev) => [...new Set([...prev, ...currentParticipants])]);
    },
  });

  useEffect(() => {
    setIsLobbyVisible(showLobby && !callActive && !incomingCall);
  }, [showLobby, callActive, incomingCall]);

  useEffect(() => {
    if (!socket || !localUserId) return;
    socket.on('connect', () => {
      socket.emit('join-room', { roomId, userId: localUserId });
    });
  }, [socket, roomId, localUserId]);

  const handleRequestCall = (userIds) => {
    setTargetIds(userIds);
    setCallActive(true);
    setIsLobbyVisible(false);
    startCall(userIds, true);
    alert('Waiting for others to join...');
  };

  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end the call?')) {
      setCallActive(false);
      setParticipants([]);
      endCall();
    }
  };

  return (
    <>
      {isLobbyVisible && (
        <VideoCallLobby
          onlineUsers={Users}
          currentUserId={localUserId}
          onRequest={handleRequestCall}
          onClose={() => setIsLobbyVisible(false)}
        />
      )}
      {callActive && localUserId && (
        <VideocallManager
          roomId={roomId}
          targetIds={participants}
          localUserId={localUserId}
          localUsername={Users.find((u) => u.userId === localUserId)?.username || 'You'}
          Users={Users}
          onEndCall={handleEndCall}
        />
      )}
      {incomingCall && (
        <VideoCallWindow
          stream={null}
          username={Users.find((u) => u.userId === incomingCall)?.username || 'Unknown'}
          userId={incomingCall}
          isLocal={false}
          customPosition={{ x: window.innerWidth - 300, y: window.innerHeight - 100 }}
          isIncomingCall={true}
          onAcceptCall={() => {
            if (incomingCall) {
              acceptCall(incomingCall);
              setCallActive(true);
              setParticipants((prev) => [...new Set([...prev, incomingCall])]);
              setIncomingCall(null);
            }
          }}
          onRejectCall={() => {
            if (incomingCall) {
              rejectCall(incomingCall);
              setIncomingCall(null);
            }
          }}
        />
      )}
    </>
  );
};


export default Videocall;
