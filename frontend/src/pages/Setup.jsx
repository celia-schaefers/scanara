import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { getApps } from '../services/apps';
import './Setup.css';

const Setup = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    setUser(currentUser);
    fetchApp();
  }, [appId, navigate]);

  const fetchApp = async () => {
    try {
      const apps = await getApps();
      const foundApp = apps.find(a => a.id === appId);
      if (foundApp) {
        setApp(foundApp);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching app:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    navigate(`/setup/${appId}/${option}`);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="setup-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading setup...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return null;
  }

  return (
    <div className="setup-container">
      <div className="setup-header">
        <button className="btn-back" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Dashboard
        </button>
        <div className="setup-header-content">
          <h1 className="setup-title">Setup {app.name}</h1>
          <p className="setup-subtitle">Choose how you want to connect your codebase for compliance scanning</p>
        </div>
      </div>

      <div className="setup-options">
        <div 
          className="setup-option"
          onClick={() => handleOptionSelect('cli')}
        >
          <div className="option-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
          <h3 className="option-title">CLI Tool</h3>
          <p className="option-description">
            Install our command-line interface tool and scan your codebase directly from your terminal
          </p>
          <div className="option-badge">Recommended</div>
        </div>

        <div 
          className="setup-option"
          onClick={() => handleOptionSelect('vscode')}
        >
          <div className="option-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
          <h3 className="option-title">VS Code Extension</h3>
          <p className="option-description">
            Install our VS Code extension for seamless integration and real-time compliance checking
          </p>
        </div>

        <div 
          className="setup-option"
          onClick={() => handleOptionSelect('github')}
        >
          <div className="option-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </div>
          <h3 className="option-title">Import from GitHub</h3>
          <p className="option-description">
            Connect your GitHub repository and automatically import your codebase for scanning
          </p>
        </div>
      </div>
    </div>
  );
};

export default Setup;

