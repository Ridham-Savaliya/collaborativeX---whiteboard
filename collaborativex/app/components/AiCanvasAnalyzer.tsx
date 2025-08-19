'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Upload,
  Download,
  Volume2,
  VolumeX,
  FileText,
  Lightbulb,
  Target,
  Clock,
  BookOpen,
  Settings,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  Eye,
  Brain,
  MessageCircle,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isAnalysis?: boolean;
  analysisType?: 'summary' | 'insights' | 'suggestions' | 'action-items' | 'meeting-notes' | 'chat';
  metadata?: {
    elements_detected?: number;
    confidence_score?: number;
    processing_time?: number;
    word_count?: number;
    screenshot_used?: boolean;
  };
}

interface EnhancedGeminiAnalyzerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  elements: any[];
  stickyNotes: any[];
  onClose: () => void;
}

interface AnalysisResult {
  summary: string;
  insights: string[];
  suggestions: string[];
  actionItems: string[];
  meetingNotes: string;
  chatResponse: string;
  elements_detected: {
    shapes: number;
    text_elements: number;
    sticky_notes: number;
    drawings: number;
    connections: number;
  };
  confidence_score: number;
  key_themes: string[];
  collaboration_patterns: string[];
}

const EnhancedGeminiAnalyzer: React.FC<EnhancedGeminiAnalyzerProps> = ({
  canvasRef,
  elements,
  stickyNotes,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentAnalysisType, setCurrentAnalysisType] = useState<'summary' | 'insights' | 'suggestions' | 'action-items' | 'meeting-notes' | 'chat'>('chat');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Gemini API
  const geminiAPI = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const genAI = geminiAPI ? new GoogleGenerativeAI(geminiAPI) : null;
  const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  // Welcome message
  useEffect(() => {
    const welcomeMessage = geminiAPI ?
      `🤖 **Hi! I'm your AI Assistant** \n\nI can help you with:\n• General questions and conversations\n• Screen analysis of your whiteboard\n• Creating summaries and insights\n• And much more!\n\nJust type your question or click "Analyze Screen" to get started! 🚀` :
      `🤖 **Hi! I'm your AI Assistant** \n\n⚠️ **Setup Required**: Please add your Gemini API key to use AI features.\n\nI can still help with:\n• Basic responses\n• Interface guidance\n• Feature explanations\n\nAdd your API key in the environment variables to unlock full AI capabilities! 🔑`;

    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
        analysisType: 'chat',
        metadata: {
          confidence_score: 100,
          processing_time: 0
        }
      }
    ]);
  }, [geminiAPI]);

  // Auto-analyze when elements or stickyNotes change, only for summary
  useEffect(() => {
    if (autoAnalyze && currentAnalysisType === 'summary' && elements.length > 0) {
      handleAutoAnalyze();
    }
  }, [elements, stickyNotes, autoAnalyze, currentAnalysisType]);

  // Enhanced screen capture function - captures the specific canvas element
  const captureScreenshot = useCallback(async (): Promise<string> => {
    try {
      console.log('Capturing canvas screenshot...');

      if (!canvasRef.current) {
        throw new Error('Canvas element not available');
      }

      // Capture only the canvas element
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 0.8, // Reduce scale for better performance
        logging: false,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 3000,
      });

      const dataURL = canvas.toDataURL('image/png', 0.8);

      if (dataURL && dataURL.length > 100) {
        console.log('Screen capture successful');
        return dataURL;
      } else {
        throw new Error('Screenshot capture returned empty data');
      }
    } catch (error) {
      console.error('Screen capture failed:', error);
      throw new Error('Failed to capture screen - please try uploading an image instead');
    }
  }, [canvasRef]);

  // Check if the user's message requires visual analysis
  const requiresVisualAnalysis = useCallback((message: string): boolean => {
    const visualKeywords = [
      'see', 'look', 'visual', 'image', 'screenshot', 'screen', 'display',
      'show', 'canvas', 'drawing', 'diagram', 'whiteboard', 'board',
      'visible', 'color', 'shape', 'layout', 'design', 'structure', 'appearance',
      'analyze', 'what do you see', 'describe', 'examine', 'what\'s on', 'what is on'
    ];

    const lowerMessage = message.toLowerCase();
    return visualKeywords.some(keyword => lowerMessage.includes(keyword));
  }, []);

  const analyzeWithGemini = useCallback(async (
    prompt: string,
    analysisType: 'summary' | 'insights' | 'suggestions' | 'action-items' | 'meeting-notes' | 'chat' = 'chat',
    uploadedFile?: File,
    forceScreenshot: boolean = false
  ): Promise<AnalysisResult> => {
    const startTime = Date.now();

    try {
      // Check if API is available
      if (!model || !geminiAPI) {
        throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
      }

      let imagePart: any;
      let screenshotUsed = false;

      // Determine if we need a screenshot
      const needsScreenshot = forceScreenshot ||
        uploadedFile ||
        analysisType === 'summary' ||
        requiresVisualAnalysis(prompt);

      if (needsScreenshot) {
        if (uploadedFile) {
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(uploadedFile.type)) {
            throw new Error('Please upload a PNG, JPG, or WebP image');
          }
          if (uploadedFile.size > 4 * 1024 * 1024) {
            throw new Error('Image size exceeds 4MB limit');
          }

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
          screenshotUsed = true;
        } else {
          try {
            const screenshot = await captureScreenshot();
            const base64Data = screenshot.split(',')[1];
            imagePart = {
              inlineData: {
                data: base64Data,
                mimeType: 'image/png',
              },
            };
            screenshotUsed = true;
          } catch (error) {
            console.warn('Screenshot capture failed, proceeding with text-only:', error);
            screenshotUsed = false;
          }
        }
      }

      // Simplified and more effective prompts
      const prompts = {
        summary: `Analyze this whiteboard/canvas image and provide a brief, clear summary of what you see. Include the main elements, content, and overall purpose in 2-3 sentences.`,

        insights: `Look at this image and provide 3-4 key insights or observations. Format as bullet points, focusing on important patterns, themes, or notable elements you observe.`,

        suggestions: `Based on what you see in this image, provide 3-4 practical suggestions for improvement or next steps. Format as bullet points with actionable advice.`,

        'action-items': `Identify specific action items or tasks from this image. Format as bullet points with priority levels (High/Medium/Low) and brief descriptions.`,

        'meeting-notes': `Create structured meeting notes from this image. Include: Objectives, Key Points Discussed, Decisions Made, and Next Steps.`,

        chat: `You are a helpful AI assistant for a collaborative whiteboard application. You can answer questions about anything - from general topics to specific help with the whiteboard features. Be conversational, helpful, and concise. If users ask about what they can see on their screen, let them know you'd need them to use the "Analyze Screen" feature or ask a specific question about the visual content.

Always aim to be:
- Friendly and approachable
- Clear and concise  
- Helpful and informative
- Professional but not overly formal

If someone asks a general question, answer it directly. If they want to know about their whiteboard content, suggest using the analyze feature.`
      };

      // Create the appropriate prompt
      let finalPrompt: string;

      if (analysisType === 'chat') {
        // For chat, if user asks about visual content but we don't have screenshot, guide them
        if (requiresVisualAnalysis(prompt) && !screenshotUsed) {
          finalPrompt = `${prompts.chat}\n\nUser question: "${prompt}"\n\nNote: The user seems to be asking about visual content. Since no image was provided, suggest they use the "Analyze Screen" button to capture their whiteboard first, or clarify what specific help they need.`;
        } else {
          finalPrompt = `${prompts.chat}\n\nUser question: "${prompt}"`;
        }
      } else {
        // For analysis modes, use the specific prompt
        finalPrompt = prompt.length > 20 ? `${prompts[analysisType]} Focus on: ${prompt}` : prompts[analysisType];
      }

      let result;
      try {
        result = await model.generateContent(imagePart ? [finalPrompt, imagePart] : [finalPrompt]);
      } catch (apiError: any) {
        console.warn('Gemini API call failed:', apiError);

        // Better error handling with specific messages
        if (apiError?.message?.includes('API_KEY')) {
          throw new Error('Invalid API key. Please check your Gemini API key configuration.');
        } else if (apiError?.message?.includes('QUOTA')) {
          throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
        } else if (apiError?.message?.includes('SAFETY')) {
          throw new Error('Content was flagged by safety filters. Please try rephrasing your request.');
        } else {
          throw new Error(`API Error: ${apiError?.message || 'Unknown API error occurred'}`);
        }
      }

      const aiResponse = result.response.text();
      const processingTime = Date.now() - startTime;
      const wordCount = aiResponse.split(' ').length;
      const confidenceScore = Math.min(95, screenshotUsed ? 85 + Math.min(10, wordCount / 10) : 70 + Math.min(15, wordCount / 15));

      const analysisResult: AnalysisResult = {
        summary: analysisType === 'summary' ? aiResponse : '',
        insights: analysisType === 'insights' ? [aiResponse] : [],
        suggestions: analysisType === 'suggestions' ? [aiResponse] : [],
        actionItems: analysisType === 'action-items' ? [aiResponse] : [],
        meetingNotes: analysisType === 'meeting-notes' ? aiResponse : '',
        chatResponse: analysisType === 'chat' ? aiResponse : '',
        elements_detected: {
          shapes: Math.floor(elements.length * 0.3),
          text_elements: Math.floor(elements.length * 0.4),
          sticky_notes: stickyNotes.length,
          drawings: Math.floor(elements.length * 0.2),
          connections: Math.floor(elements.length * 0.1)
        },
        confidence_score: confidenceScore,
        key_themes: ['Analysis'],
        collaboration_patterns: ['Digital workspace']
      };

      if (analysisType !== 'chat') {
        setAnalysisHistory(prev => [analysisResult, ...prev.slice(0, 9)]);
      }

      return analysisResult;
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw error;
    }
  }, [captureScreenshot, elements, stickyNotes, requiresVisualAnalysis, model, geminiAPI]);

  // Handle the Analyze button click - always captures screen
  const handleAutoAnalyze = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      // Force screenshot capture for analyze button
      const analysis = await analyzeWithGemini('', currentAnalysisType, undefined, true);

      const getAnalysisContent = () => {
        switch (currentAnalysisType) {
          case 'summary': return analysis.summary;
          case 'insights': return analysis.insights.join('\n');
          case 'suggestions': return analysis.suggestions.join('\n');
          case 'action-items': return analysis.actionItems.join('\n');
          case 'meeting-notes': return analysis.meetingNotes;
          default: return analysis.summary;
        }
      };

      const analysisMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: getAnalysisContent(),
        timestamp: new Date(),
        isAnalysis: true,
        analysisType: currentAnalysisType,
        metadata: {
          elements_detected: Object.values(analysis.elements_detected).reduce((a, b) => a + b, 0),
          confidence_score: analysis.confidence_score,
          processing_time: 2.0,
          word_count: getAnalysisContent().split(' ').length,
          screenshot_used: true
        }
      };

      setMessages(prev => [...prev, analysisMessage]);

      if (isVoiceEnabled) {
        speakMessage(analysisMessage.content);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Analysis Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: {
          confidence_score: 0
        }
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentAnalysisType, analyzeWithGemini, isVoiceEnabled, isAnalyzing]);

  const handleScreenshotUpload = async () => {
    if (fileInputRef.current?.files?.[0]) {
      setIsAnalyzing(true);
      try {
        const file = fileInputRef.current.files[0];
        const analysis = await analyzeWithGemini('Analyze this uploaded image in detail', 'summary', file);

        const analysisMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `📸 **Uploaded Image Analysis:**\n\n${analysis.summary}`,
          timestamp: new Date(),
          isAnalysis: true,
          analysisType: 'summary',
          metadata: {
            elements_detected: Object.values(analysis.elements_detected).reduce((a, b) => a + b, 0),
            confidence_score: analysis.confidence_score,
            word_count: analysis.summary.split(' ').length,
            screenshot_used: true
          }
        };

        setMessages(prev => [...prev, analysisMessage]);

        if (isVoiceEnabled) {
          speakMessage(analysisMessage.content);
        }
      } catch (error) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `❌ Upload Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Handle normal chat messages - smart about when to use screenshots
  const handleSendMessage = async () => {
    if (!inputMessage || isAnalyzing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsAnalyzing(true);

    try {
      // For normal chat, use 'chat' mode unless user specifically asks for visual analysis
      const actualAnalysisType = requiresVisualAnalysis(currentInput) && currentAnalysisType !== 'chat' ?
        currentAnalysisType : 'chat';

      const analysis = await analyzeWithGemini(currentInput, actualAnalysisType);

      const responseContent = actualAnalysisType === 'chat' ?
        analysis.chatResponse :
        (() => {
          switch (actualAnalysisType) {
            case 'summary': return analysis.summary;
            case 'insights': return analysis.insights.join('\n');
            case 'suggestions': return analysis.suggestions.join('\n');
            case 'action-items': return analysis.actionItems.join('\n');
            case 'meeting-notes': return analysis.meetingNotes;
            default: return analysis.chatResponse;
          }
        })();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
        analysisType: actualAnalysisType,
        isAnalysis: actualAnalysisType !== 'chat',
        metadata: {
          confidence_score: analysis.confidence_score,
          word_count: responseContent.split(' ').length,
          screenshot_used: requiresVisualAnalysis(currentInput)
        }
      };

      setMessages(prev => [...prev, aiResponse]);

      if (isVoiceEnabled) {
        speakMessage(aiResponse.content);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your question.`,
        timestamp: new Date(),
        analysisType: 'chat'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Allow all other keys to work normally (including space)
  };

  // Fixed input handlers - completely simplified
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter' && !e.shiftKey && !isAnalyzing) {
  //     e.preventDefault();
  //     handleSendMessage();
  //   }
  //   // Allow all other keys including space to work normally
  // };

  const speakMessage = (text: string) => {
    if (!speechSynthesis.current) return;

    if (isSpeaking) {
      speechSynthesis.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, '').replace(/\n/g, '. ').replace(/❌|🤖|📸|✨|🚀|⚠️|🔑/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.current.speak(utterance);
  };

  const copyToClipboard = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const exportAnalysis = () => {
    const analysisData = {
      timestamp: new Date().toISOString(),
      canvas_elements: elements.length,
      sticky_notes: stickyNotes.length,
      messages: messages.map(m => ({
        type: m.type,
        content: m.content,
        timestamp: m.timestamp,
        metadata: m.metadata
      })),
      analysis_history: analysisHistory.slice(0, 5)
    };

    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const analysisTypes = [
    { id: 'chat', icon: <MessageCircle size={14} />, label: 'Chat', color: 'text-green-600 dark:text-green-400', description: 'Normal conversation' },
    { id: 'summary', icon: <FileText size={14} />, label: 'Summary', color: 'text-blue-600 dark:text-blue-400', description: 'Screen analysis' },
    { id: 'insights', icon: <Lightbulb size={14} />, label: 'Insights', color: 'text-amber-600 dark:text-amber-400', description: 'Strategic patterns' },
    { id: 'suggestions', icon: <Target size={14} />, label: 'Tips', color: 'text-green-600 dark:text-green-400', description: 'Improvements' },
    { id: 'action-items', icon: <Clock size={14} />, label: 'Actions', color: 'text-red-600 dark:text-red-400', description: 'Next steps' },
    { id: 'meeting-notes', icon: <BookOpen size={14} />, label: 'Notes', color: 'text-purple-600 dark:text-purple-400', description: 'Meeting recap' },
  ];

  // Minimized state
  if (isMinimized) {
    return (
      <div className={`fixed z-50 ${isMobile ? 'bottom-4 right-4' : 'bottom-20 right-5'}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="relative">
            <Bot size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          {!isMobile && (
            <div>
              <div className="font-semibold text-sm">AI Assistant</div>
              <div className="text-xs opacity-90">Click to chat</div>
            </div>
          )}
        </button>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col" data-ai-chat>
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot size={20} />
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <div className="text-xs opacity-90">Chat & Screen Analysis</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Analysis Type Selector */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-custom">
            {analysisTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setCurrentAnalysisType(type.id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${currentAnalysisType === type.id
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">Voice Response</span>
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`w-10 h-5 rounded-full transition-colors ${isVoiceEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${isVoiceEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Auto-Analyze</span>
              <button
                onClick={() => setAutoAnalyze(!autoAnalyze)}
                className={`w-10 h-5 rounded-full transition-colors ${autoAnalyze ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${autoAnalyze ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAutoAnalyze}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span className="text-sm">Analyze Screen</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} />
              <span className="text-sm">Upload</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              onClick={() => speakMessage(messages[messages.length - 1]?.content || '')}
              className="flex items-center justify-center gap-1 p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isSpeaking ? 'Stop' : 'Speak'}</span>
            </button>

            <button
              onClick={exportAnalysis}
              className="flex items-center justify-center gap-1 p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <button
              onClick={() => setMessages([messages[0]])}
              className="flex items-center justify-center gap-1 p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw size={14} />
              <span>Clear</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleScreenshotUpload}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-custom">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl transition-all ${message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                  : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                  } ${message.isAnalysis ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
              >
                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </div>

                {message.metadata && (
                  <div className={`mt-2 pt-2 border-t ${message.type === 'user' ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'} flex items-center justify-between text-xs`}>
                    <div className="flex items-center gap-2">
                      {message.metadata.confidence_score && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={10} />
                          {message.metadata.confidence_score.toFixed(0)}%
                        </span>
                      )}
                      {message.metadata.screenshot_used && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <Eye size={10} />
                          Screen
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className={`mt-2 flex items-center justify-between text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  <span>{formatTimestamp(message.timestamp)}</span>

                  {message.type === 'ai' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(message.id, message.content)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        {copiedMessageId === message.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={() => speakMessage(message.content)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
          

              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Brain size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage || isAnalyzing}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>AI Ready</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={12} />
                <span>{currentAnalysisType === 'chat' ? 'Chat Mode' : `${currentAnalysisType} Mode`}</span>
              </div>
              {isVoiceEnabled && (
                <div className="flex items-center gap-1">
                  <Volume2 size={12} />
                  <span>Voice On</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="fixed bottom-20 right-5 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-50 animate-slide-in" data-ai-chat>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot size={20} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <div className="text-xs opacity-90">Chat & Screen Analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Analysis Type Selector */}
        <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-custom">
          {analysisTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setCurrentAnalysisType(type.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${currentAnalysisType === type.id
                ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              title={type.description}
            >
              {type.icon}
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-700 dark:text-gray-300">Voice Response</span>
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`w-10 h-5 rounded-full transition-colors ${isVoiceEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${isVoiceEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Auto-Analyze Summary</span>
            <button
              onClick={() => setAutoAnalyze(!autoAnalyze)}
              className={`w-10 h-5 rounded-full transition-colors ${autoAnalyze ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${autoAnalyze ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAutoAnalyze}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Working...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span className="text-sm">Analyze Screen</span>
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={16} />
            <span className="text-sm">Upload</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => speakMessage(messages[messages.length - 1]?.content || '')}
            className="flex items-center justify-center gap-1 p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? 'Stop' : 'Speak'}</span>
          </button>

          <button
            onClick={exportAnalysis}
            className="flex items-center justify-center gap-1 p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          <button
            onClick={() => setMessages([messages[0]])}
            className="flex items-center justify-center gap-1 p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw size={14} />
            <span>Clear</span>
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleScreenshotUpload}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-custom">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl transition-all hover:shadow-lg ${message.type === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                } ${message.isAnalysis ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
            >
              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </div>

              {message.metadata && (
                <div className={`mt-2 pt-2 border-t ${message.type === 'user' ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'} flex items-center justify-between text-xs`}>
                  <div className="flex items-center gap-3">
                    {message.metadata.confidence_score && (
                      <div className="flex items-center gap-1">
                        <TrendingUp size={10} />
                        <span>{message.metadata.confidence_score.toFixed(0)}%</span>
                      </div>
                    )}
                    {message.metadata.screenshot_used && (
                      <div className="flex items-center gap-1 text-blue-500">
                        <Eye size={10} />
                        <span>Visual</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={`mt-2 flex items-center justify-between text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                <span>{formatTimestamp(message.timestamp)}</span>

                {message.type === 'ai' && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(message.id, message.content)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Copy"
                    >
                      {copiedMessageId === message.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={() => speakMessage(message.content)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Read aloud"
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything or request screen analysis..."
              className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={isAnalyzing}
            />

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Brain size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage || isAnalyzing}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>AI Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={12} />
              <span>{currentAnalysisType === 'chat' ? 'Chat Mode' : `${currentAnalysisType} Mode`}</span>
            </div>
            {isVoiceEnabled && (
              <div className="flex items-center gap-1">
                <Volume2 size={12} />
                <span>Voice On</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Press Enter to send
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGeminiAnalyzer;