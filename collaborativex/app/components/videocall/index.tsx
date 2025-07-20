import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import VideoCallLobby from './VideocallLobby';
import { VideocallManager } from './VideocallManager';
import { useSignalingClient } from '../../hooks/useSignalingClient';
import { jwtDecode } from 'jwt-decode';
import { Check, XCircle } from 'lucide-react';

const VideoCallWindow = dynamic(() => import('./VideoFloatingCards'), { ssr: false });

interface UserPresence {
  userId: string;
  username: string;
}

interface VideocallProps {
  showLobby: boolean;
  Users: UserPresence[];
  roomId: string;
}

const Videocall: React.FC<VideocallProps> = ({ showLobby, Users, roomId }) => {
  const [callActive, setCallActive] = useState(false);
  const [isLobbyVisible, setIsLobbyVisible] = useState(false);
  const [localUserId, setLocalUserId] = useState<string>('');
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded: any = jwtDecode(token);
        setLocalUserId(decoded.userId);
      } else {
        alert('No authentication token found. Please log in.');
      }
    } catch (err) {
      console.error('[video] Error decoding JWT:', err);
      alert('Error verifying user identity. Please log in again.');
    }
  }, []);

  const { socket, startCall, acceptCall, rejectCall, endCall } = useSignalingClient({
    userId: localUserId,
    roomId,
    onIncomingCall: (fromUserId: string) => setIncomingCall(fromUserId),
    onCallAccepted: (fromUserId: string) => {
      setParticipants((prev) => [...new Set([...prev, fromUserId])]);
      setCallActive(true);
      setIncomingCall(null);
    },
    onCallRejected: (fromUserId: string) => {
      setIncomingCall(null);
      // Reduced alert frequency
      console.log(`${Users.find((u) => u.userId === fromUserId)?.username || 'A user'} rejected the call.`);
    },
    onCallEnded: (reason: string) => {
      setCallActive(false);
      setParticipants([]);
      setIncomingCall(null);
      console.log(`Call ended: ${reason}`);
    },
    onUserLeft: (userId: string) => {
      setParticipants((prev) => prev.filter((id) => id !== userId));
    },
    onSignal: () => {},
    onUserJoined: (userId: string) => {
      setParticipants((prev) => [...new Set([...prev, userId])]);
    },
    onCurrentParticipants: (currentParticipants: string[]) => {
      setParticipants((prev) => [...new Set([...prev, ...currentParticipants])]);
    },
  });

  useEffect(() => {
    setIsLobbyVisible(showLobby);
  }, [showLobby]);

  useEffect(() => {
    if (!socket || !localUserId) return;
    socket.on('connect', () => {
      socket.emit('join-room', { roomId, userId: localUserId });
    });
  }, [socket, roomId, localUserId]);

  const handleRequestCall = (userIds: string[]) => {
    setParticipants(userIds);
    setCallActive(true);
    setIsLobbyVisible(false);
    startCall(userIds, true);
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
        <div className="fixed bottom-5 right-5 bg-black/80 text-white rounded-lg p-4 shadow-xl animate-slideUp z-50 max-w-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm">Incoming call from {Users.find((u) => u.userId === incomingCall)?.username || 'Unknown'}</span>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  acceptCall(incomingCall);
                  setCallActive(true);
                  setParticipants((prev) => [...new Set([...prev, incomingCall])]);
                  setIncomingCall(null);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => {
                  rejectCall(incomingCall);
                  setIncomingCall(null);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Videocall;
