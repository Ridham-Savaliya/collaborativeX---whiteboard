// Frontend: VideocallManager Component
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import VideoCallWindow from './VideoFloatingCards';
import { useSignalingClient } from '../../hooks/useSignalingClient';

export const VideocallManager = ({ roomId, localUserId, localUsername, targetIds, onEndCall, Users = [] }) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const peersRef = useRef({});
  const turnTimerRef = useRef(null);

  const handleSignal = (fromUserId, data) => {
    let peer = peersRef.current[fromUserId];
    if (!peer && localStream) {
      peer = new Peer({ initiator: false, trickle: false, stream: localStream });
      peer.on('signal', (signal) => {
        socket?.emit('signal', { from: localUserId, to: fromUserId, data: signal });
      });
      peer.on('stream', (remoteStream) => {
        setPeers((prev) => ({
          ...prev,
          [fromUserId]: { ...prev[fromUserId], stream: remoteStream },
        }));
      });
      peer.on('error', (err) => {
        console.error(`[webrtc] Peer error with ${fromUserId}:`, err);
        alert(`Connection error with ${Users.find((u) => u.userId === fromUserId)?.username || fromUserId}`);
      });
      peersRef.current[fromUserId] = peer;
      addPeer(fromUserId, peer);
    }
    peer.signal(data);
  };

  const { socket, sendSignal } = useSignalingClient({
    userId: localUserId,
    roomId,
    onIncomingCall: () => {},
    onCallAccepted: (fromUserId) => {
      if (localStream && socket?.id) {
        const peer = createPeer(fromUserId, socket.id, localStream);
        peersRef.current[fromUserId] = peer;
        addPeer(fromUserId, peer);
      }
    },
    onCallRejected: () => {},
    onCallEnded: (reason) => {
      endCall(reason);
    },
    onUserLeft: (userId) => {
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
    onUserJoined: (userId) => {
      if (localStream && socket?.id && !peersRef.current[userId]) {
        const peer = createPeer(userId, socket.id, localStream);
        peersRef.current[userId] = peer;
        addPeer(userId, peer);
      }
    },
    onCurrentParticipants: (participants) => {
      if (localStream && socket?.id) {
        participants.forEach((userId) => {
          if (!peersRef.current[userId]) {
            const peer = createPeer(userId, socket.id, localStream);
            peersRef.current[userId] = peer;
            addPeer(userId, peer);
          }
        });
      }
    },
  });

  useEffect(() => {
    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err) {
        console.error('[webrtc] Error accessing local media:', err);
        alert('Unable to access camera or microphone. Please grant permissions and try again.');
      }
    };
    startLocalMedia();
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!socket || !roomId || !localStream || !socket.connected || !socket.id) {
      return;
    }
    socket.emit('join-room', { roomId, userId: localUserId });
    targetIds.forEach((targetId) => {
      if (!peersRef.current[targetId]) {
        const peer = createPeer(targetId, socket.id, localStream);
        peersRef.current[targetId] = peer;
        addPeer(targetId, peer);
      }
    });
    return () => {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};
      setPeers({});
    };
  }, [socket, localStream, targetIds, roomId, localUserId]);

  useEffect(() => {
    if (!socket || !socket.connected) return;
    turnTimerRef.current = setTimeout(() => {
      socket.emit('end-call', { roomId, userId: localUserId });
      endCall('TURN timeout');
    }, 2 * 60 * 1000);
    return () => {
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
    };
  }, [socket, roomId, localUserId]);

  const createPeer = (userIdToSignal, callerId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', (signal) => {
      socket?.emit('signal', { from: callerId, to: userIdToSignal, data: signal });
    });
    peer.on('stream', (remoteStream) => {
      setPeers((prev) => ({
        ...prev,
        [userIdToSignal]: { ...prev[userIdToSignal], stream: remoteStream },
      }));
    });
    peer.on('error', (err) => {
      console.error(`[webrtc] Peer error with ${userIdToSignal}:`, err);
      alert(`Connection error with ${Users.find((u) => u.userId === userIdToSignal)?.username || userIdToSignal}`);
    });
    return peer;
  };

  const addPeer = (userId, peer) => {
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
            onEndCall={() => {}}
          />
        ) : null
      )}
    </>
  );
};
