// collaborativex/app/components/WhiteboardTour.tsx
'use client';
import React from 'react';
import Joyride, { Step, CallBackProps, STATUS, Styles } from 'react-joyride';

interface WhiteboardTourProps {
  run: boolean;
  onTourEnd: () => void;
}

const steps: Step[] = [
  {
    target: 'body',
    title: '✨ Welcome!',
    content: 'Take a quick tour to discover your creative space.',
    placement: 'center',
  },
  {
    target: '#right-navbar',
    title: '🛠️ Tools Panel',
    content: 'Pens, notes, shapes, text & more — all at your fingertips.',
    placement: 'right-start',
  },
  {
    target: '#canvas-toolbar',
    title: '⚡ Power Toolbar',
    content: 'AI tools, templates, and video calls — your creative hub.',
    placement: 'top',
  },
  {
    target: '#collaboration-panel',
    title: '👥 Collaboration',
    content: 'See who’s online, track activity, and monitor status.',
    placement: 'left-start',
  },
  {
    target: '#zoom-controls',
    title: '🔍 Zoom',
    content: 'Focus on details or zoom out for the big picture.',
    placement: 'top-end',
  },
];

const joyrideStyles: Styles = {
  options: {
    arrowColor: '#8B5CF6',
    backgroundColor: 'linear-gradient(135deg, #1E1B2E, #2D1F46)',
    primaryColor: '#A78BFA',
    textColor: '#F3F4F6',
    zIndex: 10000,
  },
  tooltip: {
    border: '1px solid #8B5CF6',
    borderRadius: '16px',
    background: 'linear-gradient(145deg, #1F1B2E, #2D1F46)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
    padding: '24px',
  },
  tooltipTitle: {
    color: '#EDE9FE',
    fontSize: '20px',
    fontWeight: 700,
  },
  tooltipContent: {
    fontSize: '15px',
    lineHeight: 1.6,
  },
  buttonNext: {
    background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '9999px',
    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.4)',
  },
  buttonBack: {
    color: '#A78BFA',
    fontSize: '13px',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#F87171',
    fontSize: '13px',
    fontWeight: 600,
  },
};

const WhiteboardTour: React.FC<WhiteboardTourProps> = ({ run, onTourEnd }) => {
  const handleCallback = ({ status }: CallBackProps) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) onTourEnd();
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={joyrideStyles}
    />
  );
};

export default WhiteboardTour;
