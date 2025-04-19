'use client';

const FounderSection = () => {
  return (
    <section className="py-20 bg-[var(--background)] bg-opacity-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">Meet the Founder</h2>
        <div className="max-w-4xl mx-auto">
          <div className="glass-card hover-lift p-8 rounded-xl flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 rounded-full overflow-hidden rotate-3d">
              <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-4xl font-bold text-white">
                RS
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2 gradient-text">Ridham Savaliiya</h3>
              <p className="text-lg text-[var(--primary-light)] mb-4">Founder & CEO</p>
              <p className="text-lg opacity-90 mb-6">
                "I created CollaborativeX with a vision to revolutionize how teams collaborate remotely. Our AI-powered whiteboard solution brings together the best of technology and human creativity."
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-4">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-button bg-[var(--primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                >
                  Connect on LinkedIn
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                >
                  Follow on Twitter
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;
