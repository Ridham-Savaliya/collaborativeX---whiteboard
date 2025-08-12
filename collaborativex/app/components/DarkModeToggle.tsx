'use client';

import { useState, useEffect } from 'react';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    const root = document.documentElement;
    if (isDarkMode) {
      root.style.setProperty('--background', '#0f172a');
      root.style.setProperty('--foreground', '#e2e8f0');
      root.style.setProperty('--primary', '#818cf8');
      root.style.setProperty('--primary-dark', '#6366f1');
      root.style.setProperty('--primary-light', '#a5b4fc');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--card-shadow', '0 8px 32px rgba(0, 0, 0, 0.3)');
    } else {
      root.style.setProperty('--background', '#f6f8fd');
      root.style.setProperty('--foreground', '#2d3748');
      root.style.setProperty('--primary', '#6366f1');
      root.style.setProperty('--primary-dark', '#4f46e5');
      root.style.setProperty('--primary-light', '#818cf8');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--card-shadow', '0 8px 32px rgba(31, 38, 135, 0.15)');
    }
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      root.style.setProperty('--background', '#0f172a');
      root.style.setProperty('--foreground', '#e2e8f0');
      root.style.setProperty('--primary', '#818cf8');
      root.style.setProperty('--primary-dark', '#6366f1');
      root.style.setProperty('--primary-light', '#a5b4fc');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--card-shadow', '0 8px 32px rgba(0, 0, 0, 0.3)');
    } else {
      root.style.setProperty('--background', '#f6f8fd');
      root.style.setProperty('--foreground', '#2d3748');
      root.style.setProperty('--primary', '#6366f1');
      root.style.setProperty('--primary-dark', '#4f46e5');
      root.style.setProperty('--primary-light', '#818cf8');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--card-shadow', '0 8px 32px rgba(31, 38, 135, 0.15)');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-[var(--glass-bg)] transition-colors cursor-pointer md:p-3"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
};

export default DarkModeToggle;
