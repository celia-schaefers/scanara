import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      title: 'HIPAA Compliance Scanning',
      description: 'Automatically scan codebases for HIPAA violations and PHI exposure risks with AI-powered analysis'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      ),
      title: 'Instant Compliance Reports',
      description: 'Get detailed reports with file-level and line-level findings in minutes, not hours'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
      title: 'Actionable Remediation',
      description: 'Step-by-step guidance with code snippets to fix compliance issues quickly and effectively'
    }
  ];

  const steps = [
    {
      step: '1',
      title: 'Create Project',
      description: 'Create a new project and get your unique API key for integration with your development workflow'
    },
    {
      step: '2',
      title: 'Import Codebase',
      description: 'Connect your GitHub repository or upload code via CLI/VS Code extension seamlessly'
    },
    {
      step: '3',
      title: 'AI Analysis',
      description: 'Our AI scans your codebase for HIPAA violations and PHI exposure risks automatically'
    },
    {
      step: '4',
      title: 'Get Report',
      description: 'Receive detailed compliance report with actionable fixes and recommendations'
    }
  ];

  const benefits = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      title: 'Protect Patient Data',
      description: 'Detect PHI exposure risks before they reach production'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
      title: 'Code-Level Guidance',
      description: 'Precise recommendations with exact file paths and line numbers'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      title: 'Continuous Compliance',
      description: 'Track compliance over time with audit history and monitoring'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      ),
      title: 'GitHub Integration',
      description: 'Import codebases directly from GitHub repositories with one click'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <header className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="logo-icon">
              <span>S</span>
            </div>
            <span className="brand-text">Scanara AI</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Setup Guide</a>
            <a href="#about" className="nav-link">About</a>
            <button className="nav-link nav-button" onClick={() => navigate('/signin')}>
              Sign In
            </button>
            <button className="nav-link nav-button-primary" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <span>AI-Powered Compliance Scanning</span>
            </div>
            <h1 className="hero-title">
              Secure Your Healthcare App with{' '}
              <span className="hero-accent">AI-Powered</span>{' '}
              Compliance Auditing
            </h1>
            <p className="hero-description">
              Automatically detect compliance violations in your codebase, instantly report with actionable fixes to protect patient data and ensure regulatory compliance
            </p>
            
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate('/signup')}
              >
                <span>Get Started Free</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </button>
            </div>

            <div className="google-signin-section">
              <button 
                className="btn-google"
                onClick={() => navigate('/signin')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need for Compliance Scanning</h2>
            <p className="section-description">
              Comprehensive scanning, instant reporting, and actionable remediation steps to keep your healthcare applications compliant
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="feature-icon-container">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">
              Get started with HIPAA compliance scanning in four simple steps
            </p>
          </div>
          <div className="workflow-steps">
            {steps.map((step, index) => (
              <div key={index} className="workflow-wrapper">
                <div className="workflow-step" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="step-number">{step.step}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="workflow-arrow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="benefit-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="benefit-icon">
                  {benefit.icon}
                </div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Secure Your Healthcare Application?</h2>
            <p className="cta-description">
              Join thousands of developers who trust Scanara AI to keep their healthcare applications HIPAA-compliant. Start scanning your codebase today.
            </p>
            <div className="cta-buttons">
              <button 
                className="btn-primary btn-large"
                onClick={() => navigate('/signup')}
              >
                Get Started Free
              </button>
              <button 
                className="btn-secondary btn-large"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-main">
              <div className="footer-brand-section">
                <div className="footer-logo">
                  <div className="logo-icon">
                    <span>S</span>
                  </div>
                  <span className="footer-brand">Scanara AI</span>
                </div>
                <p className="footer-tagline">
                  AI-Powered HIPAA Compliance Scanning for Healthcare Applications
                </p>
              </div>
              
              <div className="footer-links">
                <div className="footer-column">
                  <h4 className="footer-column-title">Product</h4>
                  <ul className="footer-link-list">
                    <li><a href="#features" className="footer-link">Features</a></li>
                    <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
                    <li><a href="/signup" className="footer-link">Get Started</a></li>
                    <li><a href="/signin" className="footer-link">Sign In</a></li>
                  </ul>
                </div>
                
                <div className="footer-column">
                  <h4 className="footer-column-title">Resources</h4>
                  <ul className="footer-link-list">
                    <li><a href="#" className="footer-link">Setup Guide</a></li>
                    <li><a href="#" className="footer-link">Documentation</a></li>
                    <li><a href="#" className="footer-link">About</a></li>
                    <li><a href="#" className="footer-link">Support</a></li>
                  </ul>
                </div>
                
                <div className="footer-column">
                  <h4 className="footer-column-title">Legal</h4>
                  <ul className="footer-link-list">
                    <li><a href="#" className="footer-link">Privacy Policy</a></li>
                    <li><a href="#" className="footer-link">Terms of Service</a></li>
                    <li><a href="#" className="footer-link">HIPAA Compliance</a></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p className="footer-copyright">
                © 2024 Scanara AI. Built for Hackathon 2024. All rights reserved.
              </p>
              <div className="footer-social">
                <a href="#" className="footer-social-link" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="footer-social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="footer-social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

