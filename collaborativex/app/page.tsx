import React from 'react';

import Navbar from './components/Navbar';
import WhiteboardDemo from './components/WhiteboardDemo';
import FounderSection from './components/FounderSection';
import DemoVideo from './components/DemoVideo';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-[var(--primary-dark)] text-[var(--foreground)]">
      <Navbar />
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 flex flex-col lg:flex-row items-center justify-between">
        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold gradient-text animate-gradient leading-tight">
            Collaborate & Create Together
          </h1>
          <p className="text-lg sm:text-xl opacity-90 smooth-transition max-w-2xl mx-auto lg:mx-0">
            Experience the future of collaborative whiteboarding with AI-powered features and real-time collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button className="interactive-button bg-[var(--primary)] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover-lift">
              Get Started Free
            </button>
            <button className="interactive-button bg-transparent border-2 border-[var(--primary)] text-[var(--primary)] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover-lift">
              Watch Demo
            </button>
          </div>
        </div>
        <div className="lg:w-1/2 mt-10 lg:mt-0">
          <WhiteboardDemo />
        </div>
      </section>

    <DemoVideo/>
      {/* Features Section */}
      <section className="py-20 bg-[var(--background)] bg-opacity-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Powerful Features</h2>
          <p className="text-center text-lg opacity-80 mb-16 max-w-2xl mx-auto">Discover the tools that make CollaborativeX the most powerful whiteboard platform for teams.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Real-time Collaboration',
                description: 'Work together seamlessly with your team in real-time with integrated video calling',
                icon: '🤝'
              },
              {
                title: 'Video Calling',
                description: 'Face-to-face collaboration with built-in video chat while working together',
                icon: '📹'
              },
              {
                title: 'Infinite Canvas',
                description: 'Never run out of space with our expandable canvas',
                icon: '🎨'
              },
              {
                title: 'Smart Templates',
                description: 'Start quickly with pre-designed professional templates',
                icon: '📋'
              },
              {
                title: 'Cloud Sync',
                description: 'Access your work from anywhere, anytime',
                icon: '☁️'
              },
              {
                title: 'Voice Commands',
                description: 'Control your whiteboard using natural voice instructions',
                icon: '🎤'
              }
            ].map((feature, index) => (
              <div key={index} className="glass-card hover-lift p-8 rounded-xl">
                <div className="text-5xl mb-6 rotate-3d">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 gradient-text">{feature.title}</h3>
                <p className="opacity-80 smooth-transition">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 bg-[var(--background)] bg-opacity-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 gradient-text">AI-Powered Innovation</h2>
          <p className="text-center text-lg opacity-80 mb-16 max-w-2xl mx-auto">Experience the future of whiteboarding with our cutting-edge AI features.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart Drawing Assistance',
                description: 'AI automatically refines your sketches and shapes in real-time',
                icon: '✨'
              },
              {
                title: 'Intelligent Suggestions',
                description: 'Get context-aware suggestions for diagrams and layouts',
                icon: '💡'
              },
              {
                title: 'Auto-Organization',
                description: 'AI helps arrange and align elements for cleaner presentations',
                icon: '🎯'
              },
              {
                title: 'Smart Object Recognition',
                description: 'Convert hand-drawn shapes into perfect geometric forms',
                icon: '🔍'
              },
              {
                title: 'Content Generation',
                description: 'Generate professional content and layouts with AI assistance',
                icon: '🎭'
              },
              {
                title: 'Real-time Translation',
                description: 'Break language barriers with instant AI translation',
                icon: '🌐'
              }
            ].map((feature, index) => (
              <div key={index} className="glass-card hover-lift p-8 rounded-xl">
                <div className="text-5xl mb-6 rotate-3d">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 gradient-text">{feature.title}</h3>
                <p className="opacity-80 smooth-transition">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '0',
                features: [
                  'Basic whiteboard features',
                  '3 boards',
                  'Limited collaboration',
                  'Community support'
                ]
              },
              {
                name: 'Pro',
                price: '12',
                features: [
                  'Advanced features',
                  'Unlimited boards',
                  'AI-powered tools',
                  'Priority support'
                ]
              },
              {
                name: 'Team',
                price: '49',
                features: [
                  'Everything in Pro',
                  'Team management',
                  'Advanced security',
                  'Custom integrations'
                ]
              }
            ].map((plan, index) => (
              <div key={index} className="glass-card hover-lift p-8 rounded-xl text-center">
                <h3 className="text-2xl font-bold mb-3 gradient-text">{plan.name}</h3>
                <div className="text-5xl font-bold mb-8 smooth-transition">
                  <span className="text-3xl">$</span>{plan.price}
                  <span className="text-2xl font-normal">/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

     
      
      <FounderSection />

      {/* Testimonials Section */}
      <section className="py-20 overflow-hidden bg-[var(--background)] bg-opacity-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">What Our Users Say</h2>
          <p className="text-center text-lg opacity-80 mb-16 max-w-2xl mx-auto">Join thousands of satisfied teams who trust CollaborativeX for their remote collaboration needs.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              name: 'Sarah Johnson',
              role: 'Product Designer',
              content: 'CollaborativeX has transformed how our design team works together. The AI features and video calling make collaboration truly seamless!',
              image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="%23FFB6C1"/><circle cx="50" cy="100" r="40" fill="%23FFB6C1"/></svg>'
            },
            {
              name: 'Michael Chen',
              role: 'Education Professional',
              content: 'The AI-powered features have made my online teaching so much more engaging. Video calling and real-time collaboration are game-changers!',
              image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="%2398FB98"/><circle cx="50" cy="100" r="40" fill="%2398FB98"/></svg>'
            },
            {
              name: 'Emily Rodriguez',
              role: 'Startup Founder',
              content: 'The AI assistance and video collaboration features make this the perfect tool for remote teams. Worth every penny!',
              image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="%23DDA0DD"/><circle cx="50" cy="100" r="40" fill="%23DDA0DD"/></svg>'
            },
            {
              name: 'David Kim',
              role: 'UX Researcher',
              content: 'The AI suggestions and real-time video collaboration have revolutionized our brainstorming sessions.',
              image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="%2387CEEB"/><circle cx="50" cy="100" r="40" fill="%2387CEEB"/></svg>'
            },
            {
              name: 'Lisa Thompson',
              role: 'Project Manager',
              content: 'The combination of AI tools and video calling makes managing remote teams effortless and efficient!',
              image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="%23F0E68C"/><circle cx="50" cy="100" r="40" fill="%23F0E68C"/></svg>'
            },
            {
              name: 'Alex Martinez',
              role: 'Creative Director',
              content: 'The AI-powered templates and video collaboration features have transformed our creative process completely.',
              image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="%23E6E6FA"/><circle cx="50" cy="100" r="40" fill="%23E6E6FA"/></svg>'
            }
          ].map((testimonial, index) => (
            <div key={index} className="glass-card hover-lift p-8 rounded-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="opacity-70">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-xl italic gradient-text">"{testimonial.content}"</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-20 bg-[var(--background)] bg-opacity-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Share Your Feedback</h2>
          <p className="text-center text-lg opacity-80 mb-16 max-w-2xl mx-auto">Help us improve CollaborativeX with your valuable feedback.</p>
          <div className="max-w-2xl mx-auto glass-card p-8 rounded-xl">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input type="text" className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea rows={4} className="w-full px-4 py-2 rounded-lg bg-transparent border border-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"></textarea>
              </div>
              <button type="submit" className="w-full interactive-button bg-[var(--primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition-all">
                Send Feedback
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--background)] bg-opacity-80 border-t border-[var(--primary-light)] border-opacity-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xl font-bold gradient-text">CollaborativeX</span>
              </div>
              <p className="text-sm opacity-80">Empowering teams to collaborate and create together in real-time.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[var(--primary)] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-[var(--primary)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[var(--primary-light)] border-opacity-20">
            <p className="text-sm opacity-80 mb-4 md-mb-0">© 2024 CollaborativeX. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
              </a>
              <a href="#" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

