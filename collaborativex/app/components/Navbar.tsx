'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // For App Router
import DarkModeToggle from './DarkModeToggle';
import Image from 'next/image';
// import logo from '../../public/logo.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/register');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)] bg-opacity-80 backdrop-blur-lg border-b border-[var(--primary-light)] border-opacity-20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            {/* <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg> */}

            <Image src='/logo.png' alt="Logo" width={40} height={40} className="w-8 h-8" />
            <span className="text-xl font-bold gradient-text">CollaborativeX</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:text-[var(--primary)] transition-colors cursor-pointer">Features</a>
            <a href="#pricing" className="hover:text-[var(--primary)] transition-colors cursor-pointer">Pricing</a>
            <a href="#about" className="hover:text-[var(--primary)] transition-colors cursor-pointer">About</a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <DarkModeToggle />
            <button onClick={handleLogin} className="px-3 py-2 text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
              Log in
            </button>
            <button onClick={handleSignup} className="interactive-button bg-[var(--primary)] text-white px-3 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-3 md:hidden">
            <DarkModeToggle />
            <button onClick={toggleMenu} className="p-2 rounded-lg hover:bg-[var(--glass-bg)] transition-colors" aria-label="Toggle menu">
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 glass-card rounded-lg">
            <div className="flex flex-col space-y-4 px-4">
              <a href="#features" className="mobile-nav-link hover:text-[var(--primary)] transition-all cursor-pointer py-2 pl-2 border-l-2 border-transparent hover:border-[var(--primary)] hover:pl-4">Features</a>
              <a href="#pricing" className="mobile-nav-link hover:text-[var(--primary)] transition-all cursor-pointer py-2 pl-2 border-l-2 border-transparent hover:border-[var(--primary)] hover:pl-4">Pricing</a>
              <a href="#about" className="mobile-nav-link hover:text-[var(--primary)] transition-all cursor-pointer py-2 pl-2 border-l-2 border-transparent hover:border-[var(--primary)] hover:pl-4">About</a>
              <div className="flex items-center space-x-2 pt-2">
                <button onClick={handleLogin} className="px-3 py-2 text-[var(--primary)] hover:text-[var(--primary-dark)] transition-all hover:scale-105 w-full">
                  Log in
                </button>
                <button onClick={handleSignup} className="interactive-button bg-[var(--primary)] text-white px-3 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-all hover:scale-105 w-full">
                  Sign up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
