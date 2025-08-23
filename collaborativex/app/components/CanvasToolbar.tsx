import React, { useState } from "react";
import {
  Download,
  FileImage,
  Undo,
  Redo,
  Clock,
  Bot,  // Changed from Mic to Bot
  Shapes,
  Video,
  FileText,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "../hooks/useGlobalLoader";

// Simple utility for conditional classNames
function cn(...inputs: (string | undefined | null | false | 0)[]) {
  return inputs.filter(Boolean).join(" ");
}

type ToolbarProps = {
  onToolSelect: (tool: string) => void;
  exportAsPNG: () => Promise<void> | void;
  exportAsPDF: () => Promise<void> | void;
  shapeRecognitionEnabled: boolean;
  isShapeProcessing: boolean;
  toggleShapeRecognition: () => void;
};

const CanvasToolbar: React.FC<ToolbarProps> = ({
  onToolSelect,
  exportAsPDF,
  exportAsPNG,
  shapeRecognitionEnabled,
  isShapeProcessing,
  toggleShapeRecognition,
}) => {
  const [activeToolGroup, setActiveToolGroup] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const router = useRouter();
  const { navigateWithLoader } = useGlobalLoader();

  const toggleToolGroup = (group: string) => {
    setActiveToolGroup(activeToolGroup === group ? null : group);
  };

  const handlePremiumFeature = () => {
    setShowUpgradeModal(true);
  };

  const closeModal = () => {
    setShowUpgradeModal(false);
  };

  const handleSettings = () => {
    router.push("/profile?activityTab=settings");
  };

  const handlePNG = async () => {
    try {
      setIsExportingPNG(true);
      await exportAsPNG();
    } finally {
      setIsExportingPNG(false);
    }
  };

  const handlePDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportAsPDF();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const renderToolGroup = (group: string) => {
    switch (group) {
      case "export":
        return (
          <div className="absolute bottom-full mb-2 p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-xl flex gap-2">
            <button
              className="p-2 rounded-md transition-all hover:bg-purple-50 flex items-center gap-1 disabled:opacity-50"
              onClick={handlePNG}
              title="Export as PNG"
              disabled={isExportingPNG}
            >
              {isExportingPNG ? (
                <span className="text-sm text-[#9a2ff3]">Exporting...</span>
              ) : (
                <>
                  <FileImage size={20} color="#9a2ff3" />
                  <span className="text-sm text-[#9a2ff3]">PNG</span>
                </>
              )}
            </button>

            <button
              className="p-2 rounded-md transition-all hover:bg-purple-50 flex items-center gap-1 disabled:opacity-50"
              onClick={handlePDF}
              title="Export as PDF"
              disabled={isExportingPDF}
            >
              {isExportingPDF ? (
                <span className="text-sm text-[#9a2ff3]">Exporting...</span>
              ) : (
                <>
                  <FileText size={20} color="#9a2ff3" />
                  <span className="text-sm text-[#9a2ff3]">PDF</span>
                </>
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div id="canvas-toolbar" className="absolute sm:bottom-6 bottom-1 left-1/2 transform -translate-x-1/2 z-40 flex items-center justify-center">
        <div className="relative">
          {activeToolGroup && renderToolGroup(activeToolGroup)}
          <div
            className="flex items-center gap-1 p-2 bg-white/90 backdrop-blur-lg rounded-full shadow-lg border border-purple-100"
            style={{
              boxShadow: "0 10px 25px -5px rgba(147, 51, 234, 0.3)",
            }}
          >
            {/* AI Assistant */}
            <button
              className="p-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:from-fuchsia-600 hover:to-purple-600 transition-all duration-200"
              onClick={() => onToolSelect("geminiAI")}
              title="AI Assistant - Get Canvas Summary, Help & More"
            >
              <Bot size={20} />
            </button>

            {/* Shape Recognition Toggle */}
            <button
              className={cn(
                "p-3 rounded-full transition-all duration-200",
                shapeRecognitionEnabled
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-lg scale-105 animate-pulse"
                  : "bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600"
              )}
              onClick={toggleShapeRecognition}
              title={
                shapeRecognitionEnabled
                  ? "Disable Shape Recognition"
                  : "Enable Shape Recognition"
              }
            >
              {isShapeProcessing ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              ) : (
                <Shapes size={20} />
              )}
            </button>

            {/* Video Call */}
            <button
              className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
              onClick={() => onToolSelect("videoCall")}
              title="Video Call"
            >
              <Video size={20} />
            </button>

            {/* Templates */}
            <button
              className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 transition-all duration-200"
              onClick={() => onToolSelect("templates")}
              title="Templates"
            >
              <FileText size={20} />
            </button>

            {/* Export */}
            <button
              className="p-3 rounded-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-200"
              onClick={() => toggleToolGroup("export")}
              title="Export Options"
            >
              <Download size={20} />
            </button>

            {/* Premium Feature */}
            <button
              className="p-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 transition-all duration-200"
              onClick={handlePremiumFeature}
              title="Time Travel (Premium)"
            >
              <Clock size={20} />
            </button>

            {/* Settings */}
            <button
              className="p-3 rounded-full bg-[#962aef] hover:bg-[#a576ce] transition-all duration-200"
              onClick={() =>
                navigateWithLoader(router, "/profile?activityTab=settings")
              }
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal for Premium Features */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#962aef] rounded-xl p-6 max-w-md w-full mx-4 text-white">
            <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
            <p className="mb-4">
              This is a premium feature. Subscribe for just $5/month to access:
            </p>

            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Time-Travel: Log actions, replay canvas</li>
              <li>OCR: Convert handwriting to text</li>
              <li>Cloud Integrations: Google Drive, Slack</li>
              <li>Advanced Templates: Kanban, Mind Maps</li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
                onClick={closeModal}
              >
                Subscribe Now
              </button>
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                onClick={closeModal}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CanvasToolbar;


