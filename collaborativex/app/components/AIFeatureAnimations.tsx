'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AIFeatureAnimations = () => {
  // Refs for animation targets
  const sectionRef = useRef<HTMLDivElement>(null);
  const voiceCommandRef = useRef<HTMLDivElement>(null);
  const objectRecognitionRef = useRef<HTMLDivElement>(null);
  const drawingAssistanceRef = useRef<HTMLDivElement>(null);
  const videoCallingRef = useRef<HTMLDivElement>(null);
  const realtimeCollabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize animations when component mounts
    const ctx = gsap.context(() => {
      // Voice Commands Animation
      const voiceTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: voiceCommandRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        }
      });
      
      voiceTimeline
        .from(voiceCommandRef.current, { 
          opacity: 0, 
          y: 50, 
          duration: 0.8,
          ease: 'power3.out'
        })
        .to(voiceCommandRef.current?.querySelector('.icon-container'), {
          rotation: 360,
          scale: 1.2,
          duration: 1,
          ease: 'elastic.out(1, 0.3)'
        }, '-=0.4')
        .from(voiceCommandRef.current?.querySelector('.voice-wave'), {
          width: 0,
          opacity: 0,
          duration: 1.2,
          stagger: 0.1,
          ease: 'power2.out'
        }, '-=0.8');

      // Smart Object Recognition Animation
      const objectTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: objectRecognitionRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        }
      });
      
      objectTimeline
        .from(objectRecognitionRef.current, { 
          opacity: 0, 
          y: 50, 
          duration: 0.8,
          ease: 'power3.out'
        })
        .to(objectRecognitionRef.current?.querySelector('.icon-container'), {
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.8)',
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        }, '-=0.4')
        .from(objectRecognitionRef.current?.querySelector('.shape-morph'), {
          scale: 0,
          opacity: 0,
          duration: 0.8,
          ease: 'back.out(1.7)'
        }, '-=0.8');

      // Smart Drawing Assistance Animation
      const drawingTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: drawingAssistanceRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        }
      });
      
      drawingTimeline
        .from(drawingAssistanceRef.current, { 
          opacity: 0, 
          y: 50, 
          duration: 0.8,
          ease: 'power3.out'
        })
        .from(drawingAssistanceRef.current?.querySelector('.drawing-path'), {
          strokeDashoffset: 1000,
          duration: 2,
          ease: 'power2.out'
        }, '-=0.4')
        .to(drawingAssistanceRef.current?.querySelector('.sparkle'), {
          scale: 1.5,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut'
        }, '-=1.5');

      // Video Calling Animation
      const videoTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: videoCallingRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        }
      });
      
      videoTimeline
        .from(videoCallingRef.current, { 
          opacity: 0, 
          y: 50, 
          duration: 0.8,
          ease: 'power3.out'
        })
        .from(videoCallingRef.current?.querySelector('.video-screen'), {
          scale: 0.8,
          opacity: 0,
          duration: 1,
          ease: 'back.out(1.7)'
        }, '-=0.4')
        .from(videoCallingRef.current?.querySelector('.video-wave'), {
          scale: 0,
          opacity: 0,
          duration: 0.8,
          repeat: -1,
          repeatDelay: 1,
          ease: 'power2.out'
        }, '-=0.6');

      // Real-time Collaboration Animation
      const collabTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: realtimeCollabRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        }
      });
      
      collabTimeline
        .from(realtimeCollabRef.current, { 
          opacity: 0, 
          y: 50, 
          duration: 0.8,
          ease: 'power3.out'
        })
        .from(realtimeCollabRef.current?.querySelectorAll('.collab-user'), {
          x: -30,
          opacity: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: 'back.out(1.7)'
        }, '-=0.4')
        .to(realtimeCollabRef.current?.querySelector('.collab-pulse'), {
          scale: 1.5,
          opacity: 0,
          duration: 1.5,
          repeat: -1,
          ease: 'power2.out'
        }, '-=0.8');

      // Main section entrance animation
      gsap.from(sectionRef.current, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
    }, sectionRef);

    // Cleanup function
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="ai-features" className="py-20 bg-[var(--background)] bg-opacity-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 gradient-text">AI-Powered Innovation</h2>
        <p className="text-center text-lg opacity-80 mb-16 max-w-2xl mx-auto">Experience the future of whiteboarding with our cutting-edge AI features.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary-light)] to-transparent opacity-5 blur-3xl -z-10"></div>
          
          {/* Voice Commands */}
          <div ref={voiceCommandRef} className="glass-card hover-lift p-8 rounded-xl transform transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className="icon-container text-5xl mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-12 relative">
              🎤
              <div className="flex space-x-1 absolute -right-2 top-0">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`voice-wave h-${i*2} w-1 bg-[var(--primary)] rounded-full`}
                    style={{ height: `${i*4}px` }}
                  ></div>
                ))}
              </div>
            </div>
            <h3 className="text-2xl font-semibold mb-3 gradient-text">Voice Commands</h3>
            <p className="opacity-80 smooth-transition">Control your whiteboard using natural voice instructions</p>
          </div>
          
          {/* Smart Object Recognition */}
          <div ref={objectRecognitionRef} className="glass-card hover-lift p-8 rounded-xl transform transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className="icon-container text-5xl mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-12 relative">
              🔍
              <div className="shape-morph absolute -right-2 -top-2 w-6 h-6 bg-[var(--primary-light)] rounded-md opacity-70"></div>
            </div>
            <h3 className="text-2xl font-semibold mb-3 gradient-text">Smart Object Recognition</h3>
            <p className="opacity-80 smooth-transition">Convert hand-drawn shapes into perfect geometric forms</p>
          </div>
          
          {/* Smart Drawing Assistance */}
          <div ref={drawingAssistanceRef} className="glass-card hover-lift p-8 rounded-xl transform transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className="icon-container text-5xl mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-12 relative">
              ✨
              <svg className="absolute top-0 right-0 w-full h-full" viewBox="0 0 100 100" fill="none">
                <path 
                  className="drawing-path" 
                  d="M20,50 Q35,20 50,50 Q65,80 80,50" 
                  stroke="var(--primary)" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="1000"
                  strokeDashoffset="0"
                />
                {[1, 2, 3].map((i) => (
                  <circle 
                    key={i} 
                    className="sparkle" 
                    cx={25 + i * 25} 
                    cy="50" 
                    r="3" 
                    fill="var(--primary-light)" 
                    opacity="0.5"
                  />
                ))}
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 gradient-text">Smart Drawing Assistance</h3>
            <p className="opacity-80 smooth-transition">AI automatically refines your sketches and shapes in real-time</p>
          </div>
          
          {/* Video Calling */}
          <div ref={videoCallingRef} className="glass-card hover-lift p-8 rounded-xl transform transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className="icon-container text-5xl mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-12 relative">
              📹
              <div className="video-screen absolute -right-2 -top-2 w-6 h-6 bg-[var(--primary-light)] rounded-md opacity-70"></div>
              <svg className="video-wave absolute top-0 right-0 w-full h-full" viewBox="0 0 100 100" fill="none">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="30" 
                  stroke="var(--primary)" 
                  strokeWidth="2" 
                  fill="none"
                  opacity="0.5"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 gradient-text">Video Calling</h3>
            <p className="opacity-80 smooth-transition">Face-to-face collaboration with built-in video chat while working together</p>
          </div>
          
          {/* Real-time Collaboration */}
          <div ref={realtimeCollabRef} className="glass-card hover-lift p-8 rounded-xl transform transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className="icon-container text-5xl mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-12 relative">
              🤝
              <div className="flex absolute -right-4 top-0">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`collab-user w-4 h-4 rounded-full bg-[var(--primary-light)] border-2 border-white -ml-${i}`}
                    style={{ marginLeft: `-${i*2}px`, zIndex: 3-i }}
                  ></div>
                ))}
              </div>
              <div className="collab-pulse absolute top-0 right-0 w-full h-full rounded-full border-2 border-[var(--primary)] opacity-50"></div>
            </div>
            <h3 className="text-2xl font-semibold mb-3 gradient-text">Real-time Collaboration</h3>
            <p className="opacity-80 smooth-transition">Work together seamlessly with your team in real-time</p>
          </div>
          
          {/* Content Generation */}
          <div className="glass-card hover-lift p-8 rounded-xl transform transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className="text-5xl mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-12">🎭</div>
            <h3 className="text-2xl font-semibold mb-3 gradient-text">Content Generation</h3>
            <p className="opacity-80 smooth-transition">Generate professional content and layouts with AI assistance</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeatureAnimations;
