import { getCurrentToken } from './auth.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';


/**
 * Initiate GitHub OAuth flow
 * @param {string} appId - App ID
 * @returns {Promise<Object>} Auth URL
 */
export const initiateGitHubAuth = async (appId) => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BACKEND_URL}/api/github/auth?appId=${appId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to initiate GitHub auth';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error initiating GitHub auth:', error);
    throw error;
  }
};

/**
 * Get user's GitHub repositories
 * @returns {Promise<Array>} Array of repository objects
 */
export const getGitHubRepos = async () => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BACKEND_URL}/api/github/repos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch GitHub repositories';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.repos || [];
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    throw error;
  }
};

/**
 * Clone a GitHub repository
 * @param {string} appId - App ID
 * @param {string} repoUrl - Repository URL
 * @param {string} repoName - Repository name
 * @returns {Promise<Object>} Clone result
 */
export const cloneGitHubRepo = async (appId, repoUrl, repoName) => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BACKEND_URL}/api/github/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ appId, repoUrl, repoName })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to clone repository';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error cloning repository:', error);
    throw error;
  }
};

