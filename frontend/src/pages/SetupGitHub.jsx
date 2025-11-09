import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { getApps } from '../services/apps';
import { initiateGitHubAuth, getGitHubRepos, cloneGitHubRepo } from '../services/github';
import './Setup.css';

const SetupGitHub = () => {
  const { appId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    setUser(currentUser);
    fetchApp();
    
    // Check if OAuth callback was successful
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    
    if (success === 'true') {
      setIsAuthorized(true);
      fetchRepos();
    } else if (errorParam) {
      setError(`GitHub authorization failed: ${errorParam}`);
    }
  }, [appId, navigate, searchParams]);

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

  const fetchRepos = async () => {
    try {
      setReposLoading(true);
      setError('');
      const reposData = await getGitHubRepos();
      setRepos(reposData);
      setIsAuthorized(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories');
      setIsAuthorized(false);
    } finally {
      setReposLoading(false);
    }
  };

  const handleAuthorize = async () => {
    try {
      setError('');
      const result = await initiateGitHubAuth(appId);
      // Redirect to GitHub OAuth
      window.location.href = result.authUrl;
    } catch (err) {
      setError(err.message || 'Failed to initiate GitHub authorization');
    }
  };

  const handleClone = async (repo) => {
    try {
      setCloning(true);
      setError('');
      await cloneGitHubRepo(appId, repo.cloneUrl, repo.fullName);
      // Navigate to audit page
      navigate(`/audit/${appId}`);
    } catch (err) {
      setError(err.message || 'Failed to clone repository');
    } finally {
      setCloning(false);
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
          <h1 className="setup-title">Import from GitHub for {app.name}</h1>
          <p className="setup-subtitle">Connect your GitHub repository to automatically import your codebase</p>
        </div>
      </div>

      <div className="setup-details">
        <div className="details-content">
          <h2 className="details-title">Import from GitHub</h2>
          
          {!isAuthorized ? (
            <div className="github-auth">
              <p className="github-description">
                Connect your GitHub account to import repositories for compliance scanning.
              </p>
              <button className="btn-import-github" onClick={handleAuthorize} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                Authorize with GitHub
              </button>
            </div>
          ) : (
            <div className="github-repos">
              <div className="repos-header">
                <h3>Select a Repository</h3>
                <button className="btn-refresh" onClick={fetchRepos} disabled={reposLoading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Refresh
                </button>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              {reposLoading ? (
                <div className="loading-repos">
                  <div className="loading-spinner"></div>
                  <p>Loading repositories...</p>
                </div>
              ) : repos.length === 0 ? (
                <p className="no-repos">No repositories found. Please authorize with GitHub first.</p>
              ) : (
                <div className="repos-list">
                  {repos.map((repo) => (
                    <div key={repo.id} className="repo-item">
                      <div className="repo-info">
                        <h4 className="repo-name">{repo.fullName}</h4>
                        {repo.description && (
                          <p className="repo-description">{repo.description}</p>
                        )}
                        <div className="repo-meta">
                          <span className={`repo-badge ${repo.private ? 'private' : 'public'}`}>
                            {repo.private ? 'Private' : 'Public'}
                          </span>
                          <span className="repo-updated">
                            Updated {new Date(repo.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-clone-repo"
                        onClick={() => handleClone(repo)}
                        disabled={cloning}
                      >
                        {cloning ? (
                          <>
                            <div className="loading-spinner-small"></div>
                            Cloning...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                            </svg>
                            Import
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <p className="github-note">
            We'll clone your repository and extract all code files for compliance scanning. 
            Your code remains secure and private.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupGitHub;

