import React, { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';
import VideoCallWindow from './VideoFloatingCards';
import { useSignalingClient } from '../../hooks/useSignalingClient';

interface UserPresence {
  userId: string;
  username: string;
}

interface VideocallManagerProps {
  roomId: string;
  localUserId: string;
  localUsername: string;
  targetIds: string[];
  onEndCall: () => void;
  Users: UserPresence[];
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface PeerData {
  peer: Peer.Instance;
  stream: MediaStream | null;
  userId: string;
  username: string;
  isInitiator: boolean;
  isLoading: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export const VideocallManager: React.FC<VideocallManagerProps> = ({
  roomId,
  localUserId,
  localUsername,
  targetIds,
  onEndCall,
  Users,
  showToast,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerData>>({});
  const [connectionStates, setConnectionStates] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);

  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const signalQueueRef = useRef<Record<string, any[]>>({});
  const peerCreationInProgress = useRef<Set<string>>(new Set());
  const connectionQualityTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const socketRef = useRef<Socket | null>(null); // Moved up to avoid "used before declaration"




 const monitorConnectionQuality = useCallback((userId: string, peer: Peer.Instance) => {
    const updateQuality = () => {
      if (peer.destroyed) return;
      try {
        const qualities: Array<'excellent' | 'good' | 'poor' | 'disconnected'> = ['excellent', 'good', 'poor'];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        setPeers(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            connectionQuality: randomQuality,
          },
        }));
        connectionQualityTimers.current[userId] = setTimeout(updateQuality, 5000);
      } catch (error) {
        console.error(`[webrtc] Error monitoring connection quality for ${userId}:`, error);
      }
    };
    updateQuality();
  }, []);
  const processQueuedSignals = useCallback((userId: string) => {
    const queuedSignals = signalQueueRef.current[userId];
    if (queuedSignals && queuedSignals.length > 0) {
      console.log(`[webrtc] Processing ${queuedSignals.length} queued signals for ${userId}`);
      const peer = peersRef.current[userId];
      if (peer && !peer.destroyed) {
        queuedSignals.forEach((signal, index) => {
          try {
            peer.signal(signal);
            console.log(`[webrtc] Processed queued signal ${index + 1}/${queuedSignals.length} for ${userId}`);
          } catch (error) {
            console.error(`[webrtc] Error processing queued signal for ${userId}:`, error);
          }
        });
      }
      delete signalQueueRef.current[userId];
    }
  }, []);

  // Move createPeer definition earlier
  const createPeer = useCallback(
    (userId: string, initiator: boolean): Peer.Instance | null => {
      if (peerCreationInProgress.current.has(userId)) {
        console.log(`[webrtc] Peer creation already in progress for ${userId}`);
        return null;
      }
      if (peersRef.current[userId]) {
        console.log(`[webrtc] Peer already exists for ${userId}`);
        return peersRef.current[userId];
      }
      peerCreationInProgress.current.add(userId);
      console.log(`[webrtc] Creating ${initiator ? 'initiator' : 'answerer'} peer for ${userId}`);
      const streamToUse = localStreamRef.current ? localStreamRef.current.clone() : undefined;
      const peer = new Peer({
        initiator,
        trickle: false,
        stream: streamToUse,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.stunprotocol.org:3478' },
          ],
          iceCandidatePoolSize: 10,
        },
      });
      setConnectionStates(prev => ({ ...prev, [userId]: 'connecting' }));
      const username = Users.find(u => u.userId === userId)?.username || userId;
      setPeers(prev => ({
        ...prev,
        [userId]: {
          peer,
          stream: null,
          userId,
          username,
          isInitiator: initiator,
          isLoading: true,
          connectionQuality: 'excellent',
        },
      }));
      peer.on('signal', (signal) => {
        console.log(`[webrtc] Sending ${signal.type || 'signal'} to ${userId}`);
        const liveSocket = socketRef.current;
        if (liveSocket?.connected) {
          liveSocket.emit('signal', { from: localUserId, to: userId, data: signal });
        } else {
          console.error(`[webrtc] Socket not connected, cannot send signal to ${userId}`);
          showToast('Connection error - please check your internet', 'error');
        }
      });
      peer.on('connect', () => {
        console.log(`[webrtc] Peer connected to ${userId}`);
        setConnectionStates(prev => ({ ...prev, [userId]: 'connected' }));
        setPeers(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            isLoading: false,
          },
        }));
        showToast(`Connected to ${username}`, 'success');
        setTimeout(() => processQueuedSignals(userId), 100);
      });
      peer.on('stream', (remoteStream) => {
        console.log(`[webrtc] Received stream from ${userId} with ${remoteStream.getTracks().length} tracks`);
        remoteStream.getTracks().forEach(track => {
          track.addEventListener('ended', () => {
            console.warn(`[webrtc] Remote ${track.kind} track ended for ${userId}`);
            showToast(`${username}'s ${track.kind} disconnected`, 'warning');
          });
        });
        setPeers(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            stream: remoteStream,
            isLoading: false,
          },
        }));
        setConnectionStates(prev => ({ ...prev, [userId]: 'streaming' }));
        monitorConnectionQuality(userId, peer);
      });
      peer.on('error', (err: any) => {
        console.error(`[webrtc] Peer error with ${userId}:`, err);
        setConnectionStates(prev => ({ ...prev, [userId]: 'error' }));
        setPeers(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            isLoading: false,
            connectionQuality: 'disconnected',
          },
        }));
        showToast(`Connection error with ${username}`, 'error');
        if (err.code === 'ERR_ICE_CONNECTION_FAILURE' || err.code === 'ERR_CONNECTION_FAILURE') {
          console.log(`[webrtc] Attempting to recreate peer for ${userId} due to connection failure`);
          setTimeout(() => {
            cleanupPeer(userId);
            if (initiator && localStreamRef.current) {
              createPeer(userId, true);
            }
          }, 3000);
        }
      });
      peer.on('close', () => {
        console.log(`[webrtc] Peer connection closed with ${userId}`);
        setConnectionStates(prev => ({ ...prev, [userId]: 'closed' }));
        peerCreationInProgress.current.delete(userId);
        if (connectionQualityTimers.current[userId]) {
          clearTimeout(connectionQualityTimers.current[userId]);
          delete connectionQualityTimers.current[userId];
        }
      });
      peersRef.current[userId] = peer;
      peerCreationInProgress.current.delete(userId);
      setTimeout(() => processQueuedSignals(userId), 100);
      return peer;
    },
    [Users, showToast, processQueuedSignals, monitorConnectionQuality, localUserId]
  );

  const handleSignal = useCallback(
    (fromUserId: string, data: any) => {
      console.log(`[webrtc] Received signal from ${fromUserId}:`, data.type || 'signal');
      try {
        const peer = peersRef.current[fromUserId];
        if (!peer) {
          if (!signalQueueRef.current[fromUserId]) {
            signalQueueRef.current[fromUserId] = [];
          }
          signalQueueRef.current[fromUserId].push(data);
          console.log(`[webrtc] Queued signal from ${fromUserId}, queue length: ${signalQueueRef.current[fromUserId].length}`);
          if (data.type === 'offer' && localStreamRef.current && !peerCreationInProgress.current.has(fromUserId)) {
            console.log(`[webrtc] Creating answering peer for ${fromUserId}`);
            createPeer(fromUserId, false);
          }
          return;
        }
        if (peer && !peer.destroyed) {
          peer.signal(data);
          console.log(`[webrtc] Successfully signaled ${data.type || 'signal'} to peer ${fromUserId}`);
        } else {
          console.warn(`[webrtc] Cannot signal destroyed peer ${fromUserId}`);
        }
      } catch (error) {
        console.error(`[webrtc] Error handling signal from ${fromUserId}:`, error);
        showToast(`Connection error with ${Users.find(u => u.userId === fromUserId)?.username || 'user'}`, 'error');
      }
    },
    [Users, showToast, createPeer]
  );



 

  const cleanupPeer = useCallback((userId: string) => {
    console.log(`[webrtc] Cleaning up peer for ${userId}`);
    const peer = peersRef.current[userId];
    if (peer && !peer.destroyed) {
      try {
        peer.destroy();
      } catch (error) {
        console.error(`[webrtc] Error destroying peer for ${userId}:`, error);
      }
    }
    delete peersRef.current[userId];
    delete signalQueueRef.current[userId];
    peerCreationInProgress.current.delete(userId);
    if (connectionQualityTimers.current[userId]) {
      clearTimeout(connectionQualityTimers.current[userId]);
      delete connectionQualityTimers.current[userId];
    }
    setPeers(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
    setConnectionStates(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  }, []);

  const endCall = useCallback(
    (reason = 'user ended') => {
      console.log(`[webrtc] Ending call: ${reason}`);
      Object.keys(peersRef.current).forEach(cleanupPeer);
      Object.values(connectionQualityTimers.current).forEach(timer => clearTimeout(timer));
      connectionQualityTimers.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`[webrtc] Stopping local ${track.kind} track`);
          track.stop();
        });
        localStreamRef.current = null;
      }
      setLocalStream(null);
      signalQueueRef.current = {};
      peerCreationInProgress.current.clear();
      setPeers({});
      setConnectionStates({});
      setIsInitialized(false);
      onEndCall();
    },
    [cleanupPeer, onEndCall]
  );

  const onIncomingCall = useCallback((fromUserId: string) => {
    console.log(`[webrtc] Incoming call from ${fromUserId}`);
  }, []);

  const onCallAccepted = useCallback(
    (fromUserId: string) => {
      console.log(`[webrtc] Call accepted by ${fromUserId}, creating initiator peer`);
      if (localStreamRef.current && !peersRef.current[fromUserId] && !peerCreationInProgress.current.has(fromUserId)) {
        setTimeout(() => createPeer(fromUserId, true), 500);
      }
    },
    [createPeer]
  );

  const onCallRejected = useCallback(() => {}, []);

  const onCallEnded = useCallback(
    (reason: string) => {
      console.log(`[webrtc] Call ended: ${reason}`);
      endCall(reason);
    },
    [endCall]
  );

  const onUserLeft = useCallback(
    (userId: string) => {
      console.log(`[webrtc] User ${userId} left the call`);
      cleanupPeer(userId);
    },
    [cleanupPeer]
  );

  const onSignal = useCallback(
    (fromUserId: string, data: any) => {
      handleSignal(fromUserId, data);
    },
    [handleSignal]
  );

  const onUserJoined = useCallback(
    (userId: string) => {
      console.log(`[webrtc] User ${userId} joined the call`);
      if (localStreamRef.current && !peersRef.current[userId] && !peerCreationInProgress.current.has(userId)) {
        const shouldInitiate = localUserId < userId;
        if (shouldInitiate) {
          setTimeout(() => createPeer(userId, true), 1000);
        }
      }
    },
    [createPeer, localUserId]
  );

  const onCurrentParticipants = useCallback(
    (participants: string[]) => {
      console.log(`[webrtc] Current participants:`, participants);
      if (localStreamRef.current) {
        participants.forEach(userId => {
          if (!peersRef.current[userId] && !peerCreationInProgress.current.has(userId)) {
            const shouldInitiate = localUserId < userId;
            if (shouldInitiate) {
              setTimeout(() => createPeer(userId, true), 1000 + Math.random() * 500);
            }
          }
        });
      }
    },
    [createPeer, localUserId]
  );

  const { socket, socketRef: signalingSocketRef, isConnected } = useSignalingClient({
    userId: localUserId,
    roomId,
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onUserLeft,
    onSignal,
    onUserJoined,
    onCurrentParticipants,
    onConnectionQuality: undefined,
    username:localUsername
  });

  // Assign signalingSocketRef to socketRef
  useEffect(() => {
    socketRef.current = signalingSocketRef.current;
  }, [signalingSocketRef]);

  useEffect(() => {
    const startLocalMedia = async () => {
      setIsLoadingMedia(true);
      try {
        console.log('[webrtc] Requesting user media...');
        const constraints = {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 60 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[webrtc] Got local media stream with tracks:', {
          video: stream.getVideoTracks().length,
          audio: stream.getAudioTracks().length,
        });
        stream.getTracks().forEach(track => {
          track.addEventListener('ended', () => {
            console.warn(`[webrtc] ${track.kind} track ended unexpectedly`);
            showToast(`${track.kind} track ended unexpectedly`, 'warning');
          });
          track.addEventListener('mute', () => {
            console.warn(`[webrtc] ${track.kind} track muted`);
          });
          track.addEventListener('unmute', () => {
            console.log(`[webrtc] ${track.kind} track unmuted`);
          });
        });
        const clonedStream = stream.clone();
        setLocalStream(clonedStream);
        localStreamRef.current = clonedStream;
        setIsInitialized(true);
        setIsLoadingMedia(false);
        showToast('Camera and microphone connected', 'success');
        if (socket?.connected) {
          socket.emit('join-room', { roomId, userId: localUserId });
        }
      } catch (err: any) {
        setIsLoadingMedia(false);
        console.error('[webrtc] Error accessing local media:', err);
        let errorMessage = 'Unable to access camera or microphone.';
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera and microphone access denied. Please allow access and try again.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera or microphone is being used by another application.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found on this device.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera settings not supported by your device.';
        }
        showToast(errorMessage, 'error');
        onEndCall();
      }
    };
    startLocalMedia();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`[webrtc] Stopping ${track.kind} track`);
          track.stop();
        });
        localStreamRef.current = null;
      }
    };
  }, [socket, roomId, localUserId, onEndCall, showToast]);

  useEffect(() => {
    if (!socket?.connected || !localUserId || !isInitialized) return;
    console.log(`[webrtc] Joining room ${roomId} as ${localUserId}`);
    socket.emit('join-room', { roomId, userId: localUserId });
  }, [socket, localUserId, roomId, isConnected, isInitialized]);

  useEffect(() => {
    return () => {
      console.log('[webrtc] VideocallManager unmounting, cleaning up...');
      Object.keys(peersRef.current).forEach(cleanupPeer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(connectionQualityTimers.current).forEach(timer => clearTimeout(timer));
      connectionQualityTimers.current = {};
      signalQueueRef.current = {};
      peerCreationInProgress.current.clear();
    };
  }, [cleanupPeer]);

  const getVideoPosition = (index: number, isLocal: boolean = false, totalParticipants: number = 1) => {
    const windowWidth = 240;
    const windowHeight = 180;
    const margin = 20;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    if (isLocal) {
      return {
        x: margin,
        y: screenHeight - windowHeight - margin - 80,
      };
    }
    const positions = [
      { x: screenWidth - windowWidth - margin, y: margin },
      { x: screenWidth - windowWidth - margin, y: screenHeight - windowHeight - margin },
      { x: margin, y: margin },
      { x: screenWidth - windowWidth - margin, y: screenHeight / 2 - windowHeight / 2 },
      { x: margin, y: screenHeight / 2 - windowHeight / 2 },
      { x: screenWidth / 2 - windowWidth / 2, y: margin },
      { x: screenWidth / 2 - windowWidth / 2, y: screenHeight - windowHeight - margin },
    ];
    return positions[index] || positions[0];
  };

  const participantCount = Object.keys(peers).length;

  return (
    <>
      {isLoadingMedia && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Setting up your camera...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Please allow camera and microphone access
            </p>
          </div>
        </div>
      )}
      {localStream && (
        <VideoCallWindow
          stream={localStream}
          username={localUsername}
          userId={localUserId}
          isLocal={true}
          customPosition={getVideoPosition(0, true, participantCount)}
          onEndCall={() => {
            if (participantCount === 0) {
              showToast('No active call to end', 'warning');
              return;
            }
            if (window.confirm('Are you sure you want to end the call?')) {
              socket?.emit('end-call', { roomId, userId: localUserId });
              endCall('user ended call');
            }
          }}
          connectionQuality="excellent"
          isLoading={false}
          showToast={showToast}
        />
      )}
      {Object.values(peers).map((peerData, index) => (
        <VideoCallWindow
          key={peerData.userId}
          stream={peerData.stream}
          username={peerData.username}
          userId={peerData.userId}
          isLocal={false}
          customPosition={getVideoPosition(index, false, participantCount)}
          onEndCall={() => {}}
          connectionQuality={peerData.connectionQuality}
          isLoading={peerData.isLoading}
          showToast={showToast}
        />
      ))}
      {Object.keys(connectionStates).length > 0 && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-purple-900/90 to-violet-900/90 backdrop-blur-sm text-white p-4 rounded-2xl text-sm z-40 max-w-sm border border-purple-400/30">
          <h4 className="font-bold mb-3 flex items-center gap-2 text-purple-200">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            Connection Status
          </h4>
          <div className="space-y-2">
            {Object.entries(connectionStates).map(([userId, state]) => {
              const peerData = peers[userId];
              const username = peerData?.username || Users.find(u => u.userId === userId)?.username || userId;
              const stateColor = {
                connecting: 'text-yellow-300',
                connected: 'text-blue-300',
                streaming: 'text-green-300',
                error: 'text-red-300',
                closed: 'text-gray-300',
              }[state] || 'text-gray-300';
              const stateIcon = {
                connecting: '🔄',
                connected: '🔗',
                streaming: '📹',
                error: '❌',
                closed: '⏹️',
              }[state] || '';
              return (
                <div key={userId} className="flex justify-between items-center text-xs bg-white/10 rounded-lg p-2">
                  <span className="truncate mr-2" title={username}>
                    {username}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`${stateColor} flex items-center gap-1`}>
                      <span>{stateIcon}</span>
                      <span>{state}</span>
                    </span>
                    {peerData?.isLoading && (
                      <div className="w-3 h-3 border border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default VideocallManager;