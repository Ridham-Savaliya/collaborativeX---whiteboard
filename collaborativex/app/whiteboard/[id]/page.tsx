"use client";

import React, { useState, useEffect, useCallback } from "react";
import Canvas from "../../components/Canvas";
import Sidebar from "../../components/Sidebar";
import InviteValidation from "../../components/InviteValidation";
import { StickyNote, WhiteboardElement } from "../../components/Types";
import withAuth from "@/app/api/_lib/withAuth";
import { useGlobalLoader } from "@/app/hooks/useGlobalLoader";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useParams, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/app/utills/ToastProvider";
import { Cardio } from 'ldrs/react';
import 'ldrs/react/Cardio.css'
import WhiteboardTour from "@/app/components/WhiteboardTour";
/**
 * WhiteboardPage Component
 * 
 * Main whiteboard collaboration interface with integrated invite validation system.
 * Implements security-first approach where all API calls are gated by proper
 * invite validation when accessing via invitation links.
 * 
 * Security Features:
 * - Invite token validation before any whiteboard operations
 * - User authorization checking for protected whiteboards
 * - Session duration tracking for analytics
 * - Proper error handling with user-friendly messages
 * 
 * Flow:
 * 1. Load with invite validation if invite token present
 * 2. Validate user authorization for whiteboard access
 * 3. Initialize whiteboard interface after successful validation
 * 4. Track user session for analytics and security
 */
const WhiteboardPage: React.FC = () => {
  const { showToast } = useToast();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const router = useRouter();
  const { navigateWithLoader } = useGlobalLoader();

  // Whiteboard state management
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<
    "pen" | "eraser" | "highlighter" | "shape" | "stickyNote" | "text" | null
  >("pen");
  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [selectedShapeType, setSelectedShapeType] = useState<
    | "rectangle" | "circle" | "line" | "triangle" | "diamond" | "star"
    | "arrow" | "heart" | "pentagon" | "hexagon" | "heptagon" | "octagon"
    | "cross" | "smiley" | "cloud" | null
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

  // Security and validation state
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteValidated, setIsInviteValidated] = useState(false);
  const [isUnauthorizedAttempt, setIsUnauthorizedAttempt] = useState(false);
  const [validatedEmail, setValidatedEmail] = useState<string>('');

  // Authentication and authorization
  const token = localStorage.getItem("token");
  const inviteToken = searchParams.get('inviteetoken');
  const [inviteeEmail, setinviteeEmail] = useState('');
  const [isSesssionExpired, setisSesssionExpired] = useState(false);

  // Undo/Redo capabilities
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  console.log("🔄 Whiteboard ID:", id);
  console.log("🔑 Invite Token Present:", !!inviteToken);



  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000); // in seconds

        if (decoded.exp < currentTime) {
          setisSesssionExpired(true)
          console.warn("Token has expired");
          showToast("Your session has expired. Please log in again.", "warning");
          // Optional: logout, redirect, or clear token here
        } else {
          console.log("Token is valid");
        }
      } catch (error) {
        console.error("Invalid token", error);
        showToast("Invalid token. Please try again.", "error");
      }
    }
  }, [token]);

  /**
    * Initialize loading state and responsive behavior
    */
  useEffect(() => {

    let timer: any;
    if (!isSesssionExpired) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }


    // Set responsive sidebar state
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }

    return () => clearTimeout(timer);
  }, []);




  /**
   * Handle responsive design for sidebar
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  /**
   * Handle invite validation completion
   * This is the security gate that controls all subsequent API calls
   * 
   * @param isValid - Whether the invite validation succeeded
   * @param email - The validated email from the invite flow
   * 
   * 
   * 



  */


  const [runTour, setRunTour] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);


  useEffect(() => {
    setHasMounted(true);
  }, []); // Empty dependency array ensures this runs only once on mount

  // This useEffect now perfectly synchronizes the tour with the canvas rendering
  useEffect(() => {
    // Only check localStorage after component has mounted
    if (!hasMounted) return;

    // Define the condition that determines if the main UI is ready
    const isUiReady = !isLoading && (!inviteToken || isInviteValidated) && !isUnauthorizedAttempt;

    // Only proceed if the UI is actually visible
    if (isUiReady) {
      const hasSeenTour = localStorage.getItem('hasSeenWhiteboardTour');
      // Check for both null and 'false' to ensure the tour runs when needed
      if (!hasSeenTour || hasSeenTour === 'false') {
        const timer = setTimeout(() => {
          setRunTour(true);
        }, 500); // Increased delay to ensure DOM is fully ready
        return () => clearTimeout(timer);
      }
    }
  }, [hasMounted, isLoading, isInviteValidated, isUnauthorizedAttempt, inviteToken]);

 const handleTourEnd = async () => {
  setRunTour(false);

  try {
    const res = await axios.post('/api/user/approveOnboarding', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 200) {
      showToast('🎉 Onboarding complete! You’re all set to use your whiteboard.', 'success');
      localStorage.setItem('hasSeenWhiteboardTour', 'true');
    } else {
      showToast('Something went wrong while saving your onboarding status.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('⚠️ Failed to update onboarding status. Please try again.', 'error');
  }
};




  const handleInviteValidation = useCallback((isValid: boolean, email?: string) => {
    console.log("🔐 Invite validation result:", isValid, email);

    if (isValid) {
      setIsInviteValidated(true);
      if (email) {
        setValidatedEmail(email);
      }
    } else {
      // Validation failed - redirect to home or show error
      showToast('Access denied. Invalid or expired invitation.', 'info');
      // setTimeout(() => {

      navigateWithLoader(router, '/');
      // }, 0);

    }
  }, [showToast, navigateWithLoader, router]);

  /**
   * Check whiteboard authorization after invite validation
   * This only runs after successful invite validation or for direct access
   */
  useEffect(() => {
    const checkWhiteboardAuthorization = async () => {
      // Only proceed if invite validation is complete (or not required)
      if (inviteToken && !isInviteValidated) {
        return; // Wait for invite validation
      }

      if (!token) {
        showToast('Authentication required', 'error');
        const loginUrl: any = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('postLogin', `/whiteboard/${id}`);
        loginUrl.searchParams.set('collaborator', inviteeEmail);
        navigateWithLoader(router, `/login?postLogin=/whiteboard/${id}&collaborator=${inviteeEmail}`);
        return;
      }

      try {
        let userId;
        try {
          const decoded: { userId: string } = jwtDecode(token);
          userId = decoded.userId;
        } catch (error) {
          showToast('Invalid authentication token', 'error');
          localStorage.removeItem('token');
          navigateWithLoader(router, '/login');
          return;
        }

        // Check if user is authorized to access this whiteboard
        const response = await axios.post('/api/whiteboard/protectedWhiteboard', {
          whiteboardId: id,
          userId: userId
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          console.log("✅ Whiteboard access authorized");
          // Additional whiteboard initialization can go here
          if (isUnauthorizedAttempt) {
            setIsUnauthorizedAttempt(false);
          }
        }

      } catch (error: any) {
        const status = error?.response?.status;
        const reason = error?.response?.data?.reason;
        const message = error?.response?.data?.message;

        // console.error("❌ Whiteboard authorization failed:", { status, reason, message });

        if (status === 401 && reason === 'not_authorized') {
          setIsUnauthorizedAttempt(true);
        } else {
          showToast(message || 'Failed to access whiteboard', 'error');
          setTimeout(() => {
            navigateWithLoader(router, '/');
          }, 3000);
        }
      }
    };

    checkWhiteboardAuthorization();
  }, [id, token, router, showToast, navigateWithLoader, inviteToken, isInviteValidated]);

  /**
   * Track user session duration for analytics and security
   * Sends session data when user leaves the page
   */
  useEffect(() => {
    const startTime = Date.now();

    const handleBeforeUnload = () => {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      if (token && durationSeconds > 5) { // Only track sessions longer than 5 seconds
        fetch("/api/user/profile/timespent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionDurationSeconds: durationSeconds,
            whiteboardId: id,
            inviteUsed: !!inviteToken,
            validatedEmail: validatedEmail || null
          }),
          keepalive: true,
        }).catch(console.error); // Silent error handling for analytics
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [token, id, inviteToken, validatedEmail]);

  // Canvas and whiteboard functionality
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

  const HandleInviteeEmail = (email: string) => {
    setinviteeEmail(email);
  }

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
    (newTool: "pen" | "eraser" | "highlighter" | "shape" | "stickyNote" | "text" | null) => {
      setTool(newTool);
      setShowShapesDrawer(newTool === "shape");
    },
    []
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans">

      {/* {isLoading && ()} */}
      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/20 dark:bg-black/30 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-xl bg-white/40 dark:bg-zinc-900/50 backdrop-blur-md shadow-lg">
            <Cardio size={48} stroke={3} speed={2} color="#7c3aed" />
            <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
              Powered by CollaborativeX...
            </p>
          </div>
        </div>
      )}



      {isSesssionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-950 to-black backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-white/10 backdrop-blur-md border border-purple-500 shadow-2xl max-w-sm text-center">
            {/* this is the commit */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>

            <h2 className="text-lg font-semibold text-purple-100">Session Expired</h2>

            <p className="text-sm text-zinc-300">
              Your session has ended. Please log in again to continue.
            </p>

            <button
              onClick={() => router.push("/")} // define this function
              className="mt-4 px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-full hover:bg-purple-700 transition-all"
            >
              Log In Again
            </button>
          </div>
        </div>
      )}



      {/* Invite Validation Component - Security Gateway */}
      <InviteValidation
        whiteboardId={id}
        onValidationComplete={handleInviteValidation}
        showToast={showToast}
        HandleInviteeEmail={HandleInviteeEmail}
      />

      {/* Unauthorized Access Modal */}
      {isUnauthorizedAttempt && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-gradient-to-br from-purple-500 to-green-600 text-white">
          <div className="text-center max-w-lg mx-4 p-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-xl text-white/90 mb-4">
              This whiteboard is private or doesn't exist.
            </p>
            <p className="text-white/80 leading-relaxed mb-6">
              The whiteboard you're trying to access is not publicly available,
              or you don't have permission to view it.
            </p>
            <button
              className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
              onClick={() => navigateWithLoader(router, "/")}
            >
              Go to Homepage
            </button>
          </div>
        </div>
      )}

      {/* Main Whiteboard Interface */}
      {/* Only render if not loading and invite validation passed (if required) */}
      {!isLoading && (!inviteToken || isInviteValidated) && !isUnauthorizedAttempt && (
        <>
          <WhiteboardTour run={runTour} onTourEnd={handleTourEnd} />
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
        </>
      )}
    </div>
  );
};

export default WhiteboardPage;