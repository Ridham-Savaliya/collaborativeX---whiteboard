// Frontend: VideocallLobby Component
import { useState, useRef, useEffect, useCallback } from 'react';
import { DndContext, useDraggable, PointerSensor, useSensor } from '@dnd-kit/core';
import { Video, Users, Phone, GripVertical, X } from 'lucide-react';

export default function VideoCallLobby({ onlineUsers, onRequest, onClose, currentUserId }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const dragRef = useRef(null);

  const CONTAINER_WIDTH = 320;
  const CONTAINER_MIN_HEIGHT = 360;
  const CONTAINER_MAX_HEIGHT = 480;
  const VIEWPORT_MARGIN = 16;

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

  function DraggableContainer({ children }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'video-call-lobby' });
    const containerHeight = Math.min(CONTAINER_MAX_HEIGHT, Math.max(CONTAINER_MIN_HEIGHT, window.innerHeight * 0.7));
    const style = {
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
        className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col transition-all duration-300 ${isDragging ? 'shadow-2xl ring-2 ring-purple-500/30 scale-[1.01]' : 'shadow-lg'}`}
      >
        <div
          {...listeners}
          {...attributes}
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 cursor-move select-none"
          style={{ backgroundColor: '#9333ea' }}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-3 h-3 text-purple-200" />
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <Video className="w-3 h-3 text-white" />
            </div>
            <h3 className="font-semibold text-sm text-white">Video Lobby</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-purple-100">
              <Users className="w-3 h-3" />
              <span>{onlineUsers.length}</span>
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
  const handleDragEnd = (event) => {
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

  const getInitials = (name) => name.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);

  const handleCheckboxChange = useCallback((userId) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else if (prev.length < 3) {
        return [...prev, userId];
      } else {
        alert('You can select a maximum of 3 other users for a group call.');
        return prev;
      }
    });
  }, []);

  const handleCallSelectedUsers = useCallback(() => {
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user to call.');
      return;
    }
    onRequest(selectedUserIds);
    setSelectedUserIds([]);
  }, [selectedUserIds, onRequest]);

  return (
    <DndContext sensors={[sensors]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DraggableContainer>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {onlineUsers.length > 0 ? (
            <div className="space-y-2">
              {onlineUsers
                .filter((user) => user.userId !== currentUserId)
                .map((user, index) => (
                  <div
                    key={user.userId}
                    className="group flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/40 hover:bg-purple-50/80 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 border border-gray-200/40 dark:border-gray-700/40 hover:border-purple-200/60 dark:hover:border-purple-700/40"
                    style={{ animationDelay: `${index * 60}ms`, animation: 'slideInUp 0.4s ease-out forwards' }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.userId)}
                        onChange={() => handleCheckboxChange(user.userId)}
                        className="form-checkbox h-4 w-4 text-purple-600 transition duration-150 ease-in-out rounded focus:ring-purple-500 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-purple-600"
                      />
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center ring-2 ring-gray-200/60 dark:ring-gray-700/60 text-white font-medium text-xs"
                          style={{ backgroundColor: '#9333ea' }}
                        >
                          {getInitials(user.username)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{user.username}</h4>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center max-w-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#9333ea20' }}>
                  <Users className="w-6 h-6" style={{ color: '#9333ea' }} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">No one's online</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                    Users will appear here when they come online.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        {onlineUsers.length > 0 && (
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={handleCallSelectedUsers}
              disabled={selectedUserIds.length === 0}
              className={`flex items-center justify-center w-full gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ${
                selectedUserIds.length > 0 ? 'bg-purple-600 hover:bg-purple-700 active:scale-98' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Start Group Call ({selectedUserIds.length})</span>
            </button>
          </div>
        )}
      </DraggableContainer>
    </DndContext>
  );
}
