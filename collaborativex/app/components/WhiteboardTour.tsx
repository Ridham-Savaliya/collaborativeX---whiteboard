'use client';
import React from 'react';
import Tour from 'reactour';

interface WhiteboardTourProps {
  run: boolean;
  onTourEnd: () => void;
}

const steps = [
  {
    selector: '', // ✅ safer than 'body'
    content: () => (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/90 to-purple-700/90 shadow-xl border border-purple-400/30">
        <h3 className="text-xl font-extrabold bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400 bg-clip-text text-transparent">
          ✨ Welcome!
        </h3>
        <p className="mt-2 text-gray-300 leading-relaxed">
          Take a quick tour to discover your creative space.
        </p>
      </div>
    ),
  },
  {
    selector: '#right-navbar',
    content: () => (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/90 to-purple-700/90 shadow-xl border border-purple-400/30">
        <h3 className="text-xl font-extrabold bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400 bg-clip-text text-transparent">
          🛠️ Tools Panel
        </h3>
        <p className="mt-2 text-gray-300 leading-relaxed">
          Pens, notes, shapes, text & more — all at your fingertips.
        </p>
      </div>
    ),
  },
  {
    selector: '#canvas-toolbar',
    content: () => (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/90 to-purple-700/90 shadow-xl border border-purple-400/30">
        <h3 className="text-xl font-extrabold bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400 bg-clip-text text-transparent">
          ⚡ Power Toolbar
        </h3>
        <p className="mt-2 text-gray-300 leading-relaxed">
          AI tools, templates, and video calls — your creative hub.
        </p>
      </div>
    ),
  },
  {
    selector: '#collaboration-panel',
    content: () => (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/90 to-purple-700/90 shadow-xl border border-purple-400/30">
        <h3 className="text-xl font-extrabold bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400 bg-clip-text text-transparent">
          👥 Collaboration
        </h3>
        <p className="mt-2 text-gray-300 leading-relaxed">
          See who’s online, track activity, and monitor status.
        </p>
      </div>
    ),
  },
  {
    selector: '#zoom-controls',
    content: () => (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/90 to-purple-700/90 shadow-xl border border-purple-400/30">
        <h3 className="text-xl font-extrabold bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400 bg-clip-text text-transparent">
          🔍 Zoom
        </h3>
        <p className="mt-2 text-gray-300 leading-relaxed">
          Focus on details or zoom out for the big picture.
        </p>
      </div>
    ),
  },
];

const WhiteboardTour: React.FC<WhiteboardTourProps> = ({ run, onTourEnd }) => {
  // ✅ Filter steps: skip if element doesn't exist (helps mobile where nav is hidden)
  const filteredSteps = steps.filter(
    (step) => !step.selector || document.querySelector(step.selector)
  );

  return (
    <Tour
      steps={filteredSteps}
      isOpen={run}
      onRequestClose={onTourEnd}
      accentColor="#7C3AED"
      rounded={12}
      disableInteraction={false}
      inViewThreshold={100} // helps when elements are off-screen
      className="custom-tour"
    />
  );
};

export default WhiteboardTour;
