'use client';

import React from 'react';

const DemoVideo = () => {
  return (
    <section className="py-20 bg-[var(--background)] bg-opacity-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">See CollaborativeX in Action</h2>
        <div className="max-w-4xl mx-auto">
          <div className="glass-card hover-lift p-6 rounded-xl overflow-hidden aspect-video relative">
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary-dark)] bg-opacity-20 backdrop-blur-sm">
              <div className="text-center">
                <div className="inline-block p-4 rounded-full bg-[var(--primary)] text-white mb-4 cursor-pointer hover:bg-[var(--primary-dark)] transition-colors">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold">Watch Demo Video</p>
              </div>
            </div>
            {/* Replace src with actual demo video URL */}
            <video
              className="w-full h-full object-cover"
              poster="/demo-thumbnail.jpg"
              controls
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
            <div className="glass-card p-6 rounded-xl cursor-pointer hover:bg-[var(--glass-bg)] transition-all">
              <h3 className="text-lg font-semibold mb-2">Quick Setup</h3>
              <p className="opacity-80">Get started in seconds with our intuitive interface</p>
            </div>
            <div className="glass-card p-6 rounded-xl cursor-pointer hover:bg-[var(--glass-bg)] transition-all">
              <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
              <p className="opacity-80">Collaborate with your team instantly</p>
            </div>
            <div className="glass-card p-6 rounded-xl cursor-pointer hover:bg-[var(--glass-bg)] transition-all">
              <h3 className="text-lg font-semibold mb-2">AI Features</h3>
              <p className="opacity-80">Experience smart drawing assistance</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoVideo;
