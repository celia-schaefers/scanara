import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { getApps } from '../services/apps';
import './Setup.css';

const SetupVSCode = () => {
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
          <h1 className="setup-title">VS Code Extension Setup for {app.name}</h1>
          <p className="setup-subtitle">Follow these steps to install and configure the Scanara VS Code extension</p>
        </div>
      </div>

      <div className="setup-details">
        <div className="details-content">
          <h2 className="details-title">VS Code Extension Setup</h2>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Install Extension</h3>
                <p>Open VS Code and search for "Scanara AI" in the Extensions marketplace</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Configure API Key</h3>
                <p>Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P) and run "Scanara: Configure API Key"</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Start Scanning</h3>
                <p>Right-click on your project folder and select "Scanara: Scan for Compliance"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupVSCode;

