'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const WhiteboardFeatureDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  
  // Initialize GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial animation for the demo container
      gsap.from(demoRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });
    }, demoRef);
    
    return () => ctx.revert();
  }, []);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial drawing style
    ctx.strokeStyle = 'var(--primary)';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
  }, []);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    setLastX(x);
    setLastY(y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastX(x);
    setLastY(y);
    
    // If smart drawing assistance is active, show the effect
    if (activeFeature === 'drawing') {
      showDrawingAssistance(x, y);
    }
    
    // If object recognition is active, show the effect
    if (activeFeature === 'recognition' && Math.random() > 0.9) {
      showObjectRecognition(x, y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  // Feature demonstration functions
  const showVoiceCommand = () => {
    setActiveFeature('voice');
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Show voice command animation
    const voiceIndicator = document.createElement('div');
    voiceIndicator.className = 'voice-indicator';
    demoRef.current?.appendChild(voiceIndicator);
    
    // Animate voice waves
    gsap.to(voiceIndicator, {
      scale: 1.5,
      opacity: 0,
      duration: 1.5,
      repeat: 3,
      onComplete: () => {
        voiceIndicator.remove();
        
        // Draw a circle as if commanded by voice
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 50;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'var(--primary)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add text to show the command
        ctx.font = '16px var(--font-geist-sans)';
        ctx.fillStyle = 'var(--primary)';
        ctx.textAlign = 'center';
        ctx.fillText('"Draw a circle"', centerX, centerY - 70);
        
        setTimeout(() => setActiveFeature(null), 2000);
      }
    });
  };
  
  const showObjectRecognition = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Create a recognition effect
    const recognitionEffect = document.createElement('div');
    recognitionEffect.className = 'recognition-effect';
    recognitionEffect.style.left = `${x}px`;
    recognitionEffect.style.top = `${y}px`;
    demoRef.current?.appendChild(recognitionEffect);
    
    // Animate the recognition effect
    gsap.to(recognitionEffect, {
      scale: 1.5,
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        recognitionEffect.remove();
      }
    });
  };
  
  const showDrawingAssistance = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create sparkle effects for drawing assistance
    if (Math.random() > 0.7) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-effect';
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      demoRef.current?.appendChild(sparkle);
      
      // Animate the sparkle
      gsap.to(sparkle, {
        scale: 0,
        opacity: 0,
        y: '-=20',
        duration: 0.6,
        onComplete: () => {
          sparkle.remove();
        }
      });
    }
  };
  
  const showVideoCall = () => {
    setActiveFeature('video');
    
    // Create video call interface
    const videoInterface = document.createElement('div');
    videoInterface.className = 'video-interface';
    demoRef.current?.appendChild(videoInterface);
    
    // Animate the video interface appearing
    gsap.from(videoInterface, {
      scale: 0.8,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
      onComplete: () => {
        // Add user avatars with delay
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const userAvatar = document.createElement('div');
            userAvatar.className = 'user-avatar';
            userAvatar.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/><circle cx="50" cy="100" r="40" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/></svg>')`;
            videoInterface.appendChild(userAvatar);
            
            gsap.from(userAvatar, {
              scale: 0,
              opacity: 0,
              duration: 0.3,
              ease: 'back.out(1.7)'
            });
          }, i * 500);
        }
        
        // Remove after demonstration
        setTimeout(() => {
          gsap.to(videoInterface, {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
              videoInterface.remove();
              setActiveFeature(null);
            }
          });
        }, 4000);
      }
    });
  };
  
  const showRealtimeCollab = () => {
    setActiveFeature('collab');
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Create a cursor for simulated collaborator
    const collaboratorCursor = document.createElement('div');
    collaboratorCursor.className = 'collaborator-cursor';
    demoRef.current?.appendChild(collaboratorCursor);
    
    // Animate the cursor movement
    const path = [
      { x: canvas.width * 0.2, y: canvas.height * 0.2 },
      { x: canvas.width * 0.8, y: canvas.height * 0.2 },
      { x: canvas.width * 0.8, y: canvas.height * 0.8 },
      { x: canvas.width * 0.2, y: canvas.height * 0.8 },
      { x: canvas.width * 0.2, y: canvas.height * 0.2 }
    ];
    
    // Position cursor at start
    gsap.set(collaboratorCursor, {
      left: path[0].x,
      top: path[0].y,
      opacity: 1,
      scale: 1
    });
    
    // Draw path with the cursor
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    
    // Animate along the path
    let currentPoint = 0;
    const drawNextSegment = () => {
      if (currentPoint >= path.length - 1) {
        // Finish animation
        gsap.to(collaboratorCursor, {
          opacity: 0,
          scale: 0,
          duration: 0.5,
          onComplete: () => {
            collaboratorCursor.remove();
            setActiveFeature(null);
          }
        });
        return;
      }
      
      const startX = path[currentPoint].x;
      const startY = path[currentPoint].y;
      const endX = path[currentPoint + 1].x;
      const endY = path[currentPoint + 1].y;
      
      // Animate cursor movement
      gsap.to(collaboratorCursor, {
        left: endX,
        top: endY,
        duration: 1,
        ease: 'power1.inOut',
        onUpdate: function() {
          // Get current position of the cursor during animation
          const progress = this.progress();
          const currentX = startX + (endX - startX) * progress;
          const currentY = startY + (endY - startY) * progress;
          
          // Draw line as cursor moves
          ctx.lineTo(currentX, currentY);
          ctx.stroke();
        },
        onComplete: () => {
          currentPoint++;
          drawNextSegment();
        }
      });
    };
    
    drawNextSegment();
  };

  return (
    <div ref={demoRef} className="whiteboard-feature-demo glass-card p-6 rounded-xl relative overflow-hidden" style={{ minHeight: '400px' }}>
      <h3 className="text-2xl font-semibold mb-4 gradient-text text-center">Interactive Feature Demo</h3>
      
      {/* Feature selection buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button 
          onClick={showVoiceCommand}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFeature === 'voice' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--glass-bg)] hover:bg-[var(--primary-light)] hover:text-white'}`}
          disabled={!!activeFeature}
        >
          Voice Commands
        </button>
        <button 
          onClick={() => setActiveFeature('recognition')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFeature === 'recognition' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--glass-bg)] hover:bg-[var(--primary-light)] hover:text-white'}`}
          disabled={!!activeFeature}
        >
          Smart Object Recognition
        </button>
        <button 
          onClick={() => setActiveFeature('drawing')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFeature === 'drawing' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--glass-bg)] hover:bg-[var(--primary-light)] hover:text-white'}`}
          disabled={!!activeFeature}
        >
          Smart Drawing Assistance
        </button>
        <button 
          onClick={showVideoCall}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFeature === 'video' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--glass-bg)] hover:bg-[var(--primary-light)] hover:text-white'}`}
          disabled={!!activeFeature}
        >
          Video Calling
        </button>
        <button 
          onClick={showRealtimeCollab}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFeature === 'collab' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--glass-bg)] hover:bg-[var(--primary-light)] hover:text-white'}`}
          disabled={!!activeFeature}
        >
          Real-time Collaboration
        </button>
      </div>
      
      {/* Instructions */}
      <p className="text-center text-sm mb-4 opacity-80">
        {activeFeature === 'voice' && 'Voice command demonstration in progress...'}
        {activeFeature === 'recognition' && 'Draw on the canvas to see smart object recognition in action'}
        {activeFeature === 'drawing' && 'Draw on the canvas to see smart drawing assistance in action'}
        {activeFeature === 'video' && 'Video call demonstration in progress...'}
        {activeFeature === 'collab' && 'Real-time collaboration demonstration in progress...'}
        {!activeFeature && 'Select a feature to see it in action'}
      </p>
      
      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        className="w-full bg-white rounded-lg shadow-inner"
        style={{ height: '250px', touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {/* Reset button */}
      {activeFeature && (
        <button 
          onClick={() => {
            setActiveFeature(null);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }}
          className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition-all mx-auto block"
        >
          Reset Demo
        </button>
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        .voice-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--primary-light) 0%, transparent 70%);
          opacity: 0.7;
        }
        
        .recognition-effect {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary-light);
          transform: translate(-50%, -50%);
          opacity: 0.7;
        }
        
        .sparkle-effect {
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--primary);
          transform: translate(-50%, -50%) rotate(45deg);
          opacity: 0.7;
        }
        
        .video-interface {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 120px;
          height: 80px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        
        .user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-size: cover;
          border: 2px solid white;
        }
        
        .collaborator-cursor {
          position: absolute;
          width: 15px;
          height: 15px;
          background: var(--primary);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          pointer-events: none;
        }
        
        .collaborator-cursor::after {
          content: 'User 2';
          position: absolute;
          top: -20px;
          left: 0;
          font-size: 12px;
          white-space: nowrap;
          color: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default WhiteboardFeatureDemo;
