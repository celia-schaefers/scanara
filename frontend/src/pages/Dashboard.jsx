import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/auth';
import { createApp, getApps } from '../services/apps';
import './Dashboard.css';

// Create App Modal Component
const CreateAppModal = ({ isOpen, onClose, onSuccess }) => {
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdApp, setCreatedApp] = useState(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await createApp(appName);
      setCreatedApp(result.app);
      onSuccess(result.app);
    } catch (err) {
      setError(err.message || 'Failed to create app. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    if (createdApp?.apiKey) {
      navigator.clipboard.writeText(createdApp.apiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  };

  const handleDownloadApiKey = () => {
    if (createdApp?.apiKey) {
      // Create JSON object with the API key
      const apiKeyData = {
        api_scanaraai: createdApp.apiKey
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(apiKeyData, null, 2);

      // Create a blob with the JSON content
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = 'scanaraai.json';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleClose = () => {
    setAppName('');
    setError('');
    setCreatedApp(null);
    setApiKeyCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {!createdApp ? (
          <>
            <h2 className="modal-title">Create New App</h2>
            <p className="modal-description">
              Enter a name for your healthcare application to get started with compliance scanning.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="appName">App Name</label>
                <input
                  type="text"
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g., Patient Portal App"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading || !appName.trim()}>
                  {loading ? 'Creating...' : 'Create App'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="success-content">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="modal-title">App Created Successfully!</h2>
            <p className="modal-description">
              Your app <strong>{createdApp.name}</strong> has been created. Here's your API key:
            </p>
            <div className="api-key-container">
              <div className="api-key-display">
                <code className="api-key">{createdApp.apiKey}</code>
                <div className="api-key-actions">
                  <button 
                    className="btn-copy" 
                    onClick={handleCopyApiKey}
                    title="Copy API key"
                  >
                    {apiKeyCopied ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                  <button 
                    className="btn-download" 
                    onClick={handleDownloadApiKey}
                    title="Download API key as JSON"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                </div>
              </div>
              {apiKeyCopied && <p className="copy-success">API key copied to clipboard!</p>}
            </div>
            <div className="warning-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <p>Please save this API key securely. You won't be able to see it again.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Overview Component
const OverviewContent = ({ user, onGetStarted, onViewProjects }) => {
  return (
    <div className="overview-hero">
      <div className="overview-hero-content">
        <div className="overview-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <span>AI-Powered Compliance Scanning</span>
        </div>
        <h1 className="overview-title">
          Secure Your Healthcare App with{' '}
          <span className="overview-accent">AI-Powered</span>{' '}
          Compliance Auditing
        </h1>
        <p className="overview-description">
          Automatically detect compliance violations in your codebase, instantly report with actionable fixes to protect patient data and ensure regulatory compliance
        </p>
        <div className="overview-buttons">
          <button className="btn-get-started" onClick={onGetStarted}>
            <span>Get Started</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button className="btn-my-projects" onClick={onViewProjects}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>My Projects</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Projects Component
const ProjectsContent = ({ onRefresh, refreshKey }) => {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApps = async () => {
    try {
      setLoading(true);
      setError('');
      const appsData = await getApps();
      setApps(appsData);
    } catch (err) {
      setError(err.message || 'Failed to load projects');
      console.error('Error fetching apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = (appId) => {
    navigate(`/setup/${appId}`);
  };

  const handleViewReport = (appId) => {
    navigate(`/audit/${appId}`);
  };

  useEffect(() => {
    fetchApps();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="projects-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-container">
        <div className="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchApps}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div>
          <h1 className="projects-title">Projects</h1>
          <p className="projects-subtitle">Manage your healthcare applications and compliance scans</p>
        </div>
        <button className="btn-create-project" onClick={onRefresh}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New Project
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <h2>No projects yet</h2>
          <p>Create your first project to start scanning your healthcare applications for HIPAA compliance.</p>
          <button className="btn-create-project" onClick={onRefresh}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {apps.map((app) => (
            <div key={app.id} className="project-card">
              <div className="project-card-header">
                <div className="project-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h3 className="project-name">{app.name}</h3>
              </div>
              <div className="project-card-body">
                <div className="project-meta">
                  <div className="project-meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="project-card-footer">
                {app.status === 'audit' ? (
                  <button className="btn-view-project" onClick={() => handleViewReport(app.id)}>
                    View Report
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                ) : (
                  <button className="btn-view-project" onClick={() => handleFinishSetup(app.id)}>
                    Finish Setup
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshProjects, setRefreshProjects] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-brand">Scanara AI</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveMenu('overview')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
            <span>Overview</span>
          </button>

          <button
            className={`nav-item ${activeMenu === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveMenu('projects')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>Projects</span>
          </button>

          <button
            className={`nav-item ${activeMenu === 'setup-guide' ? 'active' : ''}`}
            onClick={() => setActiveMenu('setup-guide')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Setup Guide</span>
          </button>

          <button
            className={`nav-item ${activeMenu === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveMenu('docs')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Docs</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 18.364m12.728 0l-4.243-4.243m-4.242 0L5.636 5.636"></path>
            </svg>
            <span>Settings</span>
          </button>

          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeMenu === 'overview' && (
            <OverviewContent 
              user={user} 
              onGetStarted={() => setIsModalOpen(true)}
              onViewProjects={() => setActiveMenu('projects')}
            />
          )}
          {activeMenu === 'projects' && (
            <ProjectsContent 
              onRefresh={() => setIsModalOpen(true)} 
              refreshKey={refreshProjects}
            />
          )}
          {activeMenu === 'setup-guide' && (
            <div className="coming-soon">
              <h2>Setup Guide</h2>
              <p>Coming soon...</p>
            </div>
          )}
          {activeMenu === 'docs' && (
            <div className="coming-soon">
              <h2>Documentation</h2>
              <p>Coming soon...</p>
            </div>
          )}
          {activeMenu === 'settings' && (
            <div className="coming-soon">
              <h2>Settings</h2>
              <p>Coming soon...</p>
            </div>
          )}
        </div>
      </main>

      {/* Create App Modal */}
      <CreateAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(app) => {
          console.log('App created:', app);
          // Refresh projects list
          setRefreshProjects(prev => prev + 1);
          // Switch to projects tab if on overview
          if (activeMenu === 'overview') {
            setActiveMenu('projects');
          }
        }}
      />
    </div>
  );
};

export default Dashboard;

