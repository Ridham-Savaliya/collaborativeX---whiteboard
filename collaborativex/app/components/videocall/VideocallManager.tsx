import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
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
}

interface PeerData {
  peer: Peer.Instance;
  stream: MediaStream | null;
  userId: string;
}

export const VideocallManager: React.FC<VideocallManagerProps> = ({
  roomId,
  localUserId,
  localUsername,
  targetIds, // Note: No longer used for initial creation
  onEndCall,
  Users,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerData>>({});
  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // FIX: Use userId consistently in signals (not socket.id)
  const handleSignal = (fromUserId: string, data: any) => {
    console.log(`[webrtc] Received signal from ${fromUserId}`);
    let peer = peersRef.current[fromUserId];
    if (!peer && localStream) {
      peer = new Peer({ initiator: false, trickle: false, stream: localStream });
      peer.on('signal', (signal) => {
        socket?.emit('signal', { from: localUserId, to: fromUserId, data: signal });
      });
      peer.on('stream', (remoteStream) => {
        console.log(`[webrtc] Received stream from ${fromUserId}`);
        setPeers((prev) => ({
          ...prev,
          [fromUserId]: { ...prev[fromUserId], stream: remoteStream, peer, userId: fromUserId },
        }));
      });
      peer.on('error', (err) => {
        console.error(`[webrtc] Peer error with ${fromUserId}:`, err);
      });
      peersRef.current[fromUserId] = peer;
      setPeers((prev) => ({
        ...prev,
        [fromUserId]: { peer, stream: null, userId: fromUserId },
      }));
    }
    peer.signal(data);
  };

  const { socket } = useSignalingClient({
    userId: localUserId,
    roomId,
    onIncomingCall: () => { },
    onCallAccepted: (fromUserId: string) => {
      maybeCreatePeer(fromUserId);
    },
    onCallRejected: () => { },
    onCallEnded: (reason: string) => endCall(reason),
    onUserLeft: (userId: string) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
      setPeers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    },
    onSignal: handleSignal,
    onUserJoined: (userId: string) => {
      maybeCreatePeer(userId);
    },
    onCurrentParticipants: (participants: string[]) => {
      participants.forEach((userId) => maybeCreatePeer(userId));
    },
  });

  useEffect(() => {
    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err:any) {
        if (err.name === 'NotReadableError') {
          alert('Camera or microphone is in use by another application. Please close it and try again.');
        } else {
          console.error('[wbrtc] Error accessing local media:', err);
          alert('Unable to access camera or microphone.');
        }
      }
    };

    startLocalMedia();
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!socket || !roomId || !localStream || !socket.connected) return;
    socket.emit('join-room', { roomId, userId: localUserId });
    // FIX: Removed premature creation for targetIds here. Handled via events instead.

    return () => {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};
      setPeers({});
    };
  }, [socket, localStream, roomId, localUserId]);

  useEffect(() => {
    if (!socket || !socket.connected) return;
    // FIX: Turn timer only if needed (assuming isTurn from startCall; for simplicity, kept as 2min)
    turnTimerRef.current = setTimeout(() => {
      socket.emit('end-call', { roomId, userId: localUserId });
      endCall('TURN timeout');
    }, 2 * 60 * 1000);
    return () => {
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
    };
  }, [socket, roomId, localUserId]);

  // FIX: Added initiator election (only initiate if localUserId < userId)
  const maybeCreatePeer = (userId: string) => {
    if (peersRef.current[userId] || !localStream || !socket) return;
    if (localUserId >= userId) return; // Other side will initiate

    console.log(`[webrtc] Creating initiator peer to ${userId}`);
    const peer = new Peer({ initiator: true, trickle: false, stream: localStream });
    peer.on('signal', (signal) => {
      socket.emit('signal', { from: localUserId, to: userId, data: signal });
    });
    peer.on('stream', (remoteStream) => {
      console.log(`[webrtc] Received stream from ${userId}`);
      setPeers((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], stream: remoteStream },
      }));
    });
    peer.on('error', (err) => {
      console.error(`[webrtc] Peer error with ${userId}:`, err);
    });
    peersRef.current[userId] = peer;
    setPeers((prev) => ({
      ...prev,
      [userId]: { peer, stream: null, userId },
    }));
  };

  const endCall = (reason = 'ended') => {
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};
    setPeers({});
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
    onEndCall();
  };

  return (
    <>
      {localStream && (
        <VideoCallWindow
          stream={localStream}
          username={localUsername}
          userId={localUserId}
          isLocal={true}
          customPosition={{ x: 50, y: 50 }}
          onEndCall={() => {
            if (window.confirm('Are you sure you want to end the call?')) {
              socket?.emit('end-call', { roomId, userId: localUserId });
              endCall('user left');
            }
          }}
        />
      )}
      {Object.values(peers).map((peerObj) =>
        peerObj.stream ? (
          <VideoCallWindow
            key={peerObj.userId}
            stream={peerObj.stream}
            username={Users.find((u) => u.userId === peerObj.userId)?.username || peerObj.userId}
            userId={peerObj.userId}
            isLocal={false}
            customPosition={{ x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 }}
            onEndCall={() => { }}
          />
        ) : null
      )}
    </>
  );
};
