import React, { useRef, useEffect, useState, memo } from 'react';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Signal, Loader2 } from 'lucide-react';

// Define Prop types
interface VideoCallWindowProps {
    stream: MediaStream | null;
    username: string;
    userId: string;
    isLocal: boolean;
    customPosition?: { x: number; y: number };
    onEndCall: () => void;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
    isLoading: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

// The Draggable Window is its own component now to optimize rendering
const DraggableVideo = ({
    userId,
    position,
    setPosition,
    windowSize,
    isDragging,
    setIsDragging,
    children,
    isLocal,
    username,
    connectionQuality,
    isLoading,
    isMinimized,
    setIsMinimized
}: any) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `video-window-${userId}`,
    });

    const style: React.CSSProperties = {
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: windowSize.width,
        height: windowSize.height,
        transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
        zIndex: isDragging ? 60 : 50,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
        touchAction: 'none',
    };

    const connectionInfo = useConnectionQuality(connectionQuality);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-black rounded-2xl overflow-hidden shadow-2xl border-2 ${
                isLocal ? 'border-purple-500/50' : 'border-violet-500/50'
            } ${isDragging ? 'scale-105 shadow-purple-500/30' : ''} transition-transform`}
        >
            <div
                {...listeners}
                {...attributes}
                className={`absolute top-0 left-0 right-0 h-8 cursor-move bg-black/50 backdrop-blur-sm z-10 flex items-center justify-between px-3`}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
            >
                <span className="text-white text-xs font-medium truncate">{isLocal ? 'You' : username}</span>
                <div className="flex items-center gap-2">
                    {!isLocal && <ConnectionIndicator connectionInfo={connectionInfo} />}
                    {isLoading && <Loader2 className="w-3 h-3 text-white animate-spin" />}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        className="text-white/70 hover:text-white p-1"
                        title={isMinimized ? 'Maximize' : 'Minimize'}
                    >
                        {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                    </button>
                </div>
            </div>
            {children}
        </div>
    );
};

const VideoDisplay = memo(({ stream, isLocal, username }: { stream: MediaStream | null, isLocal: boolean, username: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    console.log(`[memo] Rendering VideoDisplay for ${username}`);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        // Attach stream only if it's new or has been removed
        if (videoElement.srcObject !== stream) {
            videoElement.srcObject = stream;
        }

        // Ensure playback state is correct
        if (stream && videoElement.paused) {
            videoElement.play().catch(err => {
                if (err.name !== 'AbortError') {
                    console.error(`[video] Playback failed for ${username}`, err);
                }
            });
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
            style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
    );
});


const VideoCallUI = ({
    stream,
    username,
    isLocal,
    onEndCall,
    isLoading,
    videoEnabled,
    audioEnabled,
    toggleVideo,
    toggleAudio,
    isMinimized,
    showToast
}: any) => {
    const showLoading = isLoading && !stream;
    const showVideoOff = isLocal && !videoEnabled;

    return (
        <div className="relative w-full h-full">
            {stream && videoEnabled ? (
                 <VideoDisplay stream={stream} isLocal={isLocal} username={username} />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    {showLoading && (
                        <div className="text-center text-white">
                            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-400" />
                            <p className="text-xs">Connecting...</p>
                        </div>
                    )}
                    {showVideoOff && (
                         <div className="text-center text-white">
                             <VideoOff className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                             <p className="text-xs">Camera Off</p>
                         </div>
                    )}
                </div>
            )}
            
            {/* Controls for local user */}
            {isLocal && !isMinimized && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    <ControlButton Icon={audioEnabled ? Mic : MicOff} onClick={toggleAudio} isActive={audioEnabled} title="Toggle Mic" />
                    <ControlButton Icon={videoEnabled ? Video : VideoOff} onClick={toggleVideo} isActive={videoEnabled} title="Toggle Video" />
                    <ControlButton Icon={PhoneOff} onClick={onEndCall} isActive={true} isHangup={true} title="End Call" />
                </div>
            )}
        </div>
    );
};

// Main Component
const VideoCallWindow: React.FC<VideoCallWindowProps> = ({
    stream,
    username,
    userId,
    isLocal,
    customPosition = { x: 100, y: 100 },
    onEndCall,
    connectionQuality,
    isLoading,
    showToast,
}) => {
    const [position, setPosition] = useState(customPosition);
    const [isMinimized, setIsMinimized] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    const isMobile = window.innerWidth < 768;
    const windowSize = {
        width: isMinimized ? 120 : isMobile ? 200 : 240,
        height: isMinimized ? 90 : isMobile ? 150 : 180,
    };

    // Update position from props
    useEffect(() => {
        setPosition(customPosition);
    }, [customPosition]);
    
    // Manage track states
    useEffect(() => {
        if (isLocal && stream) {
            stream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
            stream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
        }
    }, [audioEnabled, videoEnabled, stream, isLocal]);

    const toggleAudio = () => setAudioEnabled(prev => !prev);
    const toggleVideo = () => setVideoEnabled(prev => !prev);

    const handleDragEnd = (event: any) => {
        setIsDragging(false);
        setPosition(prev => ({
            x: Math.max(0, Math.min(window.innerWidth - windowSize.width, prev.x + event.delta.x)),
            y: Math.max(0, Math.min(window.innerHeight - windowSize.height, prev.y + event.delta.y)),
        }));
    };

    return (
        <DndContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
            <DraggableVideo
                userId={userId}
                position={position}
                setPosition={setPosition}
                windowSize={windowSize}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                isLocal={isLocal}
                username={username}
                connectionQuality={connectionQuality}
                isLoading={isLoading}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            >
                <VideoCallUI
                    stream={stream}
                    username={username}
                    isLocal={isLocal}
                    onEndCall={onEndCall}
                    isLoading={isLoading}
                    videoEnabled={videoEnabled}
                    audioEnabled={audioEnabled}
                    toggleVideo={toggleVideo}
                    toggleAudio={toggleAudio}
                    isMinimized={isMinimized}
                    showToast={showToast}
                />
            </DraggableVideo>
        </DndContext>
    );
};

// Helper components for UI clarity
const ControlButton = ({ Icon, onClick, isActive, title, isHangup=false }: any) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-2 rounded-full transition-all shadow-md backdrop-blur-sm ${
            isHangup ? 'bg-red-500 hover:bg-red-600 text-white' : 
            isActive ? 'bg-purple-600/70 hover:bg-purple-500/70 text-white' : 'bg-gray-700/70 hover:bg-gray-600/70 text-white'
        }`}
    >
        <Icon size={14} />
    </button>
);

const useConnectionQuality = (quality: string) => {
    switch (quality) {
        case 'excellent': return { color: 'text-green-400', bars: 4 };
        case 'good': return { color: 'text-yellow-400', bars: 3 };
        case 'poor': return { color: 'text-orange-400', bars: 2 };
        default: return { color: 'text-red-400', bars: 1 };
    }
};

const ConnectionIndicator = ({ connectionInfo }: any) => (
    <div className="flex items-center" title={`Connection: ${connectionInfo.label}`}>
        <Signal size={12} className={connectionInfo.color} />
    </div>
);

export default memo(VideoCallWindow);