import React, { useState, useCallback, useRef } from 'react';
import { Bot, Camera, Sparkles, Send, X, MessageCircle, Minimize2, Upload } from 'lucide-react';
import html2canvas from 'html2canvas';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isAnalysis?: boolean;
}

interface GeminiCanvasAnalyzerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  elements: any[];
  stickyNotes: any[];
  onClose: () => void;
}

interface GeminiAnalysisResponse {
  summary: string;
  insights: string[];
  suggestions: string[];
  elements_detected: {
    shapes: number;
    text_elements: number;
    sticky_notes: number;
    drawings: number;
  };
}

const GeminiCanvasAnalyzer: React.FC<GeminiCanvasAnalyzerProps> = ({
  canvasRef,
  elements,
  stickyNotes,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini API

  const geminiAPi:any = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log(geminiAPi)
  const genAI = new GoogleGenerativeAI(geminiAPi);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add a welcome message when the component mounts
  React.useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        content: 'Hello! I\'m your Gemini AI assistant. I can help you analyze your canvas, provide summaries, or analyze a screenshot you upload. Try uploading a screenshot or ask about your whiteboard!',
        timestamp: new Date(),
      }
    ]);
  }, []);

  const captureCanvas = useCallback(async (): Promise<string> => {
    try {
      if (!canvasRef.current) throw new Error('Canvas not available');
      
      const container = canvasRef.current.parentElement;
      if (!container) throw new Error('Canvas container not found');

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: container.offsetWidth,
        height: container.offsetHeight,
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing canvas:', error);
      throw new Error('Failed to capture canvas screenshot');
    }
  }, [canvasRef]);

  const analyzeCanvasWithGemini = useCallback(async (customPrompt?: string, uploadedFile?: File): Promise<GeminiAnalysisResponse> => {
    try {
      let imagePart: any;
      let canvasContext: any = {};

      if (uploadedFile) {
        // Validate file type and size
        if (!['image/png', 'image/jpeg'].includes(uploadedFile.type)) {
          throw new Error('Please upload a PNG or JPG image');
        }
        if (uploadedFile.size > 2 * 1024 * 1024) { // 2MB limit
          throw new Error('Image size exceeds 2MB limit');
        }

        // Convert uploaded file to Base64
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(uploadedFile);
        });
        const base64Data = base64Image.split(',')[1];
        imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: uploadedFile.type,
          },
        };
        canvasContext = { source: 'uploaded_screenshot' };
      } else {
        // Capture canvas and convert to Base64
        const screenshot = await captureCanvas();
        const base64Data = screenshot.split(',')[1];
        imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        };
        
        // Prepare context about the canvas
        canvasContext = {
          total_elements: elements.length,
          sticky_notes_count: stickyNotes.length,
          element_types: elements.reduce((acc, el) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          sticky_notes_content: stickyNotes.slice(0, 5).map(note => note.text).filter(Boolean),
        };
      }

      // Construct the prompt with context
      const prompt = customPrompt || 'Analyze this whiteboard canvas or screenshot and provide a comprehensive summary';
      const contextText = JSON.stringify(canvasContext);
      const fullPrompt = `${prompt}\n\nContext: ${contextText}`;

      // Call Gemini API
      const result = await model.generateContent([fullPrompt, imagePart]);
      const aiResponse = result.response.text();

      // Parse AI response into structured format
      return {
        summary: aiResponse || 'Analysis completed',
        insights: uploadedFile ? [
          'Visual elements detected in uploaded screenshot',
          'Content structure analyzed',
          'Key features identified'
        ] : [
          'Visual elements detected and analyzed',
          'Collaboration patterns identified',
          'Content structure evaluated'
        ],
        suggestions: uploadedFile ? [
          'Ensure high-resolution images for better analysis',
          'Consider adding annotations to highlight key areas',
          'Use consistent visual styles for clarity'
        ] : [
          'Consider organizing elements into logical groups',
          'Add more visual hierarchy with colors',
          'Use consistent spacing between elements'
        ],
        elements_detected: uploadedFile ? {
          shapes: 0, // AI would need to detect these
          text_elements: 0,
          sticky_notes: 0,
          drawings: 0,
        } : {
          shapes: canvasContext.element_types.rectangle || 0 + canvasContext.element_types.circle || 0,
          text_elements: canvasContext.element_types.text || 0,
          sticky_notes: canvasContext.sticky_notes_count,
          drawings: canvasContext.element_types.path || 0,
        }
      };
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw error;
    }
  }, [captureCanvas, elements, stickyNotes]);

  const handleQuickAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeCanvasWithGemini();
      
      const analysisMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: analysis.summary,
        timestamp: new Date(),
        isAnalysis: true,
      };
      
      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Sorry, I couldn't analyze the canvas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScreenshotUpload = async () => {
    if (fileInputRef.current?.files?.[0]) {
      setIsAnalyzing(true);
      try {
        const file = fileInputRef.current.files[0];
        const analysis = await analyzeCanvasWithGemini('Analyze this uploaded screenshot and provide a comprehensive summary', file);
        
        const analysisMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: analysis.summary,
          timestamp: new Date(),
          isAnalysis: true,
        };
        
        setMessages(prev => [...prev, analysisMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `Sorry, I couldn't analyze the screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAnalyzing(true);
    
    try {
      const analysis = await analyzeCanvasWithGemini(inputMessage);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: analysis.summary,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Sorry, I couldn't process your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-5 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
        >
          <Bot size={24} />
          <span>Open AI Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-5 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-50 transition-all duration-300 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h3 className="font-medium">Gemini AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Minimize"
          >
            <Minimize2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleQuickAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Analyze Canvas</span>
            </>
          )}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors disabled:opacity-50"
        >
          <Upload size={16} />
          <span>Upload Screenshot</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleScreenshotUpload}
          accept="image/png,image/jpeg"
          className="hidden"
        />
        <button
          onClick={() => {
            setMessages([
              {
                id: 'help',
                type: 'ai',
                content: 'I can help you with:\n\n• Summarizing your whiteboard content\n• Analyzing uploaded screenshots\n• Identifying patterns and relationships\n• Suggesting improvements\n• Answering questions about your canvas',
                timestamp: new Date(),
              }
            ]);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <MessageCircle size={16} />
          <span>Help</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900/30">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${message.type === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-bl-none'
                } ${message.isAnalysis ? 'space-y-2' : ''}`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
              <div
                className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your canvas or screenshot..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isAnalyzing}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
          >
            {isAnalyzing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiCanvasAnalyzer;