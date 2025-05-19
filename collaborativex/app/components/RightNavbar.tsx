'use client';
import React, { useState } from 'react';
import { User, Home, Save, Download } from 'lucide-react';

const RightNavBar: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSave = () => {
    // Placeholder for save functionality
    alert('Saving whiteboard...');
  };

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Exporting whiteboard as PNG...');
  };

  return (
    <div className="absolute top-5 right-5 flex items-center space-x-2 z-30">
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
      <a
        href="/dashboard"
        className="p-2 bg-gray-700/90 text-white rounded-full hover:bg-gray-600 transition-all duration-300"
        title="Go to Dashboard"
        aria-label="Go to Dashboard"
      >
        <Home size={20} />
      </a>
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
                onClick={() => alert('Logging out...')}
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
