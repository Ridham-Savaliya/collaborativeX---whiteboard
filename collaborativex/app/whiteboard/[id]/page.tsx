"use client";

import React, { useState, useEffect, useCallback } from "react";
import Canvas from "../../components/Canvas";
import Sidebar from "../../components/Sidebar";
import { StickyNote, WhiteboardElement } from "../../components/Types";
import { log } from "console";
import withAuth from "@/app/api/_lib/withAuth";
import { useGlobalLoader } from "@/app/hooks/useGlobalLoader";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useParams } from "next/navigation";





const WhiteboardPage: React.FC = () => {

  const params = useParams();
  const id = params?.id as string;
  const router = useRouter()
  console.log("Whiteboard ID:", id);
  const { navigateWithLoader } = useGlobalLoader();

  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<
    "pen" | "eraser" | "highlighter" | "shape" | "stickyNote" | "text" | null
  >("pen");
  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [selectedShapeType, setSelectedShapeType] = useState<
    | "rectangle"
    | "circle"
    | "line"
    | "triangle"
    | "diamond"
    | "star"
    | "arrow"
    | "heart"
    | "pentagon"
    | "hexagon"
    | "heptagon"
    | "octagon"
    | "cross"
    | "smiley"
    | "cloud"
    | null
  >(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [textFontSize, setTextFontSize] = useState<number>(24);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [canvasKey, setCanvasKey] = useState<number>(0);
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontFamily: "Arial",
  });




  const [history, setHistory] = useState<
    { elements: WhiteboardElement[]; stickyNotes: StickyNote[] }[]
  >([{ elements: [], stickyNotes: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const token = localStorage.getItem("token"); // Get the JWT token
  let inviteeEmail = new URLSearchParams(window.location.search).get('collaborator');
  const [ShowIsNotRegisteredModel, setShowIsNotRegisteredModel] = useState(false)
  const [ShowIsNotInvitedModel, setShowIsNotInvitedModel] = useState(false)
  const Wid = useParams();
  const WhiteboardId = Wid.id;
  console.log(Wid.id)
  console.log(inviteeEmail)
  console.log("🔄 Build version: 470a846")

useEffect(() => {

    const CheckCollaborators = async () => {
      try {
        const res = await axios.post(
          "/api/whiteboard/collaborate",
          {
            WhiteboardId,
            email: inviteeEmail
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = res.data;

        if (data.success === "pass") {
          console.log(data.message);

        }
      } catch (error: any) {
        const status = error?.response?.status;
        const reason = error?.response?.data?.reason;
        const message = error?.response?.data?.message;

        if (status === 401 && reason === "Not_Registered") {
          console.log("❌ Not registered:", message);
          // 👉 Redirect to register page or show "Please sign up" message
          setShowIsNotRegisteredModel(true)

          setTimeout(() => {
            router.push(
              `/register?postRegister=/whiteboard/${WhiteboardId}?collaborator=${inviteeEmail}`
            );
          }, 4500);

        }
        else if (status === 403 && reason === "Not_Invited") {
          console.log("❌ Not invited:", message);

          // 👉 Show "You are not invited to this whiteboard" or disable access
          setShowIsNotInvitedModel(true)
          setTimeout(() => {
            router.push(
              `/`
            );
          },5000);
        }
        else {
          console.warn("⚠️ Unexpected error:", message || error.message);
          setShowIsNotInvitedModel(false)
          setShowIsNotRegisteredModel(false)
        }
      }
    };

    if (inviteeEmail && WhiteboardId) {
      CheckCollaborators();
    }
  }, []);



  useEffect(() => {
    const startTime = Date.now(); // Track when user opened the page


    const handleBeforeUnload = () => {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      if (token) {
        fetch("/api/user/profile/timespent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Auth header
          },
          body: JSON.stringify({ sessionDurationSeconds: durationSeconds }),
          keepalive: true, // ✅ Ensures it still sends even if tab is closed
        });
      }
    };

    // ✅ Attach event before window unloads
    window.addEventListener("beforeunload", handleBeforeUnload);

    // ✅ Cleanup on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // check whether the collaborator is registered or invited!


  


  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

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

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [canRedo]);

  const handleToolChange = useCallback(
    (
      newTool:
        | "pen"
        | "eraser"
        | "highlighter"
        | "shape"
        | "stickyNote"
        | "text"
        | null
    ) => {
      setTool(newTool);
      setShowShapesDrawer(newTool === "shape");
    },
    []
  );

  return (
    <div className="flex h-screen overflow-hidden  font-sans">

{ShowIsNotRegisteredModel && (
  <div className="absolute inset-0 bg-gradient-to-br  from-purple-600 to-fuchsia-600 text-white flex flex-col justify-center items-center z-50 p-4">
    <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-center">
      You’re not registered with us😊
    </h1>
    <p className="text-lg md:text-xl text-center max-w-md">
      Please complete your registration to collaborate on this whiteboard. You’ll be redirected shortly. ❤️
    </p>
    <span className="mt-6 text-sm text-white/80">— CollaborativeX</span>
  </div>
)}

{ShowIsNotInvitedModel && (
  <div className="fixed inset-0 bg-gradient-to-br from-purple-700 to-indigo-600 text-white flex flex-col justify-center items-center z-50 p-4">
    <div className="flex items-center gap-2 mb-4 animate-pulse">
      <h1 className="text-4xl font-bold">Collaborative</h1>
      <img
        src="https://res.cloudinary.com/dzrzfsu9u/image/upload/v1748849092/promotions/v2vqh2xjmdemfqsqnhpb.png"
        alt="CollaborativeX Logo"
        className="w-12 h-12 rounded-md shadow-lg"
      />
    </div>
    <p className="text-2xl text-center font-semibold mb-2">
      You are not invited to this whiteboard😊.
    </p>
    <p className="text-lg text-center mb-4 max-w-md">
      Please contact the whiteboard owner if you believe this is a mistake.
    </p>
    <p className="text-sm text-white/80 italic">
      You will be redirected to the homepage shortly...
    </p>
    <button className="mt-2" onClick={()=> navigateWithLoader(router,"/")}><span className="font-bold hover:text-purple-200">Click here</span>  if you don't want to wait...</button>
  </div>
)}


      <Sidebar
        setColor={setStrokeColor}
        setLineWidth={setLineWidth}
        setTool={handleToolChange}
        currentColor={strokeColor}
        currentLineWidth={lineWidth}
        currentTool={tool}
        clearCanvas={clearCanvas}
        setShowShapesDrawer={setShowShapesDrawer}
        showShapesDrawer={showShapesDrawer}
        setShapeType={setSelectedShapeType}
        currentShapeType={selectedShapeType}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        textFontSize={textFontSize}
        setTextFontSize={setTextFontSize}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        textStyles={textStyles}
        setTextStyles={setTextStyles}
        addStickyNote={(note: StickyNote) =>
          setStickyNotes((prev) => [...prev, note])
        }
      />
      <main className="flex-1 overflow-hidden relative">
        <Canvas
          key={canvasKey}
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
