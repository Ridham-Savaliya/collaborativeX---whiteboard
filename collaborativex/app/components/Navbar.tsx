'use client';

import React from 'react';
import DarkModeToggle from './DarkModeToggle';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)] bg-opacity-80 backdrop-blur-lg border-b border-[var(--primary-light)] border-opacity-20 md:flex md:items-center md:justify-between">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xl font-bold gradient-text">CollaborativeX</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4 md:space-x-8">
          <a href="#features" className="hover:text-[var(--primary)] transition-colors cursor-pointer">Features</a>
          <a href="#pricing" className="hover:text-[var(--primary)] transition-colors cursor-pointer">Pricing</a>
          <a href="#about" className="hover:text-[var(--primary)] transition-colors cursor-pointer">About</a>
          <DarkModeToggle />
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button className="px-3 py-2 text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
            Log in
          </button>
          <button className="interactive-button bg-[var(--primary)] text-white px-3 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
            Sign up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
