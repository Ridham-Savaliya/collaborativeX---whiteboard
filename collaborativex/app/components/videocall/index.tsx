import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import VideoCallLobby from './VideocallLobby';
import { VideocallManager } from './VideocallManager';
import { useSignalingClient } from '../../hooks/useSignalingClient';
import { useToast } from "../../utills/ToastProvider";
import { jwtDecode } from 'jwt-decode';
import { Check, XCircle, Phone, Signal } from 'lucide-react';

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
  Users: UserPresence[];
  roomId: string;
}

const Videocall: React.FC<VideocallProps> = ({ showLobby, Users, roomId }) => {
  const [callActive, setCallActive] = useState(false);
  const [isLobbyVisible, setIsLobbyVisible] = useState(false);
  const [localUserId, setLocalUserId] = useState<string>('');
  const [localUsername, setLocalUsername] = useState<string>(''); // ADD: Store local username
  const [incomingCall, setIncomingCall] = useState<{userId: string, username: string} | null>(null); // MODIFIED: Store both userId and username
  const [participants, setParticipants] = useState<string[]>([]);
  const [isIncomingCallSoundPlaying, setIsIncomingCallSoundPlaying] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('excellent');

  const { showToast } = useToast();

  // Detect mobile device - memoize to prevent re-renders
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  // Memoize user lookup function
  const getUserName = useCallback((userId: string) => {
    const user = Users.find(u => u.userId === userId);
    return user?.username || 'Unknown User';
  }, [Users]);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded: any = jwtDecode(token);
        setLocalUserId(decoded.userId);
        setLocalUsername(decoded.username || decoded.name || 'You'); // MODIFIED: Extract username from token
        console.log('[video] Decoded user info:', { userId: decoded.userId, username: decoded.username || decoded.name });
      } else {
        console.error('[video] No authentication token found');
        showToast('Authentication required. Please log in to use video calls.', 'error');
      }
    } catch (err) {
      console.error('[video] Error decoding JWT:', err);
      showToast('Authentication error. Please log in again.', 'error');
    }
  }, [showToast]);

  // MODIFIED: Updated to handle both userId and username from incoming call
  const onIncomingCall = useCallback((fromUserId: string, fromUsername?: string) => {
    const callerName = fromUsername || getUserName(fromUserId);
    console.log(`[video] Incoming call from ${callerName} (${fromUserId})`);
    
    setIncomingCall({ userId: fromUserId, username: callerName }); // MODIFIED: Store both
    setIsIncomingCallSoundPlaying(true);
    
    showToast(`Incoming video call from ${callerName}`, 'info');
    
    // Auto-reject after 30 seconds if not answered
    setTimeout(() => {
      setIncomingCall(current => {
        if (current?.userId === fromUserId) {
          setIsIncomingCallSoundPlaying(false);
          showToast('Missed call - call ended automatically', 'info');
          return null;
        }
        return current;
      });
    }, 30000);
  }, [getUserName, showToast]);

  const onCallAccepted = useCallback((fromUserId: string) => {
    const username = getUserName(fromUserId);
    console.log(`[video] Call accepted by ${username} (${fromUserId})`);
    
    setParticipants(prev => [...new Set([...prev, fromUserId])]);
    setCallActive(true);
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    showToast(`${username} joined the call`, 'success');
  }, [getUserName, showToast]);

  const onCallRejected = useCallback((fromUserId: string) => {
    const username = getUserName(fromUserId);
    console.log(`[video] Call rejected by ${username} (${fromUserId})`);
    
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    showToast(`${username} declined the call`, 'info');
  }, [getUserName, showToast]);

  const onCallEnded = useCallback((reason: string) => {
    console.log(`[video] Call ended: ${reason}`);
    setCallActive(false);
    setParticipants([]);
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    
    // Provide user-friendly end reason messages - REMOVED turn timeout references
    const endReasons: Record<string, string> = {
      'ENDED_BY_OWNER': 'Call ended by the host',
      'OWNER_LEFT': 'Call ended because the host left',
      'OWNER_DISCONNECTED': 'Call ended due to host disconnection',
      'user ended call': 'Call ended'
    };
    
    const message = endReasons[reason] || `Call ended: ${reason}`;
    showToast(message, 'info');
  }, [showToast]);

  const onUserLeft = useCallback((userId: string) => {
    const username = getUserName(userId);
    console.log(`[video] User ${username} (${userId}) left the call`);
    
    setParticipants(prev => prev.filter(id => id !== userId));
    showToast(`${username} left the call`, 'info');
  }, [getUserName, showToast]);

  const onSignal = useCallback(() => {
    // Signal handling is done in VideocallManager
  }, []);

  const onUserJoined = useCallback((userId: string) => {
    const username = getUserName(userId);
    console.log(`[video] User ${username} (${userId}) joined the call`);
    
    setParticipants(prev => [...new Set([...prev, userId])]);
    showToast(`${username} joined the call`, 'success');
  }, [getUserName, showToast]);

  const onCurrentParticipants = useCallback((currentParticipants: string[]) => {
    const participantNames = currentParticipants.map(id => getUserName(id));
    console.log(`[video] Current participants:`, participantNames);
    
    setParticipants(prev => [...new Set([...prev, ...currentParticipants])]);
  }, [getUserName]);

  const onConnectionQuality = useCallback((quality: 'excellent' | 'good' | 'poor' | 'disconnected') => {
    setConnectionQuality(quality);
    if (quality === 'poor') {
      showToast('Poor connection quality detected', 'warning');
    } else if (quality === 'disconnected') {
      showToast('Connection lost - trying to reconnect...', 'error');
    }
  }, [showToast]);

  // MODIFIED: Pass localUsername to signaling client
  const { socket, startCall, acceptCall, rejectCall, endCall } = useSignalingClient({
    userId: localUserId,
    username: localUsername, // ADD: Pass username
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
  });

  useEffect(() => {
    setIsLobbyVisible(showLobby);
  }, [showLobby]);

  useEffect(() => {
    if (!socket || !localUserId) return;

    const handleConnect = () => {
      console.log('[video] Socket connected, joining room');
      socket.emit('join-room', { roomId, userId: localUserId });
    };

    const handleConnectError = (error: any) => {
      console.error('[video] Socket connection error:', error);
      showToast('Connection error. Please check your internet connection.', 'error');
    };

    const handleDisconnect = (reason: string) => {
      console.log('[video] Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
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
  }, [socket, roomId, localUserId, showToast]);

  const handleRequestCall = useCallback((userIds: string[]) => {
    // Check device limitations
    if (isMobile && userIds.length > 1) {
      showToast('On mobile devices, only 1-to-1 calls are supported. Please select only one user.', 'warning');
      return;
    }
    
    if (!isMobile && userIds.length > 3) {
      showToast('Maximum 4 participants allowed in a group call (including you).', 'warning');
      return;
    }

    const usernames = userIds.map(id => getUserName(id));
    console.log(`[video] Starting call with users:`, usernames);
    
    setParticipants(userIds);
    setCallActive(true);
    setIsLobbyVisible(false);
    startCall(userIds, true);

    showToast(`Calling ${usernames.join(', ')}...`, 'info');
  }, [isMobile, showToast, startCall, getUserName]);

  const handleEndCall = useCallback(() => {
    console.log('[video] User ending call');
    if (participants.length === 0) {
      showToast('No active call to end', 'warning');
      return;
    }
    
    setCallActive(false);
    setParticipants([]);
    endCall();
    showToast('Call ended', 'info');
  }, [participants.length, endCall, showToast]);

  const handleAcceptCall = useCallback(() => {
    if (!incomingCall) return;
    
    const callerName = incomingCall.username;
    console.log(`[video] Accepting call from ${callerName} (${incomingCall.userId})`);
    
    acceptCall(incomingCall.userId);
    setCallActive(true);
    setParticipants(prev => [...new Set([...prev, incomingCall.userId])]);
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    
    showToast(`Connected to ${callerName}`, 'success');
  }, [incomingCall, acceptCall, showToast]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCall) return;
    
    const callerName = incomingCall.username;
    console.log(`[video] Rejecting call from ${callerName} (${incomingCall.userId})`);
    
    rejectCall(incomingCall.userId);
    setIncomingCall(null);
    setIsIncomingCallSoundPlaying(false);
    
    showToast(`Declined call from ${callerName}`, 'info');
  }, [incomingCall, rejectCall, showToast]);

  return (
    <>
      {/* Video Call Lobby */}
      {isLobbyVisible && (
        <VideoCallLobby
          onlineUsers={Users}
          currentUserId={localUserId}
          onRequest={handleRequestCall}
          onClose={() => setIsLobbyVisible(false)}
        />
      )}

      {/* Active Video Call */}
      {callActive && localUserId && (
        <VideocallManager
          roomId={roomId}
          targetIds={participants}
          localUserId={localUserId}
          localUsername={localUsername} // MODIFIED: Use extracted username
          Users={Users}
          onEndCall={handleEndCall}
          showToast={showToast}
        />
      )}

      {/* Enhanced Incoming Call Notification - MODIFIED: Use username from incoming call */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-slideUp border border-purple-200 dark:border-purple-700">
            {/* Pulse animation ring */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20"></div>
              <div className="absolute inset-2 rounded-full bg-purple-300 animate-ping opacity-30" style={{ animationDelay: '0.5s' }}></div>
              
              {/* Caller Avatar/Initial with user color */}
              <div 
                className="relative w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{ 
                  background: `linear-gradient(45deg, ${Users.find(u => u.userId === incomingCall.userId)?.color || '#8B5CF6'}, ${Users.find(u => u.userId === incomingCall.userId)?.color || '#8B5CF6'}CC)`
                }}
              >
                {incomingCall.username[0]?.toUpperCase() || '?'}
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Incoming Video Call
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                {incomingCall.username} {/* MODIFIED: Use username from incoming call */}
              </p>
              
              {/* Connection quality indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Signal className="w-4 h-4" />
                <span className="capitalize">{connectionQuality} connection</span>
              </div>
            </div>

            {/* Call Actions */}
            <div className="flex gap-6 justify-center mb-6">
              <button
                onClick={handleRejectCall}
                className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 transform hover:scale-110"
                title="Reject Call"
              >
                <XCircle className="w-7 h-7" />
              </button>
              
              <button
                onClick={handleAcceptCall}
                className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 transform hover:scale-110"
                title="Accept Call"
              >
                <Check className="w-7 h-7" />
              </button>
            </div>

            {/* Call type indicator */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                <Phone className="w-4 h-4" />
                <span>{isMobile ? 'Video Call' : 'Group Video Call'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Call Status Indicator */}
      {callActive && (
        <div className="fixed top-6 left-6 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-2xl shadow-lg z-40 flex items-center gap-3 border border-purple-400/30 backdrop-blur-sm">
          <div className="relative">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-40"></div>
          </div>
          <div>
            <div className="font-semibold text-sm">
              Call Active
            </div>
            <div className="text-xs opacity-90">
              {participants.length + 1} participant{participants.length === 0 ? '' : 's'}
            </div>
          </div>
          
          {/* Connection quality indicator */}
          <div className="ml-2 flex items-center gap-1">
            <Signal className={`w-4 h-4 ${
              connectionQuality === 'excellent' ? 'text-green-300' :
              connectionQuality === 'good' ? 'text-yellow-300' :
              connectionQuality === 'poor' ? 'text-orange-300' :
              'text-red-300'
            }`} />
            <span className="text-xs capitalize">{connectionQuality}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default Videocall;