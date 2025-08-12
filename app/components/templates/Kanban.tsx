import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, Save, X, CheckCircle, Clock, AlertCircle, Wifi, WifiOff, Loader2, Users, AlertTriangle } from "lucide-react";
import { Socket } from "socket.io-client";

type Task = {
  id: string;
  content: string;
  createdAt: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error" | "syncing";
type ConnectionStatus = "connected" | "connecting" | "disconnected" | "reconnecting";

const initialData: Record<string, Column> = {
  todo: {
    id: "todo",
    title: "To Do",
    color: "from-blue-500 to-blue-600",
    tasks: [],
  },
  inProgress: {
    id: "inProgress",
    title: "In Progress",
    color: "from-orange-500 to-orange-600",
    tasks: [],
  },
  done: {
    id: "done",
    title: "Done",
    color: "from-green-500 to-green-600",
    tasks: [],
  },
};

const TaskCard = ({ task, index, columnId, onEdit, onDelete }: {
  task: Task;
  index: number;
  columnId: string;
  onEdit: (taskId: string, newContent: string, priority?: "low" | "medium" | "high") => void;
  onDelete: (columnId: string, taskId: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(task.priority || "medium");

  const handleSave = () => {
    if (editContent.trim()) {
      onEdit(task.id, editContent.trim(), editPriority);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(task.content);
    setEditPriority(task.priority || "medium");
    setIsEditing(false);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="w-3 h-3" />;
      case "medium": return <Clock className="w-3 h-3" />;
      case "low": return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isEditing}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-3 transition-all duration-200 ${
            snapshot.isDragging ? "shadow-2xl rotate-2 scale-105" : "hover:shadow-lg"
          }`}
        >
          {task.priority && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 border ${getPriorityColor(task.priority)}`}>
              {getPriorityIcon(task.priority)}
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </div>
          )}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-black p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
                autoFocus
                placeholder="Describe your task..."
              />
              <div className="flex gap-2 flex-wrap">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditPriority(p)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      editPriority === p ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {getPriorityIcon(p)}
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSave} 
                  className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
                <button 
                  onClick={handleCancel} 
                  className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-800 font-medium leading-relaxed">{task.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                    title="Edit task"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete(columnId, task.id)} 
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                    title="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </Draggable>
  );
};

const AddTaskForm = ({ onAdd, columnColor }: { onAdd: (content: string, priority?: "low" | "medium" | "high") => void; columnColor: string }) => {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAdd(input.trim(), priority);
      setInput("");
      setPriority("medium");
      setIsExpanded(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="w-3 h-3" />;
      case "medium": return <Clock className="w-3 h-3" />;
      case "low": return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <motion.div layout className="mb-4 text-black">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className={`w-full p-3 bg-gradient-to-r ${columnColor} text-white rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-200`}
          >
            <Plus size={16} />
            <span className="font-medium">Add Task</span>
          </motion.button>
        ) : (
          <motion.form
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your task..."
              className="w-full p-3 border  border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 flex-wrap">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    priority === p ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {getPriorityIcon(p)}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex-1 py-2 bg-gradient-to-r ${columnColor} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all duration-200`}
              >
                <Plus size={16} />
                Add Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setInput("");
                  setPriority("medium");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Connection Status Component
const ConnectionStatus = ({ 
  connectionStatus, 
  saveStatus, 
  lastSaved, 
  lastError, 
  userCount 
}: {
  connectionStatus: ConnectionStatus;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  lastError: string | null;
  userCount: number;
}) => {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return lastError || 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'connecting':
      case 'reconnecting':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'disconnected':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-orange-700 bg-orange-50 border-orange-200';
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved!';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Save error';
      default:
        return lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Ready';
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
      case 'syncing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Save className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Connection Status */}
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getConnectionColor()}`}>
        {getConnectionIcon()}
        <span className="hidden md:inline">{getConnectionText()}</span>
      </div>
      
      {/* Save Status */}
      <div className="flex items-center gap-2 text-sm text-gray-700">
        {getSaveStatusIcon()}
        <span className="hidden md:inline">{getSaveStatusText()}</span>
      </div>
      
      {/* User Count */}
      {connectionStatus === 'connected' && userCount > 1 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
          <Users className="w-3 h-3" />
          <span>{userCount}</span>
        </div>
      )}
    </div>
  );
};

export default function Kanban({ socket, boardId }: { socket: Socket, boardId: string }) {
  const [columns, setColumns] = useState<Record<string, Column>>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);
  const pendingUpdateIds = useRef(new Set<string>());
  const lastLocalUpdateId = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const totalTasks = useMemo(() => Object.values(columns).reduce((total, col) => total + col.tasks.length, 0), [columns]);

  const log = useCallback((message: string, data?: any) => {
    console.log(`[Kanban] ${message}`, data || "");
  }, []);

  // Convert MongoDB Map data to proper columns format
  const convertMongoDataToColumns = useCallback((mongoData: any): Record<string, Column> | null => {
    if (!mongoData || typeof mongoData !== 'object') {
      log("Invalid mongo data", mongoData);
      return null;
    }
    
    try {
      let converted: Record<string, Column> = {};
      
      // Handle different data formats
      if (mongoData instanceof Map) {
        // Handle Map instance
        converted = Object.fromEntries(mongoData);
        log("Converted from Map instance");
      } else if (Array.isArray(mongoData)) {
        // Handle array of entries [[key, value], ...]
        converted = Object.fromEntries(mongoData);
        log("Converted from array entries");
      } else if (typeof mongoData === 'object') {
        // Handle plain object
        converted = mongoData;
        log("Using plain object");
      }
      
      // Validate each column
      const validatedColumns: Record<string, Column> = {};
      const requiredColumns = ['todo', 'inProgress', 'done'];
      
      for (const colId of requiredColumns) {
        const column = converted[colId];
        
        if (!column || !column.id || !column.title || !column.color) {
          log(`Invalid or missing column: ${colId}`, column);
          return null;
        }
        
        // Ensure tasks is an array and validate each task
        const tasks = Array.isArray(column.tasks) ? column.tasks : [];
        const validTasks = tasks.filter((task: any) => 
          task && 
          typeof task.id === 'string' && 
          typeof task.content === 'string' && 
          typeof task.createdAt === 'string'
        ).map((task: any) => ({
          id: task.id,
          content: task.content,
          createdAt: task.createdAt,
          priority: task.priority || 'medium',
          tags: Array.isArray(task.tags) ? task.tags : [],
        }));
        
        validatedColumns[colId] = {
          id: column.id,
          title: column.title,
          tasks: validTasks,
          color: column.color,
        };
      }
      
      log("Successfully converted data", { 
        columnCount: Object.keys(validatedColumns).length,
        taskCounts: Object.fromEntries(Object.entries(validatedColumns).map(([key, col]) => [key, col.tasks.length]))
      });
      
      return validatedColumns;
    } catch (error) {
      log("Error converting MongoDB data:", error);
      return null;
    }
  }, [log]);

  // Save to database with debouncing and update ID tracking
  const saveToDatabase = useCallback((operation?: string) => {
    if (!socket?.connected || !isInitialized) {
      log("Cannot save: not connected or not initialized", { 
        connected: socket?.connected, 
        initialized: isInitialized 
      });
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (!hasUnsavedChanges.current) {
        log("No unsaved changes, skipping save");
        return;
      }
      
      setSaveStatus("saving");
      hasUnsavedChanges.current = false;
      
      const updateId = uuidv4();
      lastLocalUpdateId.current = updateId;
      pendingUpdateIds.current.add(updateId);
      
      log("Saving to database", { boardId, operation, updateId, columnCount: Object.keys(columns).length });
      
      try {
        socket.emit("kanban-update", {
          whiteboard: boardId,
          columns: columns,
          updateId,
          operation: operation || 'update',
          timestamp: Date.now(),
        });
        
        // Set timeout for save confirmation (fallback)
        setTimeout(() => {
          if (pendingUpdateIds.current.has(updateId)) {
            pendingUpdateIds.current.delete(updateId);
            setSaveStatus("saved");
            setLastSaved(new Date());
            log("Save confirmed (timeout fallback)", { updateId });
            setTimeout(() => setSaveStatus("idle"), 2000);
          }
        }, 3000);
        
      } catch (error) {
        log("Error saving to database:", error);
        setSaveStatus("error");
        setLastError("Failed to save changes");
        hasUnsavedChanges.current = true;
        setTimeout(() => {
          setSaveStatus("idle");
          setLastError(null);
        }, 5000);
      }
    }, 500); // Increased debounce to 500ms for better batching
  }, [socket, boardId, columns, isInitialized, log]);

  // Handle socket events
  useEffect(() => {
    if (!socket) {
      log("No socket provided");
      return;
    }

    const handleConnect = () => {
      log("Socket connected successfully");
      setConnectionStatus('connected');
      setLastError(null);
      reconnectAttempts.current = 0;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Join the kanban board room
      log("Joining kanban board room:", boardId);
      socket.emit("join-kanban", { whiteboard: boardId });
    };

    const handleDisconnect = (reason: string) => {
      log("Socket disconnected", { reason });
      setConnectionStatus('disconnected');
      setIsInitialized(false);
      
      // Auto-reconnect for unexpected disconnections
      if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
        setConnectionStatus('reconnecting');
        reconnectTimeoutRef.current = setTimeout(() => {
          log(`Attempting reconnection (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          reconnectAttempts.current++;
          socket.connect();
        }, 1000 * Math.pow(2, reconnectAttempts.current)); // Exponential backoff
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setLastError('Unable to reconnect to server');
      }
    };

    const handleConnectError = (error: Error) => {
      log("Connection error", error);
      setLastError(error.message);
      setConnectionStatus('disconnected');
    };

    const handleKanbanJoined = (data: any) => {
      log("Successfully joined kanban room", data);
      setUserCount(data?.userCount || 1);
    };

    const handleInitialLoad = (data: any) => {
      try {
        log("Received initial kanban data:", data);
        
        let loadedColumns: Record<string, Column>;
        
        if (data?.success === false || !data?.columns) {
          log("No server data available or server reported failure, using initial data");
          loadedColumns = initialData;
          
          // Save initial data to server if connected
          if (socket.connected) {
            log("Saving initial data to server");
            setTimeout(() => {
              const updateId = uuidv4();
              socket.emit("kanban-update", {
                whiteboard: boardId,
                columns: initialData,
                updateId,
                operation: 'initialize',
                timestamp: Date.now(),
              });
            }, 1000);
          }
        } else {
          const convertedColumns = convertMongoDataToColumns(data.columns);
          if (convertedColumns && Object.keys(convertedColumns).length >= 3) {
            loadedColumns = convertedColumns;
            log("Successfully loaded columns from server", {
              columnIds: Object.keys(loadedColumns),
              taskCounts: Object.fromEntries(Object.entries(loadedColumns).map(([key, col]) => [key, col.tasks.length]))
            });
          } else {
            log("Invalid server data structure, using initial data");
            loadedColumns = initialData;
          }
        }
        
        setColumns(loadedColumns);
        
      } catch (error) {
        log("Error processing initial data:", error);
        setColumns(initialData);
        setLastError("Failed to load board data");
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        log("Kanban initialization completed");
      }
    };

    const handleColumnsUpdate = (data: any) => {
      try {
        if (!data?.columns || !isInitialized) {
          log("Ignoring update: invalid data or not initialized", { 
            hasColumns: !!data?.columns, 
            initialized: isInitialized 
          });
          return;
        }
        
        // Check if this is our own update coming back
        if (data.updateId && data.updateId === lastLocalUpdateId.current) {
          log("Received confirmation of our own update", { updateId: data.updateId });
          pendingUpdateIds.current.delete(data.updateId);
          setSaveStatus("saved");
          setLastSaved(new Date());
          setTimeout(() => setSaveStatus("idle"), 2000);
          return;
        }
        
        // Convert and validate the incoming data
        const convertedColumns = convertMongoDataToColumns(data.columns);
        if (!convertedColumns) {
          log("Received invalid columns update", data);
          return;
        }
        
        log("Applying real-time update from another user", { 
          operation: data.operation, 
          updateId: data.updateId,
          timestamp: data.timestamp,
          sourceSocketId: data.sourceSocketId
        });
        
        setColumns(convertedColumns);
        setSaveStatus("syncing");
        setTimeout(() => setSaveStatus("idle"), 1500);
        
      } catch (error) {
        log("Error handling columns update:", error);
        setLastError("Failed to sync changes");
      }
    };

    const handleKanbanError = (data: any) => {
      log("Kanban error received:", data);
      setLastError(data.message || "Unknown error occurred");
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus("idle");
        setLastError(null);
      }, 5000);
    };

    const handleUserJoined = (data: any) => {
      log("User joined kanban", data);
      if (data?.userCount && typeof data.userCount === 'number') {
        setUserCount(data.userCount);
      }
    };

    const handleUserLeft = (data: any) => {
      log("User left kanban", data);
      if (data?.userCount && typeof data.userCount === 'number') {
        setUserCount(data.userCount);
      }
    };

    const handleSaveConfirmed = (data: any) => {
      log("Save confirmed by server", data);
      if (data?.updateId && pendingUpdateIds.current.has(data.updateId)) {
        pendingUpdateIds.current.delete(data.updateId);
        setSaveStatus("saved");
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("kanban-joined", handleKanbanJoined);
    socket.on("kanban-initial-load", handleInitialLoad);
    socket.on("kanban-columns-update", handleColumnsUpdate);
    socket.on("kanban-error", handleKanbanError);
    socket.on("kanban-user-joined", handleUserJoined);
    socket.on("kanban-user-left", handleUserLeft);
    socket.on("kanban-save-confirmed", handleSaveConfirmed);

    // Check if already connected
    if (socket.connected) {
      handleConnect();
    } else {
      setConnectionStatus('connecting');
      socket.connect();
    }

    // Set loading timeout as fallback
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        log("Loading timeout reached, using initial data");
        handleInitialLoad({ columns: null, success: false });
      }
    }, 8000);

    return () => {
      clearTimeout(loadingTimeout);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("kanban-joined", handleKanbanJoined);
      socket.off("kanban-initial-load", handleInitialLoad);
      socket.off("kanban-columns-update", handleColumnsUpdate);
      socket.off("kanban-error", handleKanbanError);
      socket.off("kanban-user-joined", handleUserJoined);
      socket.off("kanban-user-left", handleUserLeft);
      socket.off("kanban-save-confirmed", handleSaveConfirmed);
    };
  }, [socket, boardId, isLoading, isInitialized, convertMongoDataToColumns, log]);

  // Auto-save when columns change (only if initialized and has unsaved changes)
  useEffect(() => {
    if (isInitialized && hasUnsavedChanges.current) {
      log("Columns changed, triggering save", { 
        taskCounts: Object.fromEntries(Object.entries(columns).map(([key, col]) => [key, col.tasks.length]))
      });
      saveToDatabase();
    }
  }, [columns, isInitialized, saveToDatabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // CRUD Operations with optimistic updates
  const addTask = useCallback((colId: string, content: string, priority: "low" | "medium" | "high" = "medium") => {
    if (!content.trim()) return;
    
    const newTask: Task = {
      id: uuidv4(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      priority,
      tags: []
    };
    
    setColumns(prev => {
      hasUnsavedChanges.current = true;
      const updated = {
        ...prev,
        [colId]: {
          ...prev[colId],
          tasks: [...prev[colId].tasks, newTask]
        }
      };
      log("Added task locally", { colId, taskId: newTask.id, content });
      return updated;
    });
    
    saveToDatabase('add-task');
  }, [saveToDatabase, log]);

  const editTask = useCallback((taskId: string, newContent: string, priority?: "low" | "medium" | "high") => {
    setColumns(prev => {
      const newColumns = { ...prev };
      let found = false;
      
      for (const colId in newColumns) {
        const taskIndex = newColumns[colId].tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          newColumns[colId] = {
            ...newColumns[colId],
            tasks: [
              ...newColumns[colId].tasks.slice(0, taskIndex),
              {
                ...newColumns[colId].tasks[taskIndex],
                content: newContent,
                priority: priority || newColumns[colId].tasks[taskIndex].priority,
              },
              ...newColumns[colId].tasks.slice(taskIndex + 1)
            ]
          };
          found = true;
          hasUnsavedChanges.current = true;
          log("Edited task locally", { taskId, content: newContent, priority });
          break;
        }
      }
      
      if (!found) {
        log("Task not found for editing", { taskId });
      }
      
      return newColumns;
    });
    
    saveToDatabase('edit-task');
  }, [saveToDatabase, log]);

  const removeTask = useCallback((colId: string, taskId: string) => {
    setColumns(prev => {
      const taskExists = prev[colId]?.tasks.some(task => task.id === taskId);
      if (!taskExists) {
        log("Task not found for deletion", { colId, taskId });
        return prev;
      }
      
      hasUnsavedChanges.current = true;
      const updated = {
        ...prev,
        [colId]: {
          ...prev[colId],
          tasks: prev[colId].tasks.filter(task => task.id !== taskId)
        }
      };
      log("Removed task locally", { colId, taskId });
      return updated;
    });
    
    saveToDatabase('delete-task');
  }, [saveToDatabase, log]);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) {
      log("Drag cancelled: no destination");
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      log("Drag cancelled: same position");
      return;
    }

    setColumns(prev => {
      const sourceCol = prev[source.droppableId];
      const destCol = prev[destination.droppableId];
      
      if (!sourceCol || !destCol) {
        log("Invalid drag: source or destination column not found");
        return prev;
      }
      
      const sourceTasks = [...sourceCol.tasks];
      const destTasks = source.droppableId === destination.droppableId ? sourceTasks : [...destCol.tasks];
      
      // Remove task from source
      const [movedTask] = sourceTasks.splice(source.index, 1);
      
      if (!movedTask) {
        log("Invalid drag: task not found at source index");
        return prev;
      }
      
      // Prevent duplicate tasks in destination
      if (source.droppableId !== destination.droppableId && destTasks.find(task => task.id === movedTask.id)) {
        log("Prevented duplicate task move", { taskId: movedTask.id });
        return prev;
      }
      
      // Add task to destination
      destTasks.splice(destination.index, 0, movedTask);
      hasUnsavedChanges.current = true;
      
      const updated = {
        ...prev,
        [source.droppableId]: { ...sourceCol, tasks: sourceTasks },
        [destination.droppableId]: { ...destCol, tasks: destTasks },
      };
      
      log("Moved task locally", { 
        taskId: movedTask.id, 
        from: source.droppableId, 
        to: destination.droppableId, 
        sourceIndex: source.index, 
        destIndex: destination.index 
      });
      
      return updated;
    });
    
    saveToDatabase('move-task');
  }, [saveToDatabase, log]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }} 
            className="w-16 h-16 mx-auto mb-6"
          >
            <Loader2 className="w-full h-full text-purple-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Your Board</h2>
          <p className="text-gray-600 mb-4">Synchronizing with server...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-purple-600 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-200 px-4 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Kanban Board
            </h1>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
              {totalTasks} tasks
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-mono">
              Board: {boardId}
            </div>
          </div>
          
          <ConnectionStatus 
            connectionStatus={connectionStatus}
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            lastError={lastError}
            userCount={userCount}
          />
        </div>
      </motion.div>

      {/* Main Board */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(columns).map(([columnId, column], index) => (
              <motion.div
                key={columnId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 flex flex-col h-fit"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${column.color} shadow-md`}></div>
                    <h2 className="font-bold text-gray-800 text-lg">{column.title}</h2>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Add Task Form */}
                <AddTaskForm 
                  onAdd={(content, priority) => addTask(columnId, content, priority)} 
                  columnColor={column.color} 
                />

                {/* Tasks List */}
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto rounded-xl p-2 min-h-[200px] max-h-[calc(100vh-400px)] transition-all duration-200 ${
                        snapshot.isDraggingOver 
                          ? "bg-purple-100/50 border-2 border-dashed border-purple-300" 
                          : "bg-transparent"
                      }`}
                      style={{ 
                        scrollbarWidth: "thin", 
                        scrollbarColor: "#8b5cf6 transparent" 
                      }}
                    >
                      <AnimatePresence>
                        {column.tasks.map((task, taskIndex) => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            index={taskIndex} 
                            columnId={columnId} 
                            onEdit={editTask} 
                            onDelete={removeTask} 
                          />
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                      
                      {/* Empty State */}
                      {column.tasks.length === 0 && !snapshot.isDraggingOver && (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="text-center py-8 text-gray-400"
                        >
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            {columnId === "todo" && <Clock className="w-8 h-8" />}
                            {columnId === "inProgress" && <Loader2 className="w-8 h-8" />}
                            {columnId === "done" && <CheckCircle className="w-8 h-8" />}
                          </div>
                          <p className="text-sm font-medium">No tasks yet</p>
                          <p className="text-xs mt-1">Add a task to get started</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </Droppable>
              </motion.div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {lastError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm z-50"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm mt-1">{lastError}</p>
            <button 
              onClick={() => setLastError(null)}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
        
        {saveStatus === 'saved' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Changes saved successfully</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}