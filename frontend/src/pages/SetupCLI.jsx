import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { getApps } from '../services/apps';
import './Setup.css';

const SetupCLI = () => {
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

  const handleBack = () => {
    navigate(`/setup/${appId}`);
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
          Back to Setup Options
        </button>
        <div className="setup-header-content">
          <h1 className="setup-title">CLI Setup for {app.name}</h1>
          <p className="setup-subtitle">Follow these steps to set up and use the Scanara CLI tool</p>
        </div>
      </div>

      <div className="setup-details">
        <div className="details-content">
          <h2 className="details-title">CLI Setup Instructions</h2>
          <div className="code-block">
            <div className="code-header">
              <span>Install Scanara CLI</span>
              <button className="btn-copy-code" onClick={() => navigator.clipboard.writeText('npm install -g @scanaraai/cli')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <code>npm install -g @scanaraai/cli</code>
          </div>
          <div className="code-block">
            <div className="code-header">
              <span>Configure with your API key</span>
              <button className="btn-copy-code" onClick={() => navigator.clipboard.writeText('scanara config --api-key YOUR_API_KEY')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <code>scanara config --api-key YOUR_API_KEY</code>
          </div>
          <div className="code-block">
            <div className="code-header">
              <span>Run a scan</span>
              <button className="btn-copy-code" onClick={() => navigator.clipboard.writeText('scanara scan')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <code>scanara scan</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupCLI;

