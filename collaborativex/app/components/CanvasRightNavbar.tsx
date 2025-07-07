"use client";

import React, { useState, useEffect } from "react";
import { User, Home, Save, Download, ScreenShare } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { IoShareSocialOutline } from "react-icons/io5";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { useToast } from "../utills/ToastProvider";
import Whiteboard from "../api/models/Whiteboard";

interface RightNavBarProps {
  saveWhiteboard: () => void;
  exportAsPNG: () => void;
  exportAsPDF: () => void;
}

const RightNavBar: React.FC<RightNavBarProps> = ({ saveWhiteboard, exportAsPDF, exportAsPNG }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModel, setshowInviteModel] = useState(false)
  const [inviteeData, setinviteeData] = useState<string>("")
  const [isInviting, setisInviting] = useState(false)
      const params = useParams()
  const [isDirty, setIsDirty] = useState(true); // Assume changes are not saved initially
  const router = useRouter();
const {showToast} = useToast()

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return; // If no unsaved changes, do nothing

      e.preventDefault();
      e.returnValue = ""; // Required for Chrome
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const handleSave = () => {
    saveWhiteboard();
    setIsDirty(false); // Changes are saved now
  };


const handleInvite = async (e: any) => {
  e.preventDefault();
  setisInviting(true);


  // Convert the input string into array of trimmed emails
  const cleanedEmails = inviteeData
    .split(",")
    .map((email: string) => email.trim())
    .filter((email: string) => email.length > 0);

  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "/api/whiteboard/invite",
      {
        WhiteboardId: params.id,
        inviteeData: cleanedEmails, // ✅ Send array here
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res?.status === 200) {

      showToast(res?.data?.message || "Invitation sent!","success")
      setinviteeData(""); // Clear the input
      setisInviting(false)
    }
  } catch (error: any) {

    showToast(error?.response?.data?.message || "Error sending invites","error")
    console.error("Error at inviting:", error.message);
  } finally {

    setisInviting(false);
  }
};




  const token: any = localStorage.getItem('token');
  let decode: any = '';
  if (token) {

    decode = jwtDecode<{ name: string }>(token)
  }


  const handleExport = () => {
    exportAsPNG();
    alert("Exporting whiteboard as PNG...");
  };

  const navigateTo = (path: string) => {
    setIsLoading(true);
    router.push(path);
  };

  const handelLogout = () => {
    localStorage.removeItem("token");
    navigateTo("/");
  };

  return (
    <div className="absolute top-5 right-16 flex items-center space-x-2 z-30">

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-purple-500 animate-pulse z-50" />
      )}

      {showInviteModel && (
        <div
          className={`
      absolute top-12 right-0 z-50 w-full max-w-md
      p-6 rounded-xl shadow-2xl border border-purple-800
      bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700
      flex flex-col items-center justify-center
      transition-all duration-300 ease-out
      animate-in fade-in zoom-in
    `}
        >
          <h1 className="text-white text-xl font-extrabold mb-4">🎉 Invite Collaborators</h1>

          <form
            action="post"
            onSubmit={handleInvite}
            className="w-full flex flex-col gap-3"
          >
            <div className="w-full">
              <textarea
              value={inviteeData}
              required
                placeholder="Enter emails separated by commas"
                onChange={(e) => setinviteeData(e.target.value)}
                className="w-full h-24 p-3 rounded-md bg-white/20 text-white placeholder-white/70 font-mono resize-none outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-lg transition-all duration-300"
              />
            </div>

            <input
              type="submit"

              value={isInviting ? "sending invite..." : "🚀 Send Invite" }
              className="cursor-pointer w-full bg-white/20 border border-white text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:bg-white/30 backdrop-blur-md"
            />
          </form>
        </div>
      )}

      <button
      onClick={() => setshowInviteModel((prev) => !prev)}

        className="p-2 bg-gray-700/90 text-white rounded-full hover:bg-gray-600 transition-all duration-300"
        title="Share Whiteboard"
        aria-label="Share Whiteboard"
      >
        <ScreenShare className="w-6 h-5" />

      </button>

      <button
        onClick={handleSave}
        className="p-2 bg-gray-700/90 text-white rounded-full hover:bg-gray-600 transition-all duration-300"
        title="Save Whiteboard"
        aria-label="Save Whiteboard"
      >
        <Save size={20} />
      </button>

      <button
        onClick={handleExport}
        className="p-2 bg-gray-700/90 text-white rounded-full hover:bg-gray-600 transition-all duration-300"
        title="Export Whiteboard"
        aria-label="Export Whiteboard"
      >
        <Download size={20} />
      </button>

      <button
        onClick={() => navigateTo("/onboarding")}
        className="p-2 bg-gray-700/90 text-white rounded-full hover:bg-gray-600 transition-all duration-300"
        title="Go to Dashboard"
        aria-label="Go to Dashboard"
      >
        <Home size={20} />
      </button>

      <div className="relative">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="p-2 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full hover:from-purple-400 hover:to-purple-600 transition-all duration-300"
          title="Profile"
          aria-label="Profile"
        >
          <User size={20} />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-xl text-white rounded-md shadow-lg border border-purple-500/20">
            <div className="p-4">
              <p className="text-sm font-medium">User Name</p>
              <p className="text-xs text-gray-300">{decode.name}</p>
            </div>
            <div className="border-t border-purple-500/20">
              <button
                onClick={() => navigateTo("/profile")}
                className="w-full text-left px-4 py-2 text-sm tracking-wider hover:bg-gray-700/80 transition-all duration-300"
              >
                Profile
              </button>

              <button
                onClick={handelLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700/80 transition-all duration-300"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightNavBar;
