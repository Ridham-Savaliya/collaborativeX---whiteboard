'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Canvas from '../../components/Canvas';
import Sidebar from '../../components/Sidebar';
import { StickyNote, WhiteboardElement } from '../../components/Types';
import withAuth from '@/app/api/_lib/withAuth';
import { useGlobalLoader } from '@/app/hooks/useGlobalLoader';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

// This component stays as a client component, original logic preserved
const WhiteboardPage: React.FC = () => {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : null;
  console.log(id)
  console.log("this is checking log for vercel")
  const router = useRouter();
  const { navigateWithLoader } = useGlobalLoader();

  // Defer window/localStorage reads to client-side
  const [token, setToken] = useState<string | null>(null);
  const [inviteeEmail, setInviteeEmail] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!id) return;
    setToken(localStorage.getItem('token'));
    setInviteeEmail(new URLSearchParams(window.location.search).get('collaborator'));
    setInitialized(true);
  }, [id]);

  // Redirect logic once initialized
  useEffect(() => {
    if (!initialized) return;
    if (!id) {
      router.replace('/');
    } else if (!token) {
      router.replace('/login');
    }
  }, [initialized, id, token, router]);

  // Collaborator check from original code
  useEffect(() => {
    if (!initialized || !id || !inviteeEmail || !token) return;
    const CheckCollaborators = async () => {
      try {
        const res = await axios.post(
          '/api/whiteboard/collaborate',
          { WhiteboardId: id, email: inviteeEmail },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
        );
        if (res.data.success === 'pass') {
          console.log(res.data.message);
        }
      } catch (error: any) {
        const status = error?.response?.status;
        const reason = error?.response?.data?.reason;
        const message = error?.response?.data?.message;

        if (status === 401 && reason === 'Not_Registered') {
          setTimeout(() => {
            router.replace(
              `/register?postRegister=/whiteboard/${id}?collaborator=${inviteeEmail}`
            );
          }, 4500);
        } else if (status === 403 && reason === 'Not_Invited') {
          setTimeout(() => router.replace('/'), 5000);
        } else {
          console.warn('Unexpected error:', message || error.message);
        }
      }
    };
    CheckCollaborators();
  }, [initialized, id, inviteeEmail, token, router]);

  // Original drawing state logic
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'shape' | 'stickyNote' | 'text' | null>('pen');
  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [selectedShapeType, setSelectedShapeType] = useState<string | null>(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [textFontSize, setTextFontSize] = useState<number>(24);
  const [textStyles, setTextStyles] = useState({ bold: false, italic: false, underline: false, fontFamily: 'Arial' });

  const [history, setHistory] = useState<{ elements: WhiteboardElement[]; stickyNotes: StickyNote[] }[]>(
    [{ elements: [], stickyNotes: [] }]
  );
  const [historyIndex, setHistoryIndex] = useState(0);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const clearCanvas = useCallback(() => {
    setStickyNotes([]);
    setHistory([{ elements: [], stickyNotes: [] }]);
    setHistoryIndex(0);
  }, []);

  const saveToHistory = useCallback(
    (state: { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }) => {
      setHistory((prev) => {
        const newHistory = [...prev.slice(0, historyIndex + 1), state];
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyIndex]
  );

  const undo = useCallback(() => { if (canUndo) setHistoryIndex((prev) => prev - 1); }, [canUndo]);
  const redo = useCallback(() => { if (canRedo) setHistoryIndex((prev) => prev + 1); }, [canRedo]);
  const handleToolChange = useCallback((newTool) => { setTool(newTool); setShowShapesDrawer(newTool === 'shape'); }, []);

  // Show loading until ready
  if (!initialized) {
    return <div className="w-full h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar
        setColor={setStrokeColor}
        setLineWidth={setLineWidth}
        setTool={handleToolChange}
        currentColor={strokeColor}
        currentLineWidth={lineWidth}
        currentTool={tool}
        clearCanvas={clearCanvas}
        showShapesDrawer={showShapesDrawer}
        setShowShapesDrawer={setShowShapesDrawer}
        setShapeType={setSelectedShapeType}
        currentShapeType={selectedShapeType}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        textFontSize={textFontSize}
        setTextFontSize={setTextFontSize}
        textStyles={textStyles}
        setTextStyles={setTextStyles}
        addStickyNote={(note) => setStickyNotes((prev) => [...prev, note])}
      />

      <main className="flex-1 overflow-hidden relative">
        <Canvas
          key={id + historyIndex}
          strokeColor={strokeColor}
          lineWidth={lineWidth}
          tool={tool}
          shapeType={selectedShapeType}
          stickyNotes={stickyNotes}
          setStickyNotes={setStickyNotes}
          textFontSize={textFontSize}
          saveToHistory={saveToHistory}
          historyIndex={historyIndex}
          history={history}
          textStyles={textStyles}
        />
      </main>
    </div>
  );
};

export default withAuth(WhiteboardPage);
