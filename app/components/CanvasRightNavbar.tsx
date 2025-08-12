"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Home, Save, Download, ScreenShare, Copy, Link } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import StyledQRCode from "./StyledQRCode";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../context/Usercontext";

interface RightNavBarProps {
  saveWhiteboard: () => void;
  exportAsPNG: () => void;
  exportAsPDF: () => void;
}

interface UserType {
  name: string;
  email?: string;
}

const RightNavBar: React.FC<RightNavBarProps> = ({ saveWhiteboard, exportAsPDF, exportAsPNG }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModel, setshowInviteModel] = useState(false);
  const [inviteeData, setinviteeData] = useState<string>("");
  const [isInviting, setisInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const params = useParams();
  const [isDirty, setIsDirty] = useState(true);
  const router = useRouter();
const username  = useRef(null)
  const {user} = useUser();

  // Mock user data - replace with your actual user context
  // const user: UserType = { name: "John Doe", email: "john@example.com" };

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const handleSave = () => {
    saveWhiteboard();
    setIsDirty(false);
  };

  const generateShareLink = async () => {
    setIsGeneratingLink(true);
    const token:any = localStorage.getItem('token');
    const decode:any = jwtDecode(token);
    const email = decode.email;
    try {
      const response = await axios.post("/api/whiteboard/lnvitelink", {
        whiteboardId: params.id,
        owner: email || "Anonymous"
      });

      if (response.data.success) {
        setInviteLink(response.data.inviteLink);
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      alert("Failed to generate share link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  const handleInvite = async (e: any) => {
    e.preventDefault();
    setisInviting(true);

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
          inviteeData: cleanedEmails,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.status === 200) {
        alert(res?.data?.message || "Invitation sent!");
        setinviteeData("");
        setisInviting(false);
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error sending invites");
      console.error("Error at inviting:", error.message);
    } finally {
      setisInviting(false);
    }
  };

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
    localStorage.removeItem("postLogin");
    localStorage.removeItem("postRegister");
    navigateTo("/");
  };

  const handleShareClick = () => {
    setshowInviteModel(!showInviteModel);
    if (!showInviteModel && !inviteLink) {
      generateShareLink();
    }
  };

  return (
    <div className="absolute top-5 right-16 flex items-center space-x-2 z-30">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-purple-500 animate-pulse z-50" />
      )}

      {showInviteModel && (
        <div className="absolute top-12 right-0 z-50 w-80 sm:w-72 p-4 rounded-xl shadow-2xl border border-purple-800 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 transition-all duration-300 ease-out animate-in fade-in zoom-in">
          <h1 className="text-white text-lg font-bold mb-3 text-center">🔗 Share Whiteboard</h1>

          <div className="bg-white/10 rounded-lg backdrop-blur-sm p-3">
            {isGeneratingLink ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : inviteLink ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 p-2 text-xs bg-white/20 text-white rounded border-0 outline-none font-mono truncate"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-2 py-2 rounded transition-all duration-200 ${linkCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    title="Copy link"
                  >
                    {linkCopied ? '✓' : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex justify-center items-center w-full py-2">
                  <div className="w-full max-w-[200px] h-auto">
                    <StyledQRCode invitelink={inviteLink} />
                  </div>
                </div>


                <p className="text-white/70 text-xs text-center">
                  Scan QR code or share the link above
                </p>
              </div>
            ) : (
              <button
                onClick={generateShareLink}
                className="w-full bg-white/20 border border-white text-white font-semibold py-2 px-3 text-sm rounded-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:bg-white/30 backdrop-blur-md"
              >
                Generate Share Link
              </button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleShareClick}
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
              <p className="text-xs text-gray-300">{user?.name}</p>
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