import { useState, useRef, useEffect, useCallback } from 'react';
import { DndContext, useDraggable, PointerSensor, useSensor } from '@dnd-kit/core';
import { Video, Users, Phone, GripVertical, X, Smartphone } from 'lucide-react';

interface UserPresence {
  userId: string;
  username: string;
  email: string;
  color: string;
  joined: boolean;
}

interface VideoCallLobbyProps {
  onlineUsers: UserPresence[];
  onRequest: (userIds: string[]) => void;
  onClose: () => void;
  currentUserId: string;
}

export default function VideoCallLobby({ onlineUsers, onRequest, onClose, currentUserId }: VideoCallLobbyProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const CONTAINER_WIDTH = 320;
  const CONTAINER_MIN_HEIGHT = 360;
  const CONTAINER_MAX_HEIGHT = 480;
  const VIEWPORT_MARGIN = 16;

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const maxSelectable = isMobile ? 1 : 3; // 1-to-1 on mobile, up to 4 total on desktop

  const sensors = useSensor(PointerSensor, { activationConstraint: { distance: 6 } });

  useEffect(() => {
    const updatePosition = () => {
      if (!dragRef.current) return;
      const containerHeight = Math.min(CONTAINER_MAX_HEIGHT, Math.max(CONTAINER_MIN_HEIGHT, window.innerHeight * 0.7));
      const centerX = (window.innerWidth - CONTAINER_WIDTH) / 2;
      const centerY = (window.innerHeight - containerHeight) / 2;
      setPosition({
        x: Math.max(VIEWPORT_MARGIN, Math.min(window.innerWidth - CONTAINER_WIDTH - VIEWPORT_MARGIN, centerX)),
        y: Math.max(VIEWPORT_MARGIN, Math.min(window.innerHeight - containerHeight - VIEWPORT_MARGIN, centerY)),
      });
    };
    
    updatePosition();
    const resizeObserver = new ResizeObserver(updatePosition);
    if (dragRef.current) resizeObserver.observe(dragRef.current);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      resizeObserver.disconnect();
    };
  }, []);

  function DraggableContainer({ children }: { children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'video-call-lobby' });
    const containerHeight = Math.min(CONTAINER_MAX_HEIGHT, Math.max(CONTAINER_MIN_HEIGHT, window.innerHeight * 0.7));
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: position.x + (transform?.x ?? 0),
      top: position.y + (transform?.y ?? 0),
      width: `${CONTAINER_WIDTH}px`,
      height: `${containerHeight}px`,
      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      touchAction: 'none',
      zIndex: 50,
    };

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          dragRef.current = node;
        }}
        style={style}
        className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl rounded-2xl border border-purple-200/50 dark:border-purple-700/50 overflow-hidden flex flex-col transition-all duration-300 ${
          isDragging ? 'shadow-2xl ring-2 ring-purple-500/30 scale-[1.01]' : 'shadow-lg'
        }`}
      >
        <div
          {...listeners}
          {...attributes}
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 cursor-move select-none"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-3 h-3 text-purple-200" />
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <Video className="w-3 h-3 text-white" />
            </div>
            <h3 className="font-semibold text-sm text-white">
              {isMobile ? '1-to-1 Call' : 'Group Call'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <div className="text-purple-100">
                <Smartphone className="w-3 h-3" />
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-purple-100">
              <Users className="w-3 h-3" />
              <span>{onlineUsers.filter(u => u.userId !== currentUserId).length}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    );
  }

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = (event: any) => {
    const { delta } = event;
    setIsDragging(false);
    const containerHeight = Math.min(CONTAINER_MAX_HEIGHT, Math.max(CONTAINER_MIN_HEIGHT, window.innerHeight * 0.7));
    const newX = position.x + delta.x;
    const newY = position.y + delta.y;
    setPosition({
      x: Math.max(VIEWPORT_MARGIN, Math.min(window.innerWidth - CONTAINER_WIDTH - VIEWPORT_MARGIN, newX)),
      y: Math.max(VIEWPORT_MARGIN, Math.min(window.innerHeight - containerHeight - VIEWPORT_MARGIN, newY)),
    });
  };

  const getInitials = (name: string): string =>
    name.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);

  const handleCheckboxChange = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else if (prev.length < maxSelectable) {
        return [...prev, userId];
      } else {
        // Don't show alert - just return previous state
        return prev;
      }
    });
  }, [maxSelectable]);

  const handleCallSelectedUsers = useCallback(() => {
    if (selectedUserIds.length === 0) {
      return; // Don't show alert - button should be disabled
    }
    
    onRequest(selectedUserIds);
    setSelectedUserIds([]);
  }, [selectedUserIds, onRequest]);

  const availableUsers = onlineUsers.filter((user) => user.userId !== currentUserId);

  return (
    <DndContext sensors={[sensors]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DraggableContainer>
        {/* Mobile device info banner */}
        {isMobile && (
          <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-700/50">
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-medium">Mobile: 1-to-1 calls only</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {availableUsers.length > 0 ? (
            <div className="space-y-2">
              {availableUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="group flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/40 hover:bg-purple-50/80 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 border border-gray-200/40 dark:border-gray-700/40 hover:border-purple-200/60 dark:hover:border-purple-700/40"
                  style={{ 
                    animationDelay: `${index * 60}ms`, 
                    animation: 'slideInUp 0.4s ease-out forwards' 
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.userId)}
                      onChange={() => handleCheckboxChange(user.userId)}
                      disabled={!selectedUserIds.includes(user.userId) && selectedUserIds.length >= maxSelectable}
                      className="form-checkbox h-4 w-4 text-purple-600 transition duration-150 ease-in-out rounded focus:ring-purple-500 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center ring-2 ring-purple-200/60 dark:ring-purple-700/60 text-white font-medium text-sm"
                        style={{ 
                          background: `linear-gradient(45deg, ${user.color}, ${user.color}CC)`
                        }}
                      >
                        {getInitials(user.username)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {user.username}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center max-w-xs space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-sm bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30">
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">No one's online</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Other users will appear here when they come online and are available for video calls.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Action Button with purple theme */}
        {availableUsers.length > 0 && (
          <div className="p-4 border-t border-purple-200/50 dark:border-purple-700/50 bg-gradient-to-r from-purple-50/50 to-violet-50/50 dark:from-purple-900/20 dark:to-violet-900/20">
            <button
              onClick={handleCallSelectedUsers}
              disabled={selectedUserIds.length === 0}
              className={`flex items-center justify-center w-full gap-2 px-4 py-3 text-white font-semibold rounded-xl shadow-md transition-all duration-200 ${
                selectedUserIds.length > 0 
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 active:scale-98 shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                  : 'bg-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Phone className="w-5 h-5" />
              <span>
                {isMobile 
                  ? `Start Call ${selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}` 
                  : `Start Group Call ${selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}`
                }
              </span>
            </button>
            
            {/* Selection info with purple theme */}
            <div className="mt-3 text-center">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                {isMobile 
                  ? 'Select 1 user for video call' 
                  : `Select up to ${maxSelectable} users (${selectedUserIds.length}/${maxSelectable} selected)`
                }
              </p>
              {selectedUserIds.length >= maxSelectable && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {isMobile ? 'Mobile supports 1-to-1 calls only' : 'Maximum participants reached'}
                </p>
              )}
            </div>
          </div>
        )}
      </DraggableContainer>
    </DndContext>
  );
}