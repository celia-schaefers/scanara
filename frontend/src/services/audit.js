import { getCurrentToken } from './auth.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Run HIPAA compliance audit
 * @param {string} appId - App ID
 * @returns {Promise<Object>} Audit results
 */
export const runAudit = async (appId) => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BACKEND_URL}/api/audit/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ appId })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to run audit';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        if (response.status === 404) {
          errorMessage = `Route not found. Please ensure the backend server is running and has the audit routes registered.`;
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error running audit:', error);
    throw error;
  }
};

/**
 * Get audit history for an app
 * @param {string} appId - App ID
 * @returns {Promise<Array>} Array of audit objects
 */
export const getAudits = async (appId) => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BACKEND_URL}/api/audit/history/${appId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch audits';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.audits || [];
  } catch (error) {
    console.error('Error fetching audits:', error);
    throw error;
  }
};

