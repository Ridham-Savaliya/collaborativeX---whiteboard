'use client';

import { useEffect, useRef } from 'react';

const AboutUs = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => {
      elements?.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="about" className="py-24 bg-[var(--background)] bg-opacity-50" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 gradient-text animate-on-scroll opacity-0">
            Revolutionizing Team Collaboration
          </h2>
          <p className="text-center text-lg opacity-80 mb-16 max-w-3xl mx-auto animate-on-scroll opacity-0">
            At CollaborativeX, we&apos;re transforming how teams work together in the digital age.
          </p>

          <div className="glass-card p-8 md:p-12 rounded-2xl hover-lift animate-on-scroll opacity-0">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="animate-on-scroll opacity-0">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 gradient-text">Our Mission</h3>
                  <p className="text-lg opacity-90">
                    We&apos;re on a mission to eliminate the barriers of remote collaboration by creating an intuitive, AI-powered whiteboard platform that brings teams together, regardless of their location.
                  </p>
                </div>
                
                <div className="animate-on-scroll opacity-0">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 gradient-text">What We Do</h3>
                  <p className="text-lg opacity-90">
                    CollaborativeX combines real-time whiteboarding with cutting-edge AI assistance and integrated video calling to create a seamless collaborative experience that feels as natural as being in the same room.
                  </p>
                </div>
              </div>
              
              <div className="space-y-8 animate-on-scroll opacity-0">
                <div className="glass-card bg-[var(--glass-bg)] p-6 rounded-xl border-l-4 border-[var(--primary)] hover:translate-x-2 transition-transform">
                  <h4 className="text-xl font-semibold mb-2">AI-Powered Innovation</h4>
                  <p>Our intelligent features assist your creativity with smart drawing assistance, content generation, and real-time translation.</p>
                </div>
                
                <div className="glass-card bg-[var(--glass-bg)] p-6 rounded-xl border-l-4 border-[var(--primary-light)] hover:translate-x-2 transition-transform">
                  <h4 className="text-xl font-semibold mb-2">Seamless Collaboration</h4>
                  <p>Work together in real-time with integrated video calling, infinite canvas, and cloud synchronization across all devices.</p>
                </div>
                
                <div className="glass-card bg-[var(--glass-bg)] p-6 rounded-xl border-l-4 border-[var(--primary-dark)] hover:translate-x-2 transition-transform">
                  <h4 className="text-xl font-semibold mb-2">Built for Teams</h4>
                  <p>Designed with teams in mind, featuring smart templates, voice commands, and enterprise-grade security.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center animate-on-scroll opacity-0">
              <p className="text-lg font-semibold mb-6">Join thousands of teams already transforming their collaboration with CollaborativeX</p>
              <button className="interactive-button bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[var(--primary-dark)] transition-all">
                Start Collaborating Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
