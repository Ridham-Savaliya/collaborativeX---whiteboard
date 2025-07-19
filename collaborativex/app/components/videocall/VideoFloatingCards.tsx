// Frontend: VideoCallWindow Component
import { useRef, useEffect, useState, useCallback } from 'react';
import { GripVertical, Mic, MicOff, Video, VideoOff, X, Phone, Check, XCircle } from 'lucide-react';

const VideoCallWindow = ({
  stream,
  username,
  userId,
  isLocal = false,
  customPosition,
  onEndCall,
  onAcceptCall,
  onRejectCall,
  isIncomingCall = false,
}) => {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [position, setPosition] = useState(customPosition);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      if (videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
        videoElement.play().catch((err) => {
          console.error(`[DEBUG] Video play error for ${username}:`, err);
          if (err.name === 'NotAllowedError') {
            alert('Video playback blocked. Please allow media autoplay.');
          }
        });
      }
    } else if (videoElement) {
      videoElement.srcObject = null;
      videoElement.pause();
    }
  }, [stream, username, isLocal]);

  useEffect(() => {
    setPosition(customPosition);
  }, [customPosition]);

  const handleDrag = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const shiftX = e.clientX - card.getBoundingClientRect().left;
    const shiftY = e.clientY - card.getBoundingClientRect().top;

    const moveAt = (pageX, pageY) => {
      setPosition({
        x: Math.max(0, pageX - shiftX),
        y: Math.max(0, pageY - shiftY),
      });
    };

    const onMouseMove = (e) => moveAt(e.pageX, e.pageY);
    document.addEventListener('mousemove', onMouseMove);
    document.onmouseup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.onmouseup = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsMuted((prev) => !prev);
    } else {
      alert('No audio available to mute/unmute.');
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      videoTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsVideoOn((prev) => !prev);
    } else {
      alert('No video available to toggle.');
    }
  }, [stream]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (isIncomingCall && audioEl) {
      audioEl.load();
      audioEl.loop = true;
      audioEl.play().catch((error) => {
        console.error('[DEBUG] Incoming call audio failed:', error);
      });
    } else if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.loop = false;
    }
    return () => {
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
        audioEl.loop = false;
      }
    };
  }, [isIncomingCall]);

  return (
    <>
      <audio ref={audioRef} src="/sounds/beep-01a.mp3" preload="auto" />
      <div
        ref={cardRef}
        className="w-48 h-36 rounded-xl overflow-hidden shadow-lg border border-purple-500 bg-black fixed"
        style={{ left: `${position.x}px`, top: `${position.y}px`, zIndex: 999 }}
      >
        <div
          onMouseDown={handleDrag}
          className="cursor-move px-2 py-1 bg-purple-700 text-white text-xs flex items-center gap-2"
        >
          <GripVertical className="w-3 h-3" />
          {isLocal ? `${username} (You)` : username}
        </div>
        {stream && isVideoOn ? (
          <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white bg-gray-800">
            {isLocal && !isVideoOn ? 'Video Off' : 'No Stream'}
          </div>
        )}
        {isLocal && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/40 rounded-md px-2 py-1 flex gap-3 items-center">
            <button onClick={toggleMute} className="text-white cursor-pointer hover:text-purple-300" title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button onClick={onEndCall} className="text-red-400 hover:text-red-500" title="End Call">
              <X className="w-5 h-5" />
            </button>
            <button onClick={toggleVideo} className="text-white hover:text-purple-300" title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}>
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>
        )}
        {isIncomingCall && !isLocal && (
          <div className="fixed bottom-5 right-5 bg-black/80 text-white rounded-lg p-4 shadow-xl animate-slideUp transition-all duration-300 ease-out transform hover:scale-105 z-50">
            <div className="flex items-center gap-4">
              <span>Incoming call from {username}</span>
              <div className="flex gap-3">
                <button
                  onClick={onAcceptCall}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-110"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={onRejectCall}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-110"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VideoCallWindow;
