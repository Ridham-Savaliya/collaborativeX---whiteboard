"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Handle,
  Position,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
} from "reactflow";
import { 
  Pencil, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  Wifi, 
  WifiOff, 
  Download,
  Upload,
  Zap,
  Brain,
  Sparkles,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "reactflow/dist/style.css";

// Demo mindmap data for quick start
const DEMO_NODES = [
  {
    id: "1",
    type: "custom",
    position: { x: 400, y: 200 },
    data: { label: "My Project Ideas" },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 200, y: 350 },
    data: { label: "Mobile App" },
  },
  {
    id: "3",
    type: "custom",
    position: { x: 400, y: 350 },
    data: { label: "Web Platform" },
  },
  {
    id: "4",
    type: "custom",
    position: { x: 600, y: 350 },
    data: { label: "AI Integration" },
  },
  {
    id: "5",
    type: "custom",
    position: { x: 100, y: 500 },
    data: { label: "React Native" },
  },
  {
    id: "6",
    type: "custom",
    position: { x: 300, y: 500 },
    data: { label: "Flutter" },
  },
  {
    id: "7",
    type: "custom",
    position: { x: 350, y: 500 },
    data: { label: "Next.js" },
  },
  {
    id: "8",
    type: "custom",
    position: { x: 450, y: 500 },
    data: { label: "TypeScript" },
  },
  {
    id: "9",
    type: "custom",
    position: { x: 550, y: 500 },
    data: { label: "Machine Learning" },
  },
  {
    id: "10",
    type: "custom",
    position: { x: 650, y: 500 },
    data: { label: "OpenAI API" },
  },
];

const DEMO_EDGES = [
  { id: "e1-2", source: "1", target: "2", animated: true, type: "smoothstep" },
  { id: "e1-3", source: "1", target: "3", animated: true, type: "smoothstep" },
  { id: "e1-4", source: "1", target: "4", animated: true, type: "smoothstep" },
  { id: "e2-5", source: "2", target: "5", animated: true, type: "smoothstep" },
  { id: "e2-6", source: "2", target: "6", animated: true, type: "smoothstep" },
  { id: "e3-7", source: "3", target: "7", animated: true, type: "smoothstep" },
  { id: "e3-8", source: "3", target: "8", animated: true, type: "smoothstep" },
  { id: "e4-9", source: "4", target: "9", animated: true, type: "smoothstep" },
  { id: "e4-10", source: "4", target: "10", animated: true, type: "smoothstep" },
];

// A unique ID counter for new nodes
let nodeId = 10;

const CustomNode = ({ data, id, isConnectable }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onUpdateLabel(id, e.target.value);
  };

  const finishEditing = () => {
    data.onSetEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      finishEditing();
    }
    if (e.key === "Escape") {
      finishEditing();
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <div className="relative bg-gradient-to-br from-white to-gray-50 border-2 border-purple-200 rounded-2xl shadow-lg hover:shadow-xl p-4 w-[200px] overflow-visible transition-all duration-300 hover:border-purple-400">
        
        {/* Action Buttons */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-[-20px] right-[-15px] z-20 flex gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Edit Node"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onSetEditing(id);
                }}
                className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
              >
                <Pencil size={14} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Add Child Node"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onAdd(id);
                }}
                className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors"
              >
                <Plus size={14} />
              </motion.button>
              {id !== "1" && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Delete Node"
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onDelete(id);
                  }}
                  className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Node Content */}
        {data.isEditing ? (
          <motion.input
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            type="text"
            value={data.label}
            onChange={onLabelChange}
            onBlur={finishEditing}
            onKeyDown={handleKeyDown}
            className="nodrag w-full p-2 text-gray-800 text-center bg-white border-2 border-purple-400 rounded-lg outline-none font-medium shadow-inner"
            autoFocus
          />
        ) : (
          <div className="text-center font-semibold text-gray-800 leading-tight">
            {data.label}
          </div>
        )}

        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-purple-500 !border-2 !border-white !w-3 !h-3 hover:!bg-purple-600 transition-colors"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-purple-500 !border-2 !border-white !w-3 !h-3 hover:!bg-purple-600 transition-colors"
        />
      </div>
    </motion.div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

type MindmapsProps = {
  socketRef?: any;
  whiteboardId: string;
}

export default function Mindmaps({ socketRef, whiteboardId }: MindmapsProps) {
  const [nodes, setNodes, applyNodeChanges] = useNodesState([]);
  const [edges, setEdges, applyEdgeChanges] = useEdgesState([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Auto-save timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  // Enhanced logging
  const log = (message: string, data?: any) => {
    console.log(`[Mindmap] ${message}`, data || '');
  };

  // Enhanced save function with better UX
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges.current && (socketRef?.connected || !socketRef)) {
        setSaveStatus('saving');
        setIsSaving(true);
        hasUnsavedChanges.current = false;
        
        // Simulate save process
        setTimeout(() => {
          setIsSaving(false);
          setSaveStatus('saved');
          setLastSaved(new Date());
          
          // Reset status after 2 seconds
          setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);
        }, 800);
      }
    }, 1500);
  }, [socketRef]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      if (!isInitialized) return;
      
      setEdges((eds) => {
        if (!eds || !Array.isArray(eds)) return eds;
        
        const newEdges = addEdge({ 
          ...params, 
          animated: true, 
          type: 'smoothstep',
          style: { stroke: '#8b5cf6', strokeWidth: 2 }
        }, eds);
        
        if (socketRef?.connected) {
          socketRef.emit("edges-update", { edges: newEdges });
          hasUnsavedChanges.current = true;
          debouncedSave();
        }
        return newEdges;
      });
    },
    [setEdges, socketRef, debouncedSave, isInitialized]
  );

  const updateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    if (!isInitialized) return;
    
    setNodes((nds) => {
      if (!nds || !Array.isArray(nds)) return nds;
      
      const updatedNodes = nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
      );
      
      if (socketRef?.connected) {
        socketRef.emit("nodes-update", { nodes: updatedNodes });
        hasUnsavedChanges.current = true;
        debouncedSave();
      }
      
      return updatedNodes;
    });
  }, [setNodes, socketRef, debouncedSave, isInitialized]);

  const addNode = useCallback((sourceId: string) => {
    if (!isInitialized) return;
    
    setNodes((currentNodes) => {
      if (!currentNodes || !Array.isArray(currentNodes)) return currentNodes;
      
      const sourceNode = currentNodes.find((n) => n.id === sourceId);
      if (!sourceNode) return currentNodes;

      const newId = `node_${++nodeId}`;
      const newNode: Node = {
        id: newId,
        type: "custom",
        position: {
          x: sourceNode.position.x + (Math.random() - 0.5) * 200,
          y: sourceNode.position.y + 150,
        },
        data: {
          label: `New Idea`,
        },
      };

      const newNodes = [...currentNodes, newNode];
      
      if (socketRef?.connected) {
        socketRef.emit("nodes-update", { nodes: newNodes });
        hasUnsavedChanges.current = true;
        debouncedSave();
      }
      return newNodes;
    });

    setEdges((currentEdges) => {
      if (!currentEdges || !Array.isArray(currentEdges)) return currentEdges;
      
      const newId = `node_${nodeId}`;
      const newEdge: Edge = {
        id: `e${sourceId}-${newId}`,
        source: sourceId,
        target: newId,
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      };

      const newEdges = [...currentEdges, newEdge];
      
      if (socketRef?.connected) {
        socketRef.emit("edges-update", { edges: newEdges });
      }
      return newEdges;
    });
  }, [setNodes, setEdges, socketRef, debouncedSave, isInitialized]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!isInitialized || !changes || !Array.isArray(changes)) return;
      
      try {
        applyNodeChanges(changes);
        
        setNodes((currentNodes) => {
          if (!currentNodes || !Array.isArray(currentNodes)) return currentNodes;
          
          if (socketRef?.connected) {
            socketRef.emit("nodes-update", { nodes: currentNodes });
            hasUnsavedChanges.current = true;
            debouncedSave();
          }
          
          return currentNodes;
        });
      } catch (error) {
        log('Error in onNodesChange', error);
      }
    },
    [applyNodeChanges, socketRef, debouncedSave, setNodes, isInitialized]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!isInitialized || !changes || !Array.isArray(changes)) return;
      
      try {
        applyEdgeChanges(changes);
        
        setEdges((currentEdges) => {
          if (!currentEdges || !Array.isArray(currentEdges)) return currentEdges;
          
          if (socketRef?.connected) {
            socketRef.emit("edges-update", { edges: currentEdges });
            hasUnsavedChanges.current = true;
            debouncedSave();
          }
          
          return currentEdges;
        });
      } catch (error) {
        log('Error in onEdgesChange', error);
      }
    },
    [applyEdgeChanges, socketRef, debouncedSave, setEdges, isInitialized]
  );

  const deleteNode = useCallback((id: string) => {
    if (!isInitialized || id === '1') return;
    
    setNodes((nds) => {
      if (!nds || !Array.isArray(nds)) return nds;
      
      const newNodes = nds.filter((n) => n.id !== id);
      
      if (socketRef?.connected) {
        socketRef.emit("nodes-update", { nodes: newNodes });
        hasUnsavedChanges.current = true;
        debouncedSave();
      }
      return newNodes;
    });

    setEdges((eds) => {
      if (!eds || !Array.isArray(eds)) return eds;
      
      const newEdges = eds.filter((e) => e.source !== id && e.target !== id);
      
      if (socketRef?.connected) {
        socketRef.emit("edges-update", { edges: newEdges });
      }
      return newEdges;
    });
  }, [setNodes, setEdges, socketRef, debouncedSave, isInitialized]);

  // Manual save function
  const manualSave = useCallback(() => {
    if (socketRef?.connected) {
      setSaveStatus('saving');
      setIsSaving(true);
      socketRef.emit("manual-save", { whiteboardId });
      hasUnsavedChanges.current = false;
      
      setTimeout(() => {
        setIsSaving(false);
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 500);
    } else {
      // Local save simulation
      setSaveStatus('saving');
      setIsSaving(true);
      
      setTimeout(() => {
        setIsSaving(false);
        setSaveStatus('saved');
        setLastSaved(new Date());
        hasUnsavedChanges.current = false;
        
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 800);
    }
  }, [socketRef, whiteboardId]);

  // Load demo data or initialize
  const loadDemoData = useCallback(() => {
    log('Loading demo mindmap data');
    setNodes(DEMO_NODES);
    setEdges(DEMO_EDGES);
    nodeId = 10; // Set counter to match demo data
    setIsLoading(false);
    setIsInitialized(true);
    
    // Auto-hide welcome message after 5 seconds
    setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
  }, [setNodes, setEdges]);

  // Initialize mindmap
  useEffect(() => {
    log('Initializing mindmap component');
    
    if (!socketRef) {
      // No socket - load demo data immediately
      setTimeout(loadDemoData, 500);
      return;
    }

    const socket = socketRef;
    setIsLoading(true);
    setIsInitialized(false);

    // Set loading timeout
    const timeout = setTimeout(() => {
      log('Loading timeout reached, loading demo data');
      loadDemoData();
    }, 3000);

    // Connection handlers
    const handleConnect = () => {
      log('Socket connected');
      setIsConnected(true);
      socket.emit("join-whiteboard", { whiteboardId });
    };

    const handleDisconnect = () => {
      log('Socket disconnected');
      setIsConnected(false);
    };

    // Data handlers
    const handleNodesUpdate = (data: any) => {
      try {
        if (data && data.nodes && Array.isArray(data.nodes)) {
          setNodes(data.nodes);
        }
      } catch (error) {
        log('Error handling nodes update', error);
      }
    };

    const handleEdgesUpdate = (data: any) => {
      try {
        if (data && data.edges && Array.isArray(data.edges)) {
          setEdges(data.edges);
        }
      } catch (error) {
        log('Error handling edges update', error);
      }
    };

    const handleInitialLoad = (data: any) => {
      try {
        clearTimeout(timeout);

        if (data && data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          log('Loading existing mindmap data');
          setNodes(data.nodes);
          setEdges(data.edges || []);
          
          // Update nodeId counter
          const maxId = Math.max(...data.nodes.map((n: any) => {
            const match = n.id.match(/node_(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }));
          nodeId = Math.max(nodeId, maxId);
        } else {
          log('No existing data, loading demo');
          loadDemoData();
          return;
        }
        
        setIsLoading(false);
        setIsInitialized(true);
      } catch (error) {
        log('Error handling initial load', error);
        loadDemoData();
      }
    };

    // Set up listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('mindmap-nodes-update', handleNodesUpdate);
    socket.on('mindmap-edges-update', handleEdgesUpdate);
    socket.on('mindmap-initial-load', handleInitialLoad);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('mindmap-nodes-update', handleNodesUpdate);
      socket.off('mindmap-edges-update', handleEdgesUpdate);
      socket.off('mindmap-initial-load', handleInitialLoad);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      clearTimeout(timeout);
    };
  }, [socketRef, whiteboardId, setNodes, setEdges, loadDemoData]);

  // Re-map nodes with callbacks
  const nodesWithCallbacks = nodes && Array.isArray(nodes) ? nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onAdd: addNode,
      onDelete: deleteNode,
      onUpdateLabel: updateNodeLabel,
      onSetEditing: setEditingNodeId,
      isEditing: node.id === editingNodeId,
    },
  })) : [];

  if (isLoading || !isInitialized) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Brain className="w-full h-full text-purple-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Your Mindmap</h2>
          <p className="text-gray-600 mb-4">Preparing your creative workspace...</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Setting up your ideas</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      
      {/* Welcome Message */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-6 py-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Welcome to Your Mindmap!</h3>
                  <p className="text-sm text-gray-600">Click on any node to edit, or hover to see options</p>
                </div>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Status Bar */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 sm:left-16 z-50"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-6 py-4 border border-purple-200">
          <div className="flex items-center gap-4">
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {socketRef ? (
                isConnected ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Live</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Offline</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Demo</span>
                </div>
              )}
            </div>

            {/* Save Status */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-4 h-4 text-blue-600" />
                </motion.div>
              ) : saveStatus === 'saved' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </motion.div>
              ) : saveStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Save className="w-4 h-4 text-gray-600" />
              )}
              
              <span className="text-sm text-gray-700">
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'saved' ? 'Saved!' :
                 saveStatus === 'error' ? 'Error' :
                 lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Ready'}
              </span>
            </div>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={manualSave}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2   bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
            >
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

     

      {/* Main ReactFlow */}
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges || []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        className="react-flow-mindmap"
        defaultEdgeOptions={{
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#8b5cf6', strokeWidth: 2 }
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20} 
          size={2}
          color="#a037f9"
        />
        <Controls 
          position="top-left"
          className="!bg-white/95 !backdrop-blur-sm !border-purple-200 !rounded-xl !shadow-xl"
        />
        <MiniMap 
          position="top-right"
          className="!bg-white/95 !backdrop-blur-sm !border-purple-200 !rounded-xl !shadow-xl"
          nodeColor="#8b5cf6"
          maskColor="rgba(139, 92, 246, 0.1)"
        />
      </ReactFlow>

      {/* Floating Action Button for Mobile */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          const centerNode = nodes.find(n => n.id === '1');
          if (centerNode) {
            addNode('1');
          }
        }}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-xl flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}