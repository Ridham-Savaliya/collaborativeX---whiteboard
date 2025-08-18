import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { throttle, debounce } from "lodash";
import NavBar from "./CanvasRightNavbar";
import { io, Socket } from "socket.io-client";
import {
  WhiteboardElement,
  PathElement,
  ShapeElement,
  TextElement,
  StickyNote,
  Point,
} from "./Types";
import CanvasToolbar from "./CanvasToolbar";
import { FaArrowRight } from "react-icons/fa";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useTheme } from "../context/ThemeContext";
import CommingSoon from './templates/Commingsoon'
import {
  Users,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  Clock,
  Eye,
  MousePointer2,
  ChevronDown,
  ChevronUp,
  User,
  X,
  Sparkles
} from "lucide-react";
import { useParams } from "next/navigation";
import { useToast } from "../utills/ToastProvider";
import Videocall from "./videocall/index";
import Draggable from "react-draggable";
import axios from "axios";  
import Kanban from "./templates/Kanban";
import Mindmaps from './templates/Mindmaps.tsx'
import { ReactFlowProvider } from "reactflow";

// Import the enhanced GeminiCanvasAnalyzer
import EnhancedGeminiAnalyzer from "./AiCanvasAnalyzer";
// Import enhanced components
import { EnhancedShapeRecognizer, RecognizedShape, AnimationFrame } from '../components/ShapeRecognision/ShapeRecognision';

// Keep all existing interfaces and components from the original code...
// [All existing interfaces, components, and functions remain exactly the same]

interface CanvasProps {
  strokeColor: string;
  lineWidth: number;
  tool:
  | "pen"
  | "eraser"
  | "highlighter"
  | "shape"
  | "stickyNote"
  | "text"
  | null;
  shapeType: string | null;
  stickyNotes: StickyNote[];
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  textFontSize: number;
  saveToHistory: (state: {
    elements: WhiteboardElement[];
    stickyNotes: StickyNote[];
  }) => void;
  historyIndex: number;
  history: { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }[];
  textStyles: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily: string;
  };
  whiteboardId?: string;
  token?: string;
  currentUser?: string;
  path:string
}

interface UserPresence {
  userId: string;
  username: string;
  email: string;
  joined?: boolean;
  socketId?: string;
  color?: string;
}

interface ActivityUpdate {
  userId: string;
  username?: string;
  action: string;
  timestamp: string;
}

interface CursorPosition {
  socketId: string;
  x: number;
  y: number;
  username?: string;
  color?: string;
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnected?: Date;
  reconnectAttempts?: number;
  latency?: number;
}

interface SocketError {
  message: string;
  code?: string;
  timestamp: Date;
}

interface StickyNoteProps {
  note: StickyNote;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeNoteId: string | null;
  editingNoteId: string | null;
  handleStickyNoteMouseDown: (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => void;
  handleStickyNoteDoubleClick: (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => void;
  handleStickyNoteTextChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    noteId: string
  ) => void;
  handleFinishEditing: () => void;
  handleDeleteStickyNote: (noteId: string) => void;
  handleResizeStart: (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string,
    direction: string
  ) => void;
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  showColorPicker: (noteId: string, x: number, y: number) => void;
  textStyles: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily: string;
  };
  textFontSize: number;
}

interface TextComponentProps {
  textElement: TextElement;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeTextId: string | null;
  editingTextId: string | null;
  handleTextMouseDown: (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => void;
  handleTextDoubleClick: (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => void;
  handleTextChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    textId: string
  ) => void;
  handleFinishTextEditing: () => void;
  setElements: React.Dispatch<React.SetStateAction<WhiteboardElement[]>>;
  textStyles: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontFamily: string;
  };
  textFontSize: number;
}

interface ShapeComponentProps {
  shape: ShapeElement;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeShapeId: string | null;
  handleShapeMouseDown: (
    e: React.MouseEvent<HTMLDivElement>,
    shapeId: string
  ) => void;
  handleDeleteShape: (shapeId: string) => void;
  handleShapeResizeStart: (
    e: React.MouseEvent<HTMLDivElement>,
    shapeId: string,
    direction: string
  ) => void;
}

// Utility functions
const generateUniqueId = (): string =>
  `id-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;

const isValidId = (id: string | undefined): boolean =>
  id !== undefined && id !== null && id !== "";

const ensureUniqueIds = <T extends { id: string }>(items: T[]): T[] => {
  const seenIds = new Set<string>();
  return items.map((item) => {
    if (!item || !isValidId(item.id) || seenIds.has(item.id)) {
      return { ...item, id: generateUniqueId() };
    }
    seenIds.add(item.id);
    return item;
  });
};

// Color palette for sticky notes
const colorPalette = [
  { bg: "#FEF7CD", text: "#000000" },
  { bg: "#D3E4FD", text: "#000000" },
  { bg: "#E5DEFF", text: "#000000" },
  { bg: "#F2FCE2", text: "#000000" },
  { bg: "#FFDEE2", text: "#000000" },
  { bg: "#FDE1D3", text: "#000000" },
  { bg: "#FFD700", text: "#000000" },
  { bg: "#98FB98", text: "#000000" },
  { bg: "#FFB6C1", text: "#000000" },
  { bg: "#ADD8E6", text: "#000000" },
  { bg: "#FFFACD", text: "#000000" },
  { bg: "#E6E6FA", text: "#000000" },
  { bg: "#FFFFFF", text: "#000000" },
  { bg: "#D3D3D3", text: "#000000" },
  { bg: "#A9A9A9", text: "#FFFFFF" },
  { bg: "#000000", text: "#FFFFFF" },
];

// Keep all existing component implementations (ConnectionStatus, UserPresence, etc.)
// [All existing helper components remain exactly the same...]

const ConnectionStatus: React.FC<{
  connectionState: ConnectionState;
  onRetry?: () => void;
}> = ({ connectionState, onRetry }) => {
  const getStatusIcon = () => {
    switch (connectionState.status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting... (${connectionState.reconnectAttempts || 0}/5)`;
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      case 'disconnected':
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>

      {connectionState.latency && connectionState.status === 'connected' && (
        <div className="flex items-center gap-1 ml-2 text-xs opacity-70">
          <Clock className="w-3 h-3" />
          <span>{connectionState.latency}ms</span>
        </div>
      )}

      {(connectionState.status === 'error' || connectionState.status === 'disconnected') && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-current rounded hover:bg-opacity-80 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

const UserPresence: React.FC<{
  users: UserPresence[];
  currentUser?: string;
}> = ({ users, currentUser }) => {
  const activeUsers = users.filter(user => user.joined);

  console.log("active users of the canvas", activeUsers)

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} online
        </span>
      </div>

      <div className="flex items-center gap-1">
        {activeUsers.slice(0, 5).map((user, index) => (
          <div
            key={user.email}
            className="relative group"
            title={user.username}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center text-xs font-semibold text-white shadow-sm transition-transform hover:scale-110"
              style={{ backgroundColor: user.color || '#6B7280' }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {user.username}
              {user.email === currentUser && ' (You)'}
            </div>

            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          </div>
        ))}

        {activeUsers.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
            +{activeUsers.length - 5}
          </div>
        )}
      </div>

      {activeUsers.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Eye className="w-3 h-3" />
          <span>Live collaboration</span>
        </div>
      )}
    </div>
  );
};

// Activity Feed Component (keeping existing implementation)
const ActivityFeed: React.FC<{
  activities: ActivityUpdate[];
}> = ({ activities }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayActivities = isExpanded ? activities.slice(0, 20) : activities.slice(0, 5);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Activity</h3>
        </div>
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Activity</h3>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            {activities.length}
          </span>
        </div>

        {activities.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Show more</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayActivities.map((activity, index) => (
          <div
            key={`${activity.timestamp}-${index}`}
            className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {activity.username || 'A user'}
                </span>
                {' '}
                <span>{activity.action}</span>
              </div>

              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatTime(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Keep all existing error, cursor, and collaboration panel components...
// [ErrorNotifications, CursorOverlay, CollaborationPanel components remain the same]

const ErrorNotifications: React.FC<{
  errors: SocketError[];
  onDismiss: (index: number) => void;
  onDismissAll: () => void;
  onRetry?: () => void;
}> = ({ errors, onDismiss, onDismissAll, onRetry }) => {
  if (errors.length === 0) return null;

  const getErrorIcon = (error: SocketError) => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'CONNECTION_ERROR':
        return <Wifi className="w-4 h-4" />;
      case 'RECONNECT_FAILED':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorSeverity = (error: SocketError) => {
    const criticalCodes = ['CONNECTION_ERROR', 'RECONNECT_FAILED', 'SERVER_DISCONNECT'];
    return criticalCodes.includes(error.code || '') ? 'critical' : 'warning';
  };

  return (
    <div className="fixed bottom-4 left-20 z-50 max-w-sm space-y-2">
      {errors.length > 1 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {errors.length} connection issues
            </span>
            <button
              onClick={onDismissAll}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errors.slice(0, 3).map((error, index) => {
        const severity = getErrorSeverity(error);
        const baseClasses = "bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 animate-slide-in-right";
        const severityClasses = severity === 'critical'
          ? "border-red-200 dark:border-red-800"
          : "border-yellow-200 dark:border-yellow-800";

        return (
          <div key={index} className={`${baseClasses} ${severityClasses}`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${severity === 'critical'
                ? 'text-red-500 dark:text-red-400'
                : 'text-yellow-500 dark:text-yellow-400'
                }`}>
                {getErrorIcon(error)}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${severity === 'critical'
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                  Connection Issue
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {error.message}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {error.timestamp.toLocaleTimeString()}
                </div>

                {(error.code === 'CONNECTION_ERROR' || error.code === 'RECONNECT_FAILED') && onRetry && (
                  <button
                    onClick={onRetry}
                    className={`mt-2 text-xs px-2 py-1 rounded border transition-colors ${severity === 'critical'
                      ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20'
                      : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/20'
                      }`}
                  >
                    Retry Connection
                  </button>
                )}
              </div>

              <button
                onClick={() => onDismiss(index)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CursorOverlay: React.FC<{
  cursors: CursorPosition[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
}> = ({ cursors, zoomLevel, panOffset }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {cursors.map((cursor) => (
        <div
          key={cursor.socketId}
          className="absolute transition-all duration-75 ease-out"
          style={{
            left: `${cursor.x * zoomLevel + panOffset.x}px`,
            top: `${cursor.y * zoomLevel + panOffset.y}px`,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <div className="relative">
            <MousePointer2
              className="w-5 h-5 drop-shadow-lg"
              style={{
                color: cursor.color || '#6B7280',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
              }}
            />

            {cursor.username && (
              <div
                className="absolute top-6 left-0 px-2 py-1 text-xs font-medium text-white rounded shadow-lg whitespace-nowrap pointer-events-none animate-fade-in"
                style={{
                  backgroundColor: cursor.color || '#6B7280',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                {cursor.username}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const CollaborationPanel: React.FC<{
  connectionState: ConnectionState;
  connectedUsers: UserPresence[];
  recentActivity: ActivityUpdate[];
  errors: SocketError[];
  currentUser?: string;
  onRetryConnection?: () => void;
  onDismissError: (index: number) => void;
  onDismissAllErrors: () => void;
}> = ({
  connectionState,
  connectedUsers,
  recentActivity,
  errors,
  currentUser,
  onRetryConnection,
  onDismissError,
  onDismissAllErrors
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const handleCollaborationCollapse = () => {
      setIsCollapsed((prev) => !prev);
    };

    return (
      <>
        <ErrorNotifications
          errors={errors}
          onDismiss={onDismissError}
          onDismissAll={onDismissAllErrors}
          onRetry={onRetryConnection}
        />

        <div className={`fixed top-4 right-4 z-40 transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
          <div className="backdrop-blur-lg rounded-lg shadow-lg  overflow-hidden">

            <div className="flex items-center justify-between p-1 border-b border-gray-00 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCollaborationCollapse}
                  className="p-2 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full hover:from-purple-400 hover:to-purple-600 transition-all duration-300"
                  title="Collaboration"
                  aria-label="collaboration"
                >
                  <Users size={20} />
                </button>

                {!isCollapsed && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Collaboration
                  </h2>
                )}
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className=" rounded-md bg-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {!isCollapsed && (<FaArrowRight className="w-6 h-6 p-1" />
                )}
              </button>
            </div>

            {!isCollapsed && (
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <ConnectionStatus
                  connectionState={connectionState}
                  onRetry={onRetryConnection}
                />

                <UserPresence
                  users={connectedUsers}
                  currentUser={currentUser}
                />

                <ActivityFeed activities={recentActivity} />
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

// Keep all existing component implementations (StickyNoteComponent, TextComponent, ShapeComponent)
// [All existing component implementations remain exactly the same...]

const StickyNoteComponent = memo(
  ({
    note,
    zoomLevel,
    panOffset,
    activeNoteId,
    editingNoteId,
    handleStickyNoteMouseDown,
    handleStickyNoteDoubleClick,
    handleStickyNoteTextChange,
    handleFinishEditing,
    handleDeleteStickyNote,
    handleResizeStart,
    setStickyNotes,
    showColorPicker,
    textStyles,
    textFontSize,
  }: StickyNoteProps) => {
    if (!isValidId(note.id)) {
      console.error("Invalid note ID", note);
      return null;
    }

    const adjustedX = note.x * zoomLevel + panOffset.x;
    const adjustedY = note.y * zoomLevel + panOffset.y;
    const bgColor = note.bgColor || "#FEF7CD";

    return (
      <div
        data-note-id={note.id}
        className={`absolute rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${activeNoteId === note.id
          ? "z-30 shadow-2xl ring-2 ring-purple-400 transform scale-105"
          : "z-20 shadow-lg hover:shadow-xl"
          }`}
        style={{
          width: `${note.width * zoomLevel}px`,
          height: `${note.height * zoomLevel}px`,
          background: bgColor,
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          border: "1px solid rgba(0,0,0,0.1)",
          transform: activeNoteId === note.id ? 'scale(1.02)' : 'scale(1)',
        }}
        onMouseDown={(e) => handleStickyNoteMouseDown(e, note.id)}
        onDoubleClick={(e) => handleStickyNoteDoubleClick(e, note.id)}
      >
        <div className="h-full w-full flex flex-col">
          <div className="flex justify-between items-center p-2 bg-gradient-to-r from-black/5 to-transparent">
            <button
              className="relative group bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full p-1.5 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 transform hover:scale-110 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                showColorPicker(note.id, rect.right + 8, rect.top);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={bgColor}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
            <button
              className="relative group bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full p-1.5 hover:from-red-600 hover:to-red-800 transition-all duration-200 transform hover:scale-110 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStickyNote(note.id);
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-3">
            {editingNoteId === note.id ? (
              <textarea
                className="w-full h-full bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-md p-2 transition-all duration-200 whitespace-normal break-words"
                style={{
                  color: note.textColor,
                  fontSize: `${textFontSize * zoomLevel}px`,
                  fontWeight: textStyles.bold ? "bold" : "normal",
                  fontStyle: textStyles.italic ? "italic" : "normal",
                  textDecoration: textStyles.underline ? "underline" : "none",
                  fontFamily: textStyles.fontFamily,
                }}
                value={note.text}
                onChange={(e) => handleStickyNoteTextChange(e, note.id)}
                autoFocus
                onBlur={handleFinishEditing}
                placeholder="Enter text here"
                rows={5}
              />
            ) : (
              <div
                className="w-full h-full overflow-y-auto overflow-x-hidden cursor-move whitespace-normal break-words select-text"
                style={{
                  color: note.textColor,
                  fontSize: `${textFontSize * zoomLevel}px`,
                  fontWeight: textStyles.bold ? "bold" : "normal",
                  fontStyle: textStyles.italic ? "italic" : "normal",
                  textDecoration: textStyles.underline ? "underline" : "none",
                  fontFamily: textStyles.fontFamily,
                }}
              >
                {note.text || "Double-click to edit"}
              </div>
            )}
          </div>
        </div>
        {activeNoteId === note.id && !editingNoteId && (
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 translate-y-1/2 cursor-se-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200 animate-pulse"
              onMouseDown={(e) => handleResizeStart(e, note.id, "se")}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 translate-y-1/2 cursor-sw-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200 animate-pulse"
              onMouseDown={(e) => handleResizeStart(e, note.id, "sw")}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-ne-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200 animate-pulse"
              onMouseDown={(e) => handleResizeStart(e, note.id, "ne")}
            />
            <div
              className="absolute top-0 left-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-nw-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200 animate-pulse"
              onMouseDown={(e) => handleResizeStart(e, note.id, "nw")}
            />
          </>
        )}
      </div>
    );
  }
);

StickyNoteComponent.displayName = "StickyNoteComponent";

const TextComponent = memo(
  ({
    textElement,
    zoomLevel,
    panOffset,
    activeTextId,
    editingTextId,
    handleTextMouseDown,
    handleTextDoubleClick,
    handleTextChange,
    handleFinishTextEditing,
    setElements,
    textStyles,
    textFontSize,
  }: TextComponentProps) => {
    if (!isValidId(textElement.id)) {
      console.error("Invalid text element ID", textElement);
      return null;
    }

    const adjustedX = textElement.x * zoomLevel + panOffset.x;
    const adjustedY = textElement.y * zoomLevel + panOffset.y;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (editingTextId === textElement.id && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, [editingTextId, textElement.id]);

    return (
      <div
        data-text-id={textElement.id}
        className={`absolute shadow-md rounded-md overflow-visible transition-all duration-200 ${activeTextId === textElement.id
          ? "z-30 shadow-xl ring-2 ring-purple-500 transform scale-105"
          : "z-20"
          }`}
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          cursor: editingTextId === textElement.id ? "text" : "move",
          transform: activeTextId === textElement.id ? 'scale(1.02)' : 'scale(1)',
        }}
        onMouseDown={(e) => handleTextMouseDown(e, textElement.id)}
        onDoubleClick={(e) => handleTextDoubleClick(e, textElement.id)}
      >
        {editingTextId === textElement.id ? (
          <textarea
            ref={textareaRef}
            className="bg-transparent border-none resize-none focus:outline-none p-1 rounded-md overflow-y-auto overflow-x-hidden whitespace-pre-wrap"
            style={{
              color: textElement.color,
              fontSize: `${textFontSize * zoomLevel}px`,
              fontWeight: textStyles.bold ? "bold" : "normal",
              fontStyle: textStyles.italic ? "italic" : "normal",
              textDecoration: textStyles.underline ? "underline" : "none",
              fontFamily: textStyles.fontFamily,
              minWidth: "100px",
              minHeight: "30px",
            }}
            value={textElement.text}
            onChange={(e) => handleTextChange(e, textElement.id)}
            onBlur={handleFinishTextEditing}
            placeholder="Enter text here"
          />
        ) : (
          <div
            className="p-1 rounded-md overflow-y-auto overflow-x-hidden cursor-move whitespace-pre-wrap"
            style={{
              color: textElement.color,
              fontSize: `${textFontSize * zoomLevel}px`,
              fontWeight: textStyles.bold ? "bold" : "normal",
              fontStyle: textStyles.italic ? "italic" : "normal",
              textDecoration: textStyles.underline ? "underline" : "none",
              fontFamily: textStyles.fontFamily,
            }}
          >
            {textElement.text || "Double-click to edit"}
          </div>
        )}
        {activeTextId === textElement.id && !editingTextId && (
          <button
            className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer z-40 hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              setElements((prev) =>
                prev.filter((el) => el.id !== textElement.id)
              );
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

TextComponent.displayName = "TextComponent";

const ShapeComponent = memo(
  ({
    shape,
    zoomLevel,
    panOffset,
    activeShapeId,
    handleShapeMouseDown,
    handleDeleteShape,
    handleShapeResizeStart,
  }: ShapeComponentProps) => {
    if (!isValidId(shape.id)) {
      console.error("Invalid shape ID", shape);
      return null;
    }

    const adjustedX = shape.x * zoomLevel + panOffset.x;
    const adjustedY = shape.y * zoomLevel + panOffset.y;
    const adjustedWidth = shape.width * zoomLevel;
    const adjustedHeight = shape.height * zoomLevel;

    const renderShape = () => {
      const strokeWidth = (shape.lineWidth || 2) / zoomLevel;

      switch (shape.type) {
        case "rectangle":
          return (
            <rect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              width={Math.max(0, adjustedWidth - strokeWidth)}
              height={Math.max(0, adjustedHeight - strokeWidth)}
              fill="transparent"
              stroke={shape.color}
              strokeWidth={strokeWidth}
            />
          );

        case "circle":
          return (
            <ellipse
              cx={adjustedWidth / 2}
              cy={adjustedHeight / 2}
              rx={Math.max(0, (adjustedWidth - strokeWidth) / 2)}
              ry={Math.max(0, (adjustedHeight - strokeWidth) / 2)}
              fill="transparent"
              stroke={shape.color}
              strokeWidth={strokeWidth}
            />
          );

        case "triangle":
          const trianglePoints = `${adjustedWidth / 2},${strokeWidth / 2} ${strokeWidth / 2},${adjustedHeight - strokeWidth / 2} ${adjustedWidth - strokeWidth / 2},${adjustedHeight - strokeWidth / 2}`;
          return (
            <polygon
              points={trianglePoints}
              fill="transparent"
              stroke={shape.color}
              strokeWidth={strokeWidth}
            />
          );

        case "diamond":
          const dX = adjustedWidth / 2;
          const dY = adjustedHeight / 2;
          return (
            <polygon
              points={`${dX},${strokeWidth / 2} ${adjustedWidth - strokeWidth / 2},${dY} ${dX},${adjustedHeight - strokeWidth / 2} ${strokeWidth / 2},${dY}`}
              fill="transparent"
              stroke={shape.color}
              strokeWidth={strokeWidth}
            />
          );

        case "line":
          return (
            <line
              x1={strokeWidth / 2}
              y1={strokeWidth / 2}
              x2={adjustedWidth - strokeWidth / 2}
              y2={adjustedHeight - strokeWidth / 2}
              stroke={shape.color}
              strokeWidth={strokeWidth}
            />
          );

        case "ellipse":
          return (
            <ellipse
              cx={adjustedWidth / 2}
              cy={adjustedHeight / 2}
              rx={Math.max(0, (adjustedWidth - strokeWidth) / 2)}
              ry={Math.max(0, (adjustedHeight - strokeWidth) / 2)}
              fill="transparent"
              stroke={shape.color}
              strokeWidth={strokeWidth}
            />
          );

        default:
          return null;
      }
    };


    return (
      <div
        data-shape-id={shape.id}
        className={`absolute transition-all duration-200 ${activeShapeId === shape.id
          ? "z-30 ring-2 purple-500"
          : "z-20"
          }`}
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
          width: `${Math.abs(adjustedWidth)}px`,
          height: `${Math.abs(adjustedHeight)}px`,
          cursor: "move",
        }}
        onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
      >
        <svg
          width="100%"
          height="100%"
          className="pointer-events-none"
          style={{ overflow: "visible" }}
        >
          {renderShape()}
        </svg>

        {activeShapeId === shape.id && (
          <button
            className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer z-40 hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteShape(shape.id);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {activeShapeId === shape.id && (
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 translate-y-1/2 cursor-se-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, shape.id, "se")}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 translate-y-1/2 cursor-sw-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, shape.id, "sw")}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform translate-x-1/2 -translate-y-1/2 cursor-ne-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, shape.id, "ne")}
            />
            <div
              className="absolute top-0 left-0 w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-nw-resize z-40 hover:bg-purple-700 hover:scale-125 transition-all duration-200"
              onMouseDown={(e) => handleShapeResizeStart(e, shape.id, "nw")}
            />
          </>
        )}
      </div>
    );
  }
);

ShapeComponent.displayName = "ShapeComponent";

// Main Canvas Component with enhanced Gemini AI integration
const Canvas: React.FC<CanvasProps> = ({
  strokeColor,
  lineWidth,
  tool,
  shapeType,
  stickyNotes,
  setStickyNotes,
  textFontSize,
  saveToHistory,
  historyIndex,
  history,
  textStyles,
  currentUser = "demo@example.com",
}) => {
  // Keep all existing state variables...
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const contentCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationCanvasRef = useRef<HTMLCanvasElement>(null);

  const [gridContext, setGridContext] = useState<CanvasRenderingContext2D | null>(null);
  const [contentContext, setContentContext] = useState<CanvasRenderingContext2D | null>(null);
  const [animationContext, setAnimationContext] = useState<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const elementsRef = useRef<WhiteboardElement[]>([]);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  const [shapeRecognitionEnabled, setShapeRecognitionEnabled] = useState(true);
  const [isShapeProcessing, setIsShapeProcessing] = useState(false);
  const [animatingShape, setAnimatingShape] = useState<{
    frames: AnimationFrame[];
    currentFrame: number;
    elementId: string;
  } | null>(null);

  // Enhanced AI state with premium features
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showGeminiAssistant, setShowGeminiAssistant] = useState(false);

  // Keep all other existing state variables...
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);

  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [isResizingNote, setIsResizingNote] = useState(false);
  const [isResizingShape, setIsResizingShape] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [currentTemplate, setcurrentTemplate] = useState('')
  const [showingTemplate, setshowingTemplate] = useState(false)

  const [colorPicker, setColorPicker] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'disconnected' });
  const [connectedUsers, setConnectedUsers] = useState<UserPresence[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityUpdate[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [errors, setErrors] = useState<SocketError[]>([]);
  const latencyCheckRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast()

  const stickyNoteColors = [
    "#FEF7CD",
    "#D3E4FD",
    "#E5DEFF",
    "#F2FCE2",
    "#FFDEE2",
    "#FDE1D3",
  ];

  const tempNoteState = useRef<StickyNote | null>(null);
  const tempTextState = useRef<TextElement | null>(null);
  const tempShapeState = useRef<ShapeElement | null>(null);
  const newTextIdRef = useRef<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Keep all existing functions (socket handling, drawing, etc.)...
  // [All existing functions remain exactly the same until the toggleTool function]

  const debouncedSaveToHistory = useCallback(
    debounce((elements: WhiteboardElement[], stickyNotes: StickyNote[]) => {
      saveToHistory({ elements, stickyNotes });
    }, 100),
    [saveToHistory]
  );

  const addError = useCallback((message: string, code?: string) => {
    const error: SocketError = {
      message,
      code,
      timestamp: new Date(),
    };
    setErrors(prev => [error, ...prev.slice(0, 9)]);
  }, []);

  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const measureLatency = useCallback(() => {
    if (socketRef.current?.connected) {
      const start = Date.now();
      socketRef.current.emit('ping', start);
      latencyCheckRef.current = start;
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      addError('Cannot emit event: Socket not connected', 'SOCKET_DISCONNECTED');
    }
  }, [addError]);

  const retryConnection = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  const token = localStorage.getItem('token')
  const params = useParams();
  const whiteboardId = params.id;

  const toggleShapeRecognition = useCallback(() => {
    setShapeRecognitionEnabled(prev => {
      const newState = !prev;
      return newState;
    });
  }, []);

  const debouncedRecognizeShape = (() => {
    let timeoutId: NodeJS.Timeout;
    
    return (
      points: { x: number; y: number }[],
      callback: (shape: RecognizedShape | null) => void,
      delay: number = 50
    ) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const recognizedShape = EnhancedShapeRecognizer.recognizeShape(points);
        callback(recognizedShape);
      }, delay);
    };
  })();

  const handleShapeRecognition = useCallback((
    elementId: string,
    points: { x: number; y: number }[]
  ) => {
    if (!shapeRecognitionEnabled || points.length < 4) return;
    
    setIsShapeProcessing(true);
    
    debouncedRecognizeShape(points, (recognizedShape) => {
      setIsShapeProcessing(false);
      
      if (recognizedShape && recognizedShape.confidence > 0.6) {
        const frames = EnhancedShapeRecognizer.generateAnimationFrames(points, recognizedShape);
        
        setAnimatingShape({
          frames,
          currentFrame: 0,
          elementId
        });

        const animationTimeout = setTimeout(() => {
          setElements(prev => {
            const newElements = prev.map(el => {
              if (el.id === elementId && el.type === 'path') {
                const pathEl = el as PathElement;
                const newShape: ShapeElement = {
                  id: elementId,
                  type: recognizedShape.type,
                  x: recognizedShape.bounds.x,
                  y: recognizedShape.bounds.y,
                  width: recognizedShape.bounds.width,
                  height: recognizedShape.bounds.height,
                  color: pathEl.color,
                  lineWidth: pathEl.width,
                  isFixed: false,
                };
                return newShape;
              }
              return el;
            });
            
            elementsRef.current = newElements;
            debouncedSaveToHistory(newElements, stickyNotes);
            
            const convertedShape = newElements.find(el => el.id === elementId);
            if (convertedShape) {
              emit('shapeRecognized', convertedShape);
            }
            
            return newElements;
          });

          setTimeout(() => {
            setAnimatingShape(null);
          }, 100);
        }, 250);

        return () => clearTimeout(animationTimeout);
      }
    });
  }, [shapeRecognitionEnabled, debouncedSaveToHistory, stickyNotes, emit]);

  // Keep all existing effect hooks and other functions...
  // [All existing useEffect hooks and functions remain the same]

  useEffect(() => {
    if (!animatingShape || !animationContext) return;

    const animate = () => {
      const { frames, currentFrame } = animatingShape;
      
      if (currentFrame >= frames.length) {
        setAnimatingShape(null);
        return;
      }

      const frame = frames[currentFrame];
      
      const canvas = animationCanvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        animationContext.save();
        animationContext.setTransform(1, 0, 0, 1, 0, 0);
        animationContext.clearRect(0, 0, canvas.width, canvas.height);
        animationContext.scale(dpr * zoomLevel, dpr * zoomLevel);
        animationContext.translate(panOffset.x, panOffset.y);

        if (frame.interpolatedPoints.length > 1) {
          animationContext.beginPath();
          
          const gradient = animationContext.createLinearGradient(
            frame.interpolatedPoints[0].x, frame.interpolatedPoints[0].y,
            frame.interpolatedPoints[frame.interpolatedPoints.length - 1].x, 
            frame.interpolatedPoints[frame.interpolatedPoints.length - 1].y
          );
          gradient.addColorStop(0, '#8B5CF6');
          gradient.addColorStop(0.5, '#A855F7');
          gradient.addColorStop(1, '#7C3AED');
          
          animationContext.strokeStyle = gradient;
          animationContext.lineWidth = 3 / zoomLevel;
          animationContext.lineCap = 'round';
          animationContext.lineJoin = 'round';
          animationContext.shadowBlur = 8;
          animationContext.shadowColor = '#8B5CF6';

          animationContext.moveTo(frame.interpolatedPoints[0].x, frame.interpolatedPoints[0].y);
          
          for (let i = 1; i < frame.interpolatedPoints.length - 2; i++) {
            const xc = (frame.interpolatedPoints[i].x + frame.interpolatedPoints[i + 1].x) / 2;
            const yc = (frame.interpolatedPoints[i].y + frame.interpolatedPoints[i + 1].y) / 2;
            animationContext.quadraticCurveTo(frame.interpolatedPoints[i].x, frame.interpolatedPoints[i].y, xc, yc);
          }
          
          if (frame.interpolatedPoints.length > 2) {
            const lastTwo = frame.interpolatedPoints.slice(-2);
            animationContext.quadraticCurveTo(lastTwo[0].x, lastTwo[0].y, lastTwo[1].x, lastTwo[1].y);
          }
          
          animationContext.stroke();
        }

        animationContext.restore();
      }

      setTimeout(() => {
        setAnimatingShape(prev => prev ? { ...prev, currentFrame: currentFrame + 1 } : null);
      }, 12);
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [animatingShape, animationContext, zoomLevel, panOffset]);

  // Keep all existing socket and canvas initialization code...
  // [Socket initialization and canvas setup remain exactly the same]

  useEffect(() => {
    if (!whiteboardId || !token) return;

    setConnectionState({ status: 'connecting' });

    const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/whiteboard`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionAttempts: 12,
      maxReconnectionDelay: 500,
    });

    socketRef.current = socket;

    socket.io.engine.on('error', (err: any) => {
      showToast('A network error occurred', 'error');
    });

    socket.io.engine.on('upgradeError', (err: any) => {
      showToast('WebSocket upgrade failed', 'error');
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      showToast("Connected to collaborative session", "success")
      setConnectionState({
        status: 'connected',
        lastConnected: new Date(),
        reconnectAttempts: 0
      });
      clearAllErrors();

      socket.emit('join_whiteboard', whiteboardId);

      measureLatency();
      const latencyInterval = setInterval(measureLatency, 30000);
      return () => clearInterval(latencyInterval);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected'
      }));

      if (reason === 'io server disconnect') {
        addError('Server disconnected the connection', 'SERVER_DISCONNECT');
      } else if (reason === 'transport close') {
        addError('Connection lost due to network issues', 'NETWORK_ERROR');
      }
      showToast("Disconnected from collaborative session", "error")
    });

    // Keep all other socket event handlers...
    socket.on('connect_error', (error: any) => {
      const msg = error.message?.toLowerCase();

      let displayMsg = 'Failed to connect to server';
      if (msg.includes('timeout')) displayMsg = 'Connection timed out';
      else if (msg.includes('websocket error')) displayMsg = 'Unable to establish WebSocket connection';
      else if (msg.includes('invalid credentials')) displayMsg = 'Authentication failed';

      showToast(displayMsg, 'error');
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        reconnectAttempts: (prev.reconnectAttempts || 0) + 1
      }));
      addError(`Connection failed: ${displayMsg}`, 'CONNECTION_ERROR');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setConnectionState(prev => ({
        ...prev,
        status: 'connected',
        lastConnected: new Date(),
        reconnectAttempts: attemptNumber
      }));
      socket.emit('join_whiteboard', whiteboardId);

      showToast("Reconnected to collaborative session", "success")
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
      setConnectionState(prev => ({
        ...prev,
        status: 'reconnecting',
        reconnectAttempts: attemptNumber
      }));
    });

    socket.on('reconnect_failed', () => {
      console.log('Reconnection failed');
      setConnectionState(prev => ({
        ...prev,
        status: 'error'
      }));
      addError('Failed to reconnect to server', 'RECONNECT_FAILED');
    });

    socket.on('pong', (timestamp: number) => {
      if (latencyCheckRef.current === timestamp) {
        const latency = Date.now() - timestamp;
        setConnectionState(prev => ({ ...prev, latency }));
      }
    });

    socket.on('initial_state', (data: { elements: WhiteboardElement[], stickyNotes: StickyNote[] }) => {
      console.log('Received initial state:', data);
      setElements(data.elements || []);
      setStickyNotes(data.stickyNotes || []);
      elementsRef.current = data.elements || [];
    });

    socket.on('user_presence', (presence: UserPresence) => {
      console.log('User presence update:', presence);
      if (presence.joined) {
        showToast(`${presence.username} has joined whiteboard.`, "success")
      } else {
        showToast(`${presence.username} has left whiteboard.`, "success")
      }

      setConnectedUsers(prev => {
        if (presence.joined) {
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
          const userColor = colors[Math.floor(Math.random() * colors.length)];
          return [...prev.filter(u => u.email !== presence.email), { ...presence, color: userColor }];
        } else {
          return prev.filter(u => u.email !== presence.email);
        }
      });
    });

    socket.on('activity_update', (activity: ActivityUpdate) => {
      console.log('Activity update:', activity);
      setRecentActivity(prev => [activity, ...prev.slice(0, 49)]);
    });

    // Drawing event handlers
    socket.on('drawStart', (element: WhiteboardElement) => {
      console.log('Received drawStart:', element);
      setElements(prev => {
        const newElements = [...prev, element];
        elementsRef.current = newElements;
        return newElements;
      });
    });

    socket.on('drawUpdate', (element: WhiteboardElement) => {
      console.log('Received drawUpdate:', element);
      setElements(prev => {
        const newElements = prev.map(el => el.id === element.id ? element : el);
        elementsRef.current = newElements;
        return newElements;
      });
    });

    socket.on('drawEnd', (element: WhiteboardElement) => {
      console.log('Received drawEnd:', element);
      setElements(prev => {
        const filtered = prev.filter(el => el.id !== element.id);
        const newElements = [...filtered, element];
        elementsRef.current = newElements;
        return newElements;
      });
    });

    socket.on('shapeRecognized', (element: WhiteboardElement) => {
      console.log('Received shapeRecognized:', element);
      setElements(prev => {
        const newElements = prev.map(el => el.id === element.id ? element : el);
        elementsRef.current = newElements;
        return newElements;
      });
    });

    socket.on('stickyNoteCreate', (stickyNote: StickyNote) => {
      console.log('Received stickyNoteCreate:', stickyNote);
      setStickyNotes(prev => [...prev.filter(note => note.id !== stickyNote.id), stickyNote]);
    });

    socket.on('stickyNoteUpdate', (stickyNote: Partial<StickyNote>) => {
      console.log('Received stickyNoteUpdate:', stickyNote);
      setStickyNotes(prev =>
        prev.map(note => note.id === stickyNote.id ? { ...note, ...stickyNote } as StickyNote : note)
      );
    });

    socket.on('stickyNoteDelete', (id: string) => {
      console.log('Received stickyNoteDelete:', id);
      setStickyNotes(prev => prev.filter(note => note.id !== id));
    });

    socket.on('textCreate', (element: WhiteboardElement) => {
      console.log('Received textCreate:', element);
      setElements(prev => {
        const newElements = [...prev, element];
        elementsRef.current = newElements;
        return newElements;
      });
    });

    socket.on('textUpdate', (element: Partial<WhiteboardElement>) => {
      console.log('Received textUpdate:', element);
      setElements(prev => {
        const newElements = prev.map(el => el.id === element.id ? { ...el, ...element } : el);
        elementsRef.current = newElements;
        return newElements;
      });
    });

    socket.on('shapeUpdate', (element: Partial<WhiteboardElement>) => {
      console.log('Received shapeUpdate:', element);
      setElements(prev => {
        const newElements = prev.map(el => el.id === element.id ? { ...el, ...element } : el);
        elementsRef.current = newElements;
        return newElements;
      });
    });

    socket.on('cursorMove', (cursor: CursorPosition) => {
      setCursors(prev => {
        const filtered = prev.filter(c => c.socketId !== cursor.socketId);
        return [...filtered, cursor];
      });

      setTimeout(() => {
        setCursors(prev => prev.filter(c => c.socketId !== cursor.socketId));
      }, 3000);
    });

    socket.on('error_user_not_found', (error: { message: string; code?: string }) => {
      // Handle errors as needed
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setConnectionState({ status: 'disconnected' });
      setConnectedUsers([]);
      setRecentActivity([]);
      setCursors([]);
    };
  }, [whiteboardId, token, addError, clearAllErrors, measureLatency, showToast]);

  const emitCursorMove = useCallback(
    throttle((x: number, y: number) => {
      emit('cursorMove', { x, y });
    }, 100),
    [emit]
  );

  const uniqueStickyNotes = React.useMemo(() => {
    return ensureUniqueIds(stickyNotes || []);
  }, [stickyNotes]);

  const uniqueElements = React.useMemo(() => {
    return ensureUniqueIds(elements || []);
  }, [elements]);

  const drawElement = useCallback(
    (element: WhiteboardElement) => {
      if (
        !contentContext ||
        !element ||
        element.type === "stickyNote" ||
        element.type === "text"
      )
        return;

      if (
        element.type === "path" &&
        (element as PathElement).points?.length > 1
      ) {
        const path = element as PathElement;
        contentContext.beginPath();
        contentContext.strokeStyle = path.color;
        contentContext.lineWidth = path.width / zoomLevel;
        contentContext.lineCap = 'round';
        contentContext.lineJoin = 'round';

        if (path.tool === "eraser") {
          contentContext.globalCompositeOperation = "destination-out";
        } else if (path.tool === "highlighter") {
          contentContext.globalCompositeOperation = "multiply";
          contentContext.globalAlpha = 0.5;
        } else {
          contentContext.globalCompositeOperation = "source-over";
          contentContext.globalAlpha = 1.0;
        }

        if (path.points.length > 2) {
          contentContext.moveTo(path.points[0].x, path.points[0].y);
          
          for (let i = 1; i < path.points.length - 2; i++) {
            const xc = (path.points[i].x + path.points[i + 1].x) / 2;
            const yc = (path.points[i].y + path.points[i + 1].y) / 2;
            contentContext.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc);
          }
          
          const lastTwo = path.points.slice(-2);
          if (lastTwo.length === 2) {
            contentContext.quadraticCurveTo(lastTwo[0].x, lastTwo[0].y, lastTwo[1].x, lastTwo[1].y);
          }
        } else {
          contentContext.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            contentContext.lineTo(path.points[i].x, path.points[i].y);
          }
        }
        
        contentContext.stroke();
        contentContext.globalCompositeOperation = "source-over";
        contentContext.globalAlpha = 1.0;
      }

      else if (element.type !== "path") {
        const shape = element as ShapeElement;
        contentContext.beginPath();
        contentContext.strokeStyle = shape.color;
        contentContext.lineWidth = shape.lineWidth / zoomLevel;
        contentContext.fillStyle = "transparent";
        contentContext.lineCap = 'round';
        contentContext.lineJoin = 'round';

        const x = shape.x;
        const y = shape.y;
        const width = shape.width;
        const height = shape.height;

        const cx = x + width / 2;
        const cy = y + height / 2;

        switch (shape.type) {
          case "rectangle":
            contentContext.rect(x, y, width, height);
            break;

          case "circle":
            const radiusX = Math.abs(width / 2);
            const radiusY = Math.abs(height / 2);
            contentContext.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
            break;

          case "line":
            contentContext.moveTo(x, y);
            contentContext.lineTo(x + width, y + height);
            break;

          case "triangle":
            contentContext.moveTo(cx, y);
            contentContext.lineTo(x, y + height);
            contentContext.lineTo(x + width, y + height);
            contentContext.closePath();
            break;

          case "diamond":
            contentContext.moveTo(cx, y);
            contentContext.lineTo(x + width, cy);
            contentContext.lineTo(cx, y + height);
            contentContext.lineTo(x, cy);
            contentContext.closePath();
            break;

          case "ellipse":
            const ellipseRadiusX = Math.abs(width / 2);
            const ellipseRadiusY = Math.abs(height / 2);
            contentContext.ellipse(cx, cy, ellipseRadiusX, ellipseRadiusY, 0, 0, Math.PI * 2);
            break;

          case "arrow":
            const arrowLength = Math.abs(width);
            const arrowHeight = Math.abs(height) * 0.3;
            contentContext.moveTo(x, cy);
            contentContext.lineTo(x + arrowLength * 0.7, cy);
            contentContext.lineTo(x + arrowLength * 0.7, cy - arrowHeight);
            contentContext.lineTo(x + arrowLength, cy);
            contentContext.lineTo(x + arrowLength * 0.7, cy + arrowHeight);
            contentContext.lineTo(x + arrowLength * 0.7, cy);
            break;

          case "star":
            const starRadius = Math.min(Math.abs(width), Math.abs(height)) / 2 * 0.9;
            const innerRadius = starRadius * 0.4;
            const spikes = 5;
            const step = Math.PI / spikes;
            
            let rot = Math.PI / 2 * 3;
            let startX = cx + Math.cos(rot) * starRadius;
            let startY = cy + Math.sin(rot) * starRadius;
            contentContext.moveTo(startX, startY);
            
            for (let i = 0; i < spikes; i++) {
              const outerX = cx + Math.cos(rot) * starRadius;
              const outerY = cy + Math.sin(rot) * starRadius;
              contentContext.lineTo(outerX, outerY);
              rot += step;
              
              const innerX = cx + Math.cos(rot) * innerRadius;
              const innerY = cy + Math.sin(rot) * innerRadius;
              contentContext.lineTo(innerX, innerY);
              rot += step;
            }
            contentContext.lineTo(startX, startY);
            contentContext.closePath();
            break;
        }

        contentContext.stroke();
      }
    },
    [contentContext, zoomLevel]
  );

  const drawGrid = useCallback(() => {
    if (!gridContext || !gridCanvasRef.current) return;

    const canvas = gridCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    gridContext.save();
    gridContext.setTransform(1, 0, 0, 1, 0, 0);
    gridContext.clearRect(0, 0, canvas.width, canvas.height);
    gridContext.scale(dpr * zoomLevel, dpr * zoomLevel);
    gridContext.translate(panOffset.x, panOffset.y);

    const canvasWidth = canvas.width / (dpr * zoomLevel);
    const canvasHeight = canvas.height / (dpr * zoomLevel);
    const gridSize = 30;

    gridContext.strokeStyle = "#80008030";
    gridContext.lineWidth = 0.5 / zoomLevel;

    const startX = Math.floor(-panOffset.x / gridSize) * gridSize;
    const startY = Math.floor(-panOffset.y / gridSize) * gridSize;
    const endX = startX + canvasWidth + gridSize;
    const endY = startY + canvasHeight + gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      gridContext.beginPath();
      gridContext.moveTo(x, startY);
      gridContext.lineTo(x, endY);
      gridContext.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      gridContext.beginPath();
      gridContext.moveTo(startX, y);
      gridContext.lineTo(endX, y);
      gridContext.stroke();
    }

    gridContext.restore();
  }, [gridContext, zoomLevel, panOffset]);

  const redrawContentCanvas = useCallback(() => {
    if (!contentContext || !contentCanvasRef.current) return;

    const canvas = contentCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    contentContext.save();
    contentContext.setTransform(1, 0, 0, 1, 0, 0);
    contentContext.clearRect(0, 0, canvas.width, canvas.height);
    contentContext.scale(dpr * zoomLevel, dpr * zoomLevel);
    contentContext.translate(panOffset.x, panOffset.y);

    elementsRef.current.forEach(drawElement);
    if (currentElement) drawElement(currentElement);

    contentContext.restore();
  }, [contentContext, drawElement, currentElement, zoomLevel, panOffset]);

  const saveWhiteboard = useCallback(async () => {
    const id = params.id;
    try {
      const mappedStickyNotes = uniqueStickyNotes.map((note) => ({
        id: note.id,
        content: note.text,
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
        color: note.color,
      }));

      const mappedElements = elementsRef.current.map((el) => {
        const base = {
          id: el.id,
          color:
            el.type === "text"
              ? (el as TextElement).color
              : (el as PathElement | ShapeElement).color,
        };
        if (el.type === "path") {
          const path = el as PathElement;
          return {
            ...base,
            type: path.tool,
            points: path.points,
            lineWidth: path.width,
          };
        } else if (el.type === "text") {
          const text = el as TextElement;
          return {
            ...base,
            type: "text",
            x: text.x,
            y: text.y,
            text: text.text,
            fontSize: textFontSize,
            fontFamily: textStyles.fontFamily,
            bold: textStyles.bold,
            italic: textStyles.italic,
            underline: textStyles.underline,
          };
        } else {
          const shape = el as ShapeElement;
          return {
            ...base,
            type: "shape",
            shapeType: shape.type,
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
            lineWidth: shape.lineWidth,
          };
        }
      });

      const response = await fetch(`/api/whiteboard/saveWhiteboard/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          whiteboardId: id,
          elements: mappedElements,
          stickyNotes: mappedStickyNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to save whiteboard");
      const data = await response.json();

      showToast(data.message, "success")
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      showToast("Failed to save whiteboard", "error")
    }
  }, [params.id, uniqueStickyNotes, textFontSize, textStyles, showToast]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !editingTextId && !editingNoteId) {
        e.preventDefault();
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanning(false);
        setPanStart(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingTextId, editingNoteId]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!gridCanvasRef.current || !contentCanvasRef.current || !animationCanvasRef.current) return;

    const gridCanvas = gridCanvasRef.current;
    const contentCanvas = contentCanvasRef.current;
    const animationCanvas = animationCanvasRef.current;
    const gridCtx = gridCanvas.getContext("2d");
    const contentCtx = contentCanvas.getContext("2d");
    const animationCtx = animationCanvas.getContext("2d");

    if (gridCtx && contentCtx && animationCtx) {
      gridCtx.lineCap = "round";
      gridCtx.lineJoin = "round";
      contentCtx.lineCap = "round";
      contentCtx.lineJoin = "round";
      contentCtx.strokeStyle = strokeColor;
      contentCtx.lineWidth = lineWidth;
      animationCtx.lineCap = "round";
      animationCtx.lineJoin = "round";
      setGridContext(gridCtx);
      setContentContext(contentCtx);
      setAnimationContext(animationCtx);
    }
  }, [strokeColor, lineWidth]);

  useEffect(() => {
    if (
      !gridCanvasRef.current ||
      !contentCanvasRef.current ||
      !animationCanvasRef.current ||
      !gridContext ||
      !contentContext
    )
      return;

    const gridCanvas = gridCanvasRef.current;
    const contentCanvas = contentCanvasRef.current;
    const animationCanvas = animationCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    [gridCanvas, contentCanvas, animationCanvas].forEach(canvas => {
      canvas.width = canvasDimensions.width * dpr;
      canvas.height = canvasDimensions.height * dpr;
      canvas.style.width = `${canvasDimensions.width}px`;
      canvas.style.height = `${canvasDimensions.height}px`;
    });

    drawGrid();
    redrawContentCanvas();
  }, [canvasDimensions, zoomLevel, panOffset, gridContext, contentContext, drawGrid, redrawContentCanvas]);

  const { theme } = useTheme();
  const [currentColor, setColor] = useState("#000000");

  useEffect(() => {
    setColor(theme === "dark" ? "#FFFFFF" : "#000000");
  }, [theme]);

  useEffect(() => {
    if (
      history.length > 0 &&
      historyIndex >= 0 &&
      historyIndex < history.length
    ) {
      const { elements = [], stickyNotes = [] } = history[historyIndex] || {};
      elementsRef.current = Array.isArray(elements) ? elements : [];
      setElements(elementsRef.current);
      setStickyNotes(Array.isArray(stickyNotes) ? stickyNotes : []);
    } else {
      elementsRef.current = [];
      setElements([]);
      setStickyNotes([]);
    }
  }, [history, historyIndex, setStickyNotes]);

  useEffect(() => {
    redrawContentCanvas();
  }, [elements, redrawContentCanvas]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!contentCanvasRef.current) return { x: 0, y: 0 };
    const rect = contentCanvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x * zoomLevel) / zoomLevel,
      y: (clientY - rect.top - panOffset.y * zoomLevel) / zoomLevel,
    };
  };

  const getScreenCoordinates = (clientX: number, clientY: number) => {
    if (!contentCanvasRef.current) return { x: 0, y: 0 };
    const rect = contentCanvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const showColorPicker = (noteId: string, x: number, y: number) => {
    setColorPicker({ noteId, x, y });
  };

  const handleColorSelect = (
    noteId: string,
    bgColor: string,
    textColor: string
  ) => {
    setStickyNotes((prev) => {
      const newNotes = prev
        .map((note) =>
          note.id === noteId ? { ...note, bgColor, textColor } : note
        )
        .filter((note) => isValidId(note.id));
      debouncedSaveToHistory(elementsRef.current, newNotes);

      const updatedNote = newNotes.find(note => note.id === noteId);
      if (updatedNote) {
        emit('stickyNoteUpdate', updatedNote);
      }

      return newNotes;
    });
    setColorPicker(null);
  };

  const isOverStickyNote = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): string | null => {
    const { x: screenX, y: screenY } = getScreenCoordinates(
      e.clientX,
      e.clientY
    );

    for (const note of uniqueStickyNotes) {
      if (!isValidId(note.id)) continue;
      const noteX = note.x * zoomLevel + panOffset.x;
      const noteY = note.y * zoomLevel + panOffset.y;
      const noteWidth = note.width * zoomLevel;
      const noteHeight = note.height * zoomLevel;

      if (
        screenX >= noteX &&
        screenX <= noteX + noteWidth &&
        screenY >= noteY &&
        screenY <= noteY + noteHeight
      ) {
        return note.id;
      }
    }
    return null;
  };

  const isOverTextElement = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): string | null => {
    const { x: screenX, y: screenY } = getScreenCoordinates(
      e.clientX,
      e.clientY
    );

    for (const element of elementsRef.current) {
      if (element.type === "text") {
        const textElement = element as TextElement;
        const adjustedX = textElement.x * zoomLevel + panOffset.x;
        const adjustedY = textElement.y * zoomLevel + panOffset.y;
        const textWidth =
          (textElement.text.length || 10) * (textFontSize * zoomLevel * 0.6);
        const textHeight = textFontSize * zoomLevel * 1.2;

        if (
          screenX >= adjustedX &&
          screenX <= adjustedX + textWidth &&
          screenY >= adjustedY - textHeight &&
          screenY <= adjustedY
        ) {
          return textElement.id;
        }
      }
    }
    return null;
  };

  const isOverShapeElement = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): string | null => {
    const { x: screenX, y: screenY } = getScreenCoordinates(
      e.clientX,
      e.clientY
    );

    for (const element of elementsRef.current) {
      if (element.type !== "text" && element.type !== "path" && "width" in element) {
        const shapeElement = element as ShapeElement;
        const adjustedX = shapeElement.x * zoomLevel + panOffset.x;
        const adjustedY = shapeElement.y * zoomLevel + panOffset.y;
        const adjustedWidth = Math.abs(shapeElement.width * zoomLevel);
        const adjustedHeight = Math.abs(shapeElement.height * zoomLevel);

        if (
          screenX >= adjustedX &&
          screenX <= adjustedX + adjustedWidth &&
          screenY >= adjustedY &&
          screenY <= adjustedY + adjustedHeight
        ) {
          return shapeElement.id;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contentContext || colorPicker) return;
    if (
      isDraggingNote ||
      isResizingNote ||
      isDraggingText ||
      editingTextId ||
      editingNoteId ||
      isDraggingShape ||
      isResizingShape
    )
      return;

    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );

    emitCursorMove(canvasX, canvasY);

    if (isPanning) {
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const clickedNoteId = isOverStickyNote(e);
    if (clickedNoteId) {
      if (activeNoteId !== clickedNoteId) setActiveNoteId(clickedNoteId);
      return;
    } else {
      setActiveNoteId(null);
      if (editingNoteId !== null) setEditingNoteId(null);
    }

    const clickedTextId = isOverTextElement(e);
    if (clickedTextId) {
      setActiveTextId(clickedTextId);
      const textElement = elementsRef.current.find(
        (el) => el.id === clickedTextId && el.type === "text"
      ) as TextElement;
      if (textElement) {
        tempTextState.current = { ...textElement };
        setDragOffset({
          x: canvasX - textElement.x,
          y: canvasY - textElement.y,
        });
        setIsDraggingText(true);
      }
      return;
    } else {
      setActiveTextId(null);
    }

    const clickedShapeId = isOverShapeElement(e);
    if (clickedShapeId) {
      setActiveShapeId(clickedShapeId);
      const shapeElement = elementsRef.current.find(
        (el) => el.id === clickedShapeId && el.type !== "text" && el.type !== "path" && "width" in el
      ) as ShapeElement;
      if (shapeElement) {
        tempShapeState.current = { ...shapeElement };
        setDragOffset({
          x: canvasX - shapeElement.x,
          y: canvasY - shapeElement.y,
        });
        setIsDraggingShape(true);
      }
      return;
    } else {
      setActiveShapeId(null);
    }

    if (tool === "stickyNote") {
      e.stopPropagation();
      const id = generateUniqueId();
      const randomColor =
        stickyNoteColors[Math.floor(Math.random() * stickyNoteColors.length)];
      const noteWidth = 200;
      const noteHeight = 200;

      let adjustedX = canvasX;
      let adjustedY = canvasY;
      const canvasWidth = canvasDimensions.width / zoomLevel;
      const canvasHeight = canvasDimensions.height / zoomLevel;

      adjustedX = Math.max(0, Math.min(adjustedX, canvasWidth - noteWidth));
      adjustedY = Math.max(0, Math.min(adjustedY, canvasHeight - noteHeight));

      const newNote: StickyNote = {
        id,
        type: "stickyNote",
        x: adjustedX,
        y: adjustedY,
        width: noteWidth,
        height: noteHeight,
        text: "",
        textColor: "#000000",
        bgColor: randomColor,
      };

      setStickyNotes((prev) => {
        const newNotes = [
          ...prev.filter((note) => isValidId(note.id)),
          newNote,
        ];
        debouncedSaveToHistory(elementsRef.current, newNotes);
        return newNotes;
      });

      emit('stickyNoteCreate', newNote);

      setActiveNoteId(newNote.id);
      setEditingNoteId(newNote.id);
      return;
    }

    if (tool === "text") {
      e.stopPropagation();
      e.preventDefault();
      const newTextId = generateUniqueId();
      newTextIdRef.current = newTextId;

      const newElement: TextElement = {
        id: newTextId,
        type: "text",
        x: canvasX,
        y: canvasY,
        text: "",
        color: strokeColor,
        fontSize: textFontSize,
      };

      elementsRef.current = [...elementsRef.current, newElement];
      setElements(elementsRef.current);
      debouncedSaveToHistory(elementsRef.current, stickyNotes);

      emit('textCreate', newElement);

      setEditingTextId(newTextId);
      setActiveTextId(newTextId);

      setTimeout(() => {
        const textarea = document.querySelector(
          `[data-text-id="${newTextId}"] textarea`
        ) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }, 0);
      return;
    }

    if (tool === "pen" || tool === "eraser" || tool === "highlighter") {
      setIsDrawing(true);
      const newElement: PathElement = {
        id: generateUniqueId(),
        type: "path",
        points: [{ x: canvasX, y: canvasY }],
        color: tool === "eraser" ? "#FFFFFF" : strokeColor,
        width: tool === "highlighter" ? lineWidth * 2 : lineWidth,
        tool,
      };
      setCurrentElement(newElement);

      emit('drawStart', newElement);
    } else if (tool === "shape" && shapeType) {
      setIsDrawing(true);
      setStartPoint({ x: canvasX, y: canvasY });
      const newElement: ShapeElement = {
        id: generateUniqueId(),
        type: shapeType,
        x: canvasX,
        y: canvasY,
        width: 0,
        height: 0,
        color: strokeColor,
        lineWidth,
        isFixed: shapeType.includes("line") || shapeType.includes("arrow"),
      };
      setCurrentElement(newElement);
    }
  };

  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!contentContext || !contentCanvasRef.current) return;

      const { x: canvasX, y: canvasY } = getCanvasCoordinates(
        e.clientX,
        e.clientY
      );

      emitCursorMove(canvasX, canvasY);

      if (isPanning && panStart) {
        const dx = (e.clientX - panStart.x) / zoomLevel;
        const dy = (e.clientY - panStart.y) / zoomLevel;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
        drawGrid();
        redrawContentCanvas();
        return;
      }

      if (isDraggingNote && activeNoteId && tempNoteState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(
          0,
          Math.min(newX, canvasWidth - tempNoteState.current.width)
        );
        const clampedY = Math.max(
          0,
          Math.min(newY, canvasHeight - tempNoteState.current.height)
        );

        tempNoteState.current = {
          ...tempNoteState.current,
          x: clampedX,
          y: clampedY,
        };

        setStickyNotes((prev) =>
          prev
            .map((note) =>
              note.id === activeNoteId ? { ...tempNoteState.current! } : note
            )
            .filter((note) => isValidId(note.id))
        );
        return;
      }

      if (isResizingNote && activeNoteId && tempNoteState.current && resizeDirection) {
        const note = tempNoteState.current;
        const minSize = 50;
        let newWidth = note.width;
        let newHeight = note.height;
        let newX = note.x;
        let newY = note.y;

        const deltaX = canvasX - (note.x + (resizeDirection.includes('e') ? note.width : 0));
        const deltaY = canvasY - (note.y + (resizeDirection.includes('s') ? note.height : 0));

        switch (resizeDirection) {
          case 'se':
            newWidth = Math.max(minSize, note.width + deltaX);
            newHeight = Math.max(minSize, note.height + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(minSize, note.width - deltaX);
            newHeight = Math.max(minSize, note.height + deltaY);
            newX = note.x + note.width - newWidth;
            break;
          case 'ne':
            newWidth = Math.max(minSize, note.width + deltaX);
            newHeight = Math.max(minSize, note.height - deltaY);
            newY = note.y + note.height - newHeight;
            break;
          case 'nw':
            newWidth = Math.max(minSize, note.width - deltaX);
            newHeight = Math.max(minSize, note.height - deltaY);
            newX = note.x + note.width - newWidth;
            newY = note.y + note.height - newHeight;
            break;
        }

        tempNoteState.current = {
          ...tempNoteState.current,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };

        setStickyNotes((prev) =>
          prev.map((n) =>
            n.id === activeNoteId ? { ...tempNoteState.current! } : n
          )
        );
        return;
      }

      if (isDraggingText && activeTextId && tempTextState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(0, Math.min(newX, canvasWidth));
        const clampedY = Math.max(0, Math.min(newY, canvasHeight));

        tempTextState.current = {
          ...tempTextState.current,
          x: clampedX,
          y: clampedY,
        };

        elementsRef.current = elementsRef.current.map((el) =>
          el.id === activeTextId && el.type === "text"
            ? tempTextState.current!
            : el
        );
        setElements(elementsRef.current);
        return;
      }

      if (isDraggingShape && activeShapeId && tempShapeState.current) {
        const canvasWidth = canvasDimensions.width / zoomLevel;
        const canvasHeight = canvasDimensions.height / zoomLevel;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        const clampedX = Math.max(0, Math.min(newX, canvasWidth - tempShapeState.current.width));
        const clampedY = Math.max(0, Math.min(newY, canvasHeight - tempShapeState.current.height));

        tempShapeState.current = {
          ...tempShapeState.current,
          x: clampedX,
          y: clampedY,
        };

        elementsRef.current = elementsRef.current.map((el) =>
          el.id === activeShapeId && el.type !== "text" && el.type !== "path" && "width" in el
            ? tempShapeState.current!
            : el
        );
        setElements(elementsRef.current);
        return;
      }

      if (isResizingShape && activeShapeId && tempShapeState.current && resizeDirection) {
        const shape = tempShapeState.current;
        const minSize = 10;
        let newWidth = shape.width;
        let newHeight = shape.height;
        let newX = shape.x;
        let newY = shape.y;

        const deltaX = canvasX - (shape.x + (resizeDirection.includes('e') ? shape.width : 0));
        const deltaY = canvasY - (shape.y + (resizeDirection.includes('s') ? shape.height : 0));

        switch (resizeDirection) {
          case 'se':
            newWidth = Math.max(minSize, shape.width + deltaX);
            newHeight = Math.max(minSize, shape.height + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(minSize, shape.width - deltaX);
            newHeight = Math.max(minSize, shape.height + deltaY);
            newX = shape.x + shape.width - newWidth;
            break;
          case 'ne':
            newWidth = Math.max(minSize, shape.width + deltaX);
            newHeight = Math.max(minSize, shape.height - deltaY);
            newY = shape.y + shape.height - newHeight;
            break;
          case 'nw':
            newWidth = Math.max(minSize, shape.width - deltaX);
            newHeight = Math.max(minSize, shape.height - deltaY);
            newX = shape.x + shape.width - newWidth;
            newY = shape.y + shape.height - newHeight;
            break;
        }

        tempShapeState.current = {
          ...tempShapeState.current,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };

        elementsRef.current = elementsRef.current.map((el) =>
          el.id === activeShapeId && el.type !== "text" && el.type !== "path" && "width" in el
            ? tempShapeState.current!
            : el
        );
        setElements(elementsRef.current);
        return;
      }

      if (!isDrawing || !currentElement) return;

      if ("points" in currentElement) {
        const updatedElement = {
          ...currentElement,
          points: [...currentElement.points, { x: canvasX, y: canvasY }],
        };
        setCurrentElement(updatedElement);

        emit('drawUpdate', updatedElement);
      } else if (startPoint && "width" in currentElement) {
        const updatedElement = {
          ...currentElement,
          width: canvasX - startPoint.x,
          height: canvasY - startPoint.y,
        };
        setCurrentElement(updatedElement);
      }

      redrawContentCanvas();
    }, 4),
    [
      contentContext,
      isPanning,
      panStart,
      isDraggingNote,
      isDraggingText,
      isDraggingShape,
      isResizingNote,
      isResizingShape,
      activeNoteId,
      activeTextId,
      activeShapeId,
      dragOffset,
      resizeDirection,
      isDrawing,
      currentElement,
      startPoint,
      zoomLevel,
      panOffset,
      redrawContentCanvas,
      canvasDimensions,
      drawGrid,
      emitCursorMove,
      emit,
    ]
  );

  const handleMouseUp = () => {
    if (isPanning) {
      setPanStart(null);
      return;
    }

    if (isDraggingNote || isResizingNote) {
      if (tempNoteState.current && activeNoteId) {
        const updatedNote = { ...tempNoteState.current };
        setStickyNotes((prev) => {
          const newNotes = prev
            .map((note) => (note.id === activeNoteId ? updatedNote : note))
            .filter((note) => isValidId(note.id));
          debouncedSaveToHistory(elementsRef.current, newNotes);
          return newNotes;
        });

        emit('stickyNoteUpdate', updatedNote);
      }
      setIsDraggingNote(false);
      setIsResizingNote(false);
      setResizeDirection(null);
      tempNoteState.current = null;
      return;
    }

    if (isDraggingText && activeTextId && tempTextState.current) {
      const updatedText = { ...tempTextState.current };
      elementsRef.current = elementsRef.current.map((el) =>
        el.id === activeTextId && el.type === "text" ? updatedText : el
      );
      setElements(elementsRef.current);
      debouncedSaveToHistory(elementsRef.current, stickyNotes);

      emit('textUpdate', updatedText);

      setIsDraggingText(false);
      tempTextState.current = null;
      return;
    }

    if (isDraggingShape || isResizingShape) {
      if (tempShapeState.current && activeShapeId) {
        const updatedShape = { ...tempShapeState.current };
        elementsRef.current = elementsRef.current.map((el) =>
          el.id === activeShapeId && el.type !== "text" && el.type !== "path" && "width" in el
            ? updatedShape
            : el
        );
        setElements(elementsRef.current);
        debouncedSaveToHistory(elementsRef.current, stickyNotes);

        emit('shapeUpdate', updatedShape);
      }
      setIsDraggingShape(false);
      setIsResizingShape(false);
      setResizeDirection(null);
      tempShapeState.current = null;
      return;
    }

    if (!isDrawing || !currentElement) return;

    setIsDrawing(false);
    setStartPoint(null);

    if ("points" in currentElement && currentElement.points.length > 1) {
      elementsRef.current = [...elementsRef.current, currentElement];
      setElements(elementsRef.current);
      debouncedSaveToHistory(elementsRef.current, stickyNotes);

      emit('drawEnd', currentElement);

      if (currentElement.tool === 'pen' && 
          shapeRecognitionEnabled && 
          currentElement.points.length >= 4) {
        handleShapeRecognition(currentElement.id, currentElement.points);
      }
    } else if ("width" in currentElement) {
      const shape = currentElement as ShapeElement;
      if (Math.abs(shape.width) > 3 || Math.abs(shape.height) > 3) {
        const fixedShape = {
          ...shape,
          x: shape.width < 0 ? shape.x + shape.width : shape.x,
          y: shape.height < 0 ? shape.y + shape.height : shape.y,
          width: Math.abs(shape.width),
          height: Math.abs(shape.height),
        };
        elementsRef.current = [...elementsRef.current, fixedShape];
        setElements(elementsRef.current);
        debouncedSaveToHistory(elementsRef.current, stickyNotes);

        emit('drawEnd', fixedShape);
      }
    }

    setCurrentElement(null);
    redrawContentCanvas();
  };

  // Keep all existing event handlers (sticky notes, text, shapes, etc.)...
  // [All event handlers remain exactly the same]

  const handleStickyNoteMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(noteId)) return;

    setActiveNoteId(noteId);
    const note = uniqueStickyNotes.find((n) => n.id === noteId);
    if (!note) return;

    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );
    setDragOffset({ x: canvasX - note.x, y: canvasY - note.y });
    tempNoteState.current = { ...note };
    setIsDraggingNote(true);

    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const handleResizeStart = (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string,
    direction: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isValidId(noteId)) return;

    setActiveNoteId(noteId);
    setIsResizingNote(true);
    setResizeDirection(direction);
    const note = uniqueStickyNotes.find((n) => n.id === noteId);
    if (!note) return;

    tempNoteState.current = { ...note };
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const handleStickyNoteDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(noteId)) return;

    setEditingNoteId(noteId);
    setTimeout(() => {
      const textarea = document.querySelector(
        `[data-note-id="${noteId}"] textarea`
      ) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 0);
  };

  const handleStickyNoteTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    noteId: string
  ) => {
    if (!isValidId(noteId)) return;

    setStickyNotes((prev) => {
      const newNotes = prev
        .map((note) =>
          note.id === noteId ? { ...note, text: e.target.value } : note
        )
        .filter((note) => isValidId(note.id));
      debouncedSaveToHistory(elementsRef.current, newNotes);

      const updatedNote = newNotes.find(note => note.id === noteId);
      if (updatedNote) {
        emit('stickyNoteUpdate', updatedNote);
      }

      return newNotes;
    });
  };

  const handleFinishEditing = () => {
    setEditingNoteId(null);
    debouncedSaveToHistory(elementsRef.current, stickyNotes);
  };

  const handleTextMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(textId) || editingTextId === textId) return;

    setActiveTextId(textId);
    const textElement = elementsRef.current.find(
      (el) => el.id === textId && el.type === "text"
    ) as TextElement;
    if (!textElement) return;

    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );
    setDragOffset({ x: canvasX - textElement.x, y: canvasY - textElement.y });
    tempTextState.current = { ...textElement };
    setIsDraggingText(true);
  };

  const handleTextDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    textId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(textId)) return;
    setEditingTextId(textId);
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    textId: string
  ) => {
    if (!isValidId(textId)) return;

    setElements((prev) => {
      const newElements = prev.map((el) =>
        el.id === textId && el.type === "text"
          ? { ...el, text: e.target.value }
          : el
      );
      elementsRef.current = newElements;
      debouncedSaveToHistory(newElements, stickyNotes);

      const updatedElement = newElements.find(el => el.id === textId);
      if (updatedElement) {
        emit('textUpdate', updatedElement);
      }

      return newElements;
    });
  };

  const handleFinishTextEditing = () => {
    setEditingTextId(null);
    setElements((prev) => {
      const newElements = prev.filter(
        (el) =>
          !(el.type === "text" && el.id === editingTextId && !el.text.trim())
      );
      elementsRef.current = newElements;
      debouncedSaveToHistory(newElements, stickyNotes);
      return newElements;
    });
  };

  const handleShapeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    shapeId: string
  ) => {
    e.stopPropagation();
    if (!isValidId(shapeId)) return;

    setActiveShapeId(shapeId);
    const shapeElement = elementsRef.current.find(
      (el) => el.id === shapeId && el.type !== "text" && el.type !== "path" && "width" in el
    ) as ShapeElement;
    if (!shapeElement) return;

    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
      e.clientX,
      e.clientY
    );
    setDragOffset({ x: canvasX - shapeElement.x, y: canvasY - shapeElement.y });
    tempShapeState.current = { ...shapeElement };
    setIsDraggingShape(true);
  };

  const handleDeleteShape = (shapeId: string) => {
    if (!isValidId(shapeId)) return;

    setElements((prev) => {
      const newElements = prev.filter((el) => el.id !== shapeId);
      elementsRef.current = newElements;
      debouncedSaveToHistory(newElements, stickyNotes);
      return newElements;
    });

    if (activeShapeId === shapeId) setActiveShapeId(null);
  };

  const handleShapeResizeStart = (
    e: React.MouseEvent<HTMLDivElement>,
    shapeId: string,
    direction: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isValidId(shapeId)) return;

    setActiveShapeId(shapeId);
    setIsResizingShape(true);
    setResizeDirection(direction);
    const shape = elementsRef.current.find(
      (el) => el.id === shapeId && el.type !== "text" && el.type !== "path" && "width" in el
    ) as ShapeElement;
    if (!shape) return;

    tempShapeState.current = { ...shape };
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 4.0));
  const handleZoomOut = () =>
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));

  const handleDeleteStickyNote = (noteId: string) => {
    if (!isValidId(noteId)) return;

    setStickyNotes((prev) => {
      const newNotes = prev.filter((note) => note.id !== noteId);
      debouncedSaveToHistory(elementsRef.current, newNotes);
      return newNotes;
    });

    emit('stickyNoteDelete', noteId);

    if (activeNoteId === noteId) setActiveNoteId(null);
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const exportAsPNG = () => {
    if (contentCanvasRef.current) {
      const link = document.createElement("a");
      link.download = `whiteboard_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = contentCanvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  const exportAsPDF = async () => {
    if (contentCanvasRef.current) {
      const canvas = await html2canvas(contentCanvasRef.current, {
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0);
      pdf.save(`whiteboard_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
  };

  // Enhanced toggleTool function with premium AI integration
  const toggleTool = (tool: string) => {
    setActiveTool(prev => (prev === tool ? null : tool));
    
    // Enhanced AI Assistant toggle with premium features
    if (tool === 'ai') {
      setShowAIAssistant(prev => !prev);
    }

    // New Enhanced Gemini AI Assistant
    if (tool === 'geminiAI') {
      setShowGeminiAssistant(prev => !prev);
      return;
    }
  };

  const handleShowTemplate = (currentTemplate: string) => {
    if (currentTemplate) {
      setcurrentTemplate(currentTemplate)
      setshowingTemplate(true)
    }
  }

  const handleCloseTemplate = () => {
    setshowingTemplate(false)
    setcurrentTemplate('');
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-gray-50 dark:bg-gray-500 overflow-hidden select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => setColorPicker(null)}
    >
      {/* Collaboration Panel */}
      <div className="className=absolute top-0 right-0">
        <CollaborationPanel
          connectionState={connectionState}
          connectedUsers={connectedUsers}
          recentActivity={recentActivity}
          errors={errors}
          currentUser={currentUser}
          onRetryConnection={retryConnection}
          onDismissError={clearError}
          onDismissAllErrors={clearAllErrors}
        />
      </div>

      {/* Canvas layers */}
      <canvas
        ref={gridCanvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="absolute top-0 left-0 touch-none"
      />

      <canvas
        ref={contentCanvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="absolute top-0 left-0 touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />

      <canvas
        ref={animationCanvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="absolute top-0 left-0 touch-none pointer-events-none z-30"
      />

      {/* Cursor Overlay */}
      <CursorOverlay
        cursors={cursors}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
      />

      {/* Sticky notes */}
      {uniqueStickyNotes.map((note) => (
        <StickyNoteComponent
          key={`sticky-note-${note.id}`}
          note={note}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          activeNoteId={activeNoteId}
          editingNoteId={editingNoteId}
          handleStickyNoteMouseDown={handleStickyNoteMouseDown}
          handleStickyNoteDoubleClick={handleStickyNoteDoubleClick}
          handleStickyNoteTextChange={handleStickyNoteTextChange}
          handleFinishEditing={handleFinishEditing}
          handleDeleteStickyNote={handleDeleteStickyNote}
          handleResizeStart={handleResizeStart}
          setStickyNotes={setStickyNotes}
          showColorPicker={showColorPicker}
          textStyles={textStyles}
          textFontSize={textFontSize}
        />
      ))}

      {/* Text elements */}
      {uniqueElements.map((element) =>
        element.type === "text" ? (
          <TextComponent
            key={`text-element-${element.id}`}
            textElement={element as TextElement}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            activeTextId={activeTextId}
            editingTextId={editingTextId}
            handleTextMouseDown={handleTextMouseDown}
            handleTextDoubleClick={handleTextDoubleClick}
            handleTextChange={handleTextChange}
            handleFinishTextEditing={handleFinishTextEditing}
            setElements={setElements}
            textStyles={textStyles}
            textFontSize={textFontSize}
          />
        ) : null
      )}

      {/* Shape elements */}
      {uniqueElements.map((element) =>
        element.type !== "text" && element.type !== "path" && "width" in element ? (
          <ShapeComponent
            key={`shape-element-${element.id}`}
            shape={element as ShapeElement}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            activeShapeId={activeShapeId}
            handleShapeMouseDown={handleShapeMouseDown}
            handleDeleteShape={handleDeleteShape}
            handleShapeResizeStart={handleShapeResizeStart}
          />
        ) : null
      )}

      {/* Color picker */}
      {colorPicker && (
        <div
          className="absolute z-50 flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-fadeIn"
          style={{ left: colorPicker.x, top: colorPicker.y }}
        >
          {colorPalette.map((color, index) => (
            <button
              key={`color-${index}`}
              className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 focus:outline-none transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: color.bg }}
              onClick={() =>
                handleColorSelect(colorPicker.noteId, color.bg, color.text)
              }
              title={`Background: ${color.bg}, Text: ${color.text}`}
            />
          ))}
        </div>
      )}

      {/* Enhanced Gemini AI Canvas Analyzer - replacing the old one */}
      {showGeminiAssistant && (
        <EnhancedGeminiAnalyzer
          canvasRef={contentCanvasRef}
          elements={uniqueElements}
          stickyNotes={uniqueStickyNotes}
          onClose={() => setShowGeminiAssistant(false)}
        />
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 z-40">
        <button
          className="w-10 h-10 flex items-center justify-center bg-purple-600 dark:bg-purple-700 rounded-full hover:bg-purple-500 dark:hover:bg-purple-600 transition-all duration-200 transform hover:scale-105"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 min-w-[50px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          className="w-10 h-10 flex items-center justify-center bg-purple-600 dark:bg-purple-700 rounded-full hover:bg-purple-500 dark:hover:bg-purple-600 transition-all duration-200 transform hover:scale-105"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      {/* Enhanced Toolbar with AI features */}
      <CanvasToolbar
        exportAsPNG={exportAsPNG}
        exportAsPDF={exportAsPDF}
        onToolSelect={toggleTool}
        shapeRecognitionEnabled={shapeRecognitionEnabled}
        isShapeProcessing={isShapeProcessing}
        toggleShapeRecognition={toggleShapeRecognition}
      />
      <NavBar
        saveWhiteboard={saveWhiteboard}
        exportAsPNG={exportAsPNG}
        exportAsPDF={exportAsPDF}
      />

      {/* Keep all existing template and video call components */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <Videocall
            showLobby={activeTool === "videoCall"}
            users={connectedUsers}
            roomId={
              typeof whiteboardId === "string"
                ? whiteboardId
                : Array.isArray(whiteboardId)
                  ? whiteboardId[0]
                  : "default-room-id"
            }
          />
        </div>
      </div>

      {activeTool === "templates" && !showingTemplate && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="handle w-[90vw] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 cursor-move relative">
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">Choose a Template</h2>

            <button
              onClick={() => toggleTool('templates')}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 px-2 rounded-full hover:bg-red-400"
              title="Close Template Menu"
            >
              ✕
            </button>

            <ul className="flex flex-col gap-4">
              <li
                id="kanban"
                onClick={() => handleShowTemplate('kanban')}
                className="bg-gray-100 hover:bg-purple-100 transition-colors duration-200 px-4 py-3 rounded-lg cursor-pointer text-gray-800 text-sm font-medium shadow group"
              >
                <div className="font-semibold flex items-center gap-2">🗂️ Kanban Board</div>
                <p className="text-xs mt-1 text-gray-600 group-hover:text-purple-700">
                  Track tasks. Stay in flow.
                </p>
              </li>

              <li
                id="mindmap"
                onClick={() => handleShowTemplate('mindmap')}
                className="bg-gray-100 hover:bg-purple-100 transition-colors duration-200 px-4 py-3 rounded-lg cursor-pointer text-gray-800 text-sm font-medium shadow group"
              >
                <div className="font-semibold flex items-center gap-2">🧠 Mind Map</div>
                <p className="text-xs mt-1 text-gray-600 group-hover:text-purple-700">
                  Brainstorm fast. Connect ideas.
                </p>
              </li>

              <li
                id="project-outline"
                onClick={() => handleShowTemplate('project-outline')}
                className="bg-gray-100 hover:bg-purple-100 transition-colors duration-200 px-4 py-3 rounded-lg cursor-pointer text-gray-800 text-sm font-medium shadow group"
              >
                <div className="font-semibold flex items-center gap-2">📝 Project Outline</div>
                <p className="text-xs mt-1 text-gray-600 group-hover:text-purple-700">
                  Plan smarter. See the big picture.
                </p>
              </li>

              <li
                id="flowchart"
                onClick={() => handleShowTemplate('flowchart')}
                className="bg-gray-100 hover:bg-purple-100 transition-colors duration-200 px-4 py-3 rounded-lg cursor-pointer text-gray-800 text-sm font-medium shadow group"
              >
                <div className="font-semibold flex items-center gap-2">📊 Flowchart</div>
                <p className="text-xs mt-1 text-gray-600 group-hover:text-purple-700">
                  Map steps. Clear logic.
                </p>
              </li>
            </ul>
          </div>
        </div>
      )}

      {showingTemplate && (
        <div className="absolute  top-[15%] left-1/2 transform -translate-x-1/2 z-50 w-[90vw] sm:w-[80vw] h-[70vh] bg-purple-100 rounded-xl shadow-2xl border border-gray-300 p-4 overflow-y-auto scrollbar-custom">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">{currentTemplate.replace('-', ' ')}</h2>
            <button
              onClick={handleCloseTemplate}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300 ease-in-out"
            >
              ✕ Close
            </button>

          </div>

          <div className="h-full scrollbar-custom">
            {currentTemplate === 'kanban' && <Kanban boardId={whiteboardId} socket={socketRef.current} />}
            {currentTemplate === 'mindmap' &&
              <ReactFlowProvider>
                <Mindmaps socketRef={socketRef.current} whiteboardId={whiteboardId} />
              </ReactFlowProvider>

            }
            {currentTemplate === 'project-outline' && <CommingSoon type="project-outline" />}
            {currentTemplate === 'flowchart' && <CommingSoon type="flowchart" />}
          </div>
        </div>
      )}

    </div>
  );
};

export default Canvas;