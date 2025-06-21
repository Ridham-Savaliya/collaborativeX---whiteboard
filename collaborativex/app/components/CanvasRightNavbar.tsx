"use client";

import React, { useState } from "react";
import { User, Home, Save, Download } from "lucide-react";
import { useRouter } from "next/navigation";


// Define props interface
interface RightNavBarProps {
  saveWhiteboard: () => void;
  exportAsPNG: () => void;
  exportAsPDF: () => void;
}

const RightNavBar: React.FC<RightNavBarProps> = ({ saveWhiteboard, exportAsPDF, exportAsPNG }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    saveWhiteboard();
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
    navigateTo("/");
  };

  return (
    <div className="absolute top-5 right-5 flex items-center space-x-2 z-30">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-purple-500 animate-pulse z-50" />
      )}

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
              <p className="text-xs text-gray-300">user@example.com</p>
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
