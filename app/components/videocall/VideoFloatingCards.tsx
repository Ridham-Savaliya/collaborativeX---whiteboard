import React, { useRef, useEffect, useState, memo } from 'react';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Signal, Loader2, Crown, LogOut } from 'lucide-react';

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
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    onToggleAudio?: () => void;
    onToggleVideo?: () => void;
    isOwner?: boolean;
    callOwner?: string;
    currentUserId?: string;
}

/**
 * DraggableVideo Component
 * 
 * Handles the draggable video window functionality with enhanced owner display.
 * FIXED: Host badges are now visible to all participants, not just the host.
 */
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
    setIsMinimized,
    isOwner,
    callOwner,
    currentUserId
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
    
    // FIXED: Properly determine owner status for all participants
    const isUserOwner = isOwner || userId === callOwner;
    const isCurrentUserOwner = currentUserId === callOwner;

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
                <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-medium truncate">
                        {isLocal ? 'You' : username || 'Unknown User'}
                    </span>
                    {/* FIXED: Host crown is now visible to ALL participants */}
                    {isUserOwner && (
                        <div className="flex items-center gap-1 bg-yellow-500/20 px-1.5 py-0.5 rounded-full">
                            <Crown className="w-2.5 h-2.5 text-yellow-300" />
                            <span className="text-xs text-yellow-300 font-bold">Host</span>
                        </div>
                    )}
                </div>
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

/**
 * VideoDisplay Component (Memoized)
 * 
 * Handles video stream display with proper loading and disabled states.
 * FIXED: Properly shows camera off state when video is muted.
 */
const VideoDisplay = memo(({ 
    stream, 
    isLocal, 
    username, 
    videoEnabled = true,
    isLoading = false 
}: { 
    stream: MediaStream | null, 
    isLocal: boolean, 
    username: string,
    videoEnabled?: boolean,
    isLoading?: boolean
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    console.log(`[video-display] Rendering VideoDisplay for ${username}, videoEnabled: ${videoEnabled}, isLoading: ${isLoading}`);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (stream && videoEnabled && !isLoading) {
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
            }
            
            if (videoElement.paused) {
                videoElement.play().catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error(`[video-display] Playback failed for ${username}`, err);
                    }
                });
            }
        } else {
            if (videoElement.srcObject) {
                videoElement.srcObject = null;
            }
        }
    }, [stream, videoEnabled, username, isLoading]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-400" />
                    <p className="text-xs">Connecting...</p>
                </div>
            </div>
        );
    }

    // FIXED: Show proper camera off state when video is disabled
    if (!stream || !videoEnabled) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <div className="text-center text-white">
                    <VideoOff className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <p className="text-xs">Camera Off</p>
                </div>
            </div>
        );
    }

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

/**
 * VideoCallUI Component
 * 
 * Main UI for video call controls and display.
 * FIXED: Enhanced controls with proper owner-specific functionality.
 */
const VideoCallUI = ({
    stream,
    username,
    isLocal,
    onEndCall,
    isLoading,
    videoEnabled = true,
    audioEnabled = true,
    onToggleVideo,
    onToggleAudio,
    isMinimized,
    showToast,
    isOwner,
    callOwner,
    currentUserId
}: any) => {
    const showLoadingState = isLoading && !stream;
    const isCurrentUserOwner = currentUserId === callOwner;

    return (
        <div className="relative w-full h-full">
            <VideoDisplay 
                stream={stream} 
                isLocal={isLocal} 
                username={username} 
                videoEnabled={videoEnabled}
                isLoading={showLoadingState}
            />
            
            {/* FIXED: Enhanced controls with proper audio/video toggle functionality */}
            {isLocal && !isMinimized && onToggleAudio && onToggleVideo && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    <ControlButton 
                        Icon={audioEnabled ? Mic : MicOff} 
                        onClick={onToggleAudio} 
                        isActive={audioEnabled} 
                        title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                    />
                    <ControlButton 
                        Icon={videoEnabled ? Video : VideoOff} 
                        onClick={onToggleVideo} 
                        isActive={videoEnabled} 
                        title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                    />
                    {/* FIXED: Different button styling and text for owner vs participant */}
                    <ControlButton 
                        Icon={isCurrentUserOwner ? PhoneOff : LogOut}
                        onClick={onEndCall} 
                        isActive={true} 
                        isHangup={true} 
                        title={isCurrentUserOwner ? "End Call for Everyone" : "Leave Call"}
                    />
                </div>
            )}

            {/* FIXED: Enhanced media state indicators for remote users */}
            {!isLocal && !isMinimized && (
                <div className="absolute bottom-2 left-2 flex gap-1">
                    {!audioEnabled && (
                        <div className="bg-red-500/80 rounded-full p-1" title="Microphone muted">
                            <MicOff size={12} className="text-white" />
                        </div>
                    )}
                    {!videoEnabled && (
                        <div className="bg-red-500/80 rounded-full p-1" title="Camera off">
                            <VideoOff size={12} className="text-white" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * Main VideoCallWindow Component
 * 
 * The primary component for individual video call windows.
 * FIXED: Comprehensive owner tracking and proper audio/video state management.
 * 
 * @param stream - MediaStream for video/audio
 * @param username - Display name of the user
 * @param userId - Unique user identifier
 * @param isLocal - Whether this is the local user's window
 * @param customPosition - Initial position of the window
 * @param onEndCall - Callback for ending/leaving call
 * @param connectionQuality - Connection quality indicator
 * @param isLoading - Loading state
 * @param showToast - Toast notification function
 * @param audioEnabled - Whether audio is enabled
 * @param videoEnabled - Whether video is enabled
 * @param onToggleAudio - Audio toggle callback
 * @param onToggleVideo - Video toggle callback
 * @param isOwner - Whether this user is the call owner
 * @param callOwner - ID of the call owner
 * @param currentUserId - ID of the current user
 */
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
    audioEnabled = true,
    videoEnabled = true,
    onToggleAudio,
    onToggleVideo,
    isOwner,
    callOwner,
    currentUserId,
}) => {
    const [position, setPosition] = useState(customPosition);
    const [isMinimized, setIsMinimized] = useState(false);
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

    /**
     * Handle drag end event
     */
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
                isOwner={isOwner}
                callOwner={callOwner}
                currentUserId={currentUserId}
            >
                <VideoCallUI
                    stream={stream}
                    username={username}
                    isLocal={isLocal}
                    onEndCall={onEndCall}
                    isLoading={isLoading}
                    videoEnabled={videoEnabled}
                    audioEnabled={audioEnabled}
                    onToggleVideo={onToggleVideo}
                    onToggleAudio={onToggleAudio}
                    isMinimized={isMinimized}
                    showToast={showToast}
                    isOwner={isOwner}
                    callOwner={callOwner}
                    currentUserId={currentUserId}
                />
            </DraggableVideo>
        </DndContext>
    );
};

/**
 * ControlButton Component
 * 
 * Reusable button component for video call controls.
 * FIXED: Enhanced styling and accessibility.
 */
const ControlButton = ({ Icon, onClick, isActive, title, isHangup = false }: {
    Icon: React.ComponentType<any>;
    onClick: () => void;
    isActive: boolean;
    title: string;
    isHangup?: boolean;
}) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-2 rounded-full transition-all shadow-md backdrop-blur-sm hover:scale-110 active:scale-95 ${
            isHangup 
                ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-red-400/30' 
                : isActive 
                    ? 'bg-purple-600/70 hover:bg-purple-500/70 text-white ring-2 ring-purple-400/30' 
                    : 'bg-gray-700/70 hover:bg-gray-600/70 text-white ring-2 ring-gray-400/30'
        }`}
        aria-label={title}
    >
        <Icon size={14} />
    </button>
);

/**
 * Connection quality hook
 * 
 * Provides connection quality indicators.
 */
const useConnectionQuality = (quality: string) => {
    switch (quality) {
        case 'excellent': return { color: 'text-green-400', bars: 4, label: 'Excellent' };
        case 'good': return { color: 'text-yellow-400', bars: 3, label: 'Good' };
        case 'poor': return { color: 'text-orange-400', bars: 2, label: 'Poor' };
        default: return { color: 'text-red-400', bars: 1, label: 'Disconnected' };
    }
};

/**
 * ConnectionIndicator Component
 * 
 * Shows connection quality with visual indicator.
 */
const ConnectionIndicator = ({ connectionInfo }: { connectionInfo: any }) => (
    <div className="flex items-center" title={`Connection: ${connectionInfo.label}`}>
        <Signal size={12} className={connectionInfo.color} />
    </div>
);

export default memo(VideoCallWindow);