import { getCurrentToken } from './auth.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Create a new app
 * @param {string} appName - Name of the app
 * @returns {Promise<Object>} App data including API key
 */
export const createApp = async (appName) => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BACKEND_URL}/api/apps/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ appName })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create app';
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
    console.error('Error creating app:', error);
    throw error;
  }
};

/**
 * Get all apps for the current user
 * @returns {Promise<Array>} Array of app objects
 */
export const getApps = async () => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BACKEND_URL}/api/apps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch apps';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.apps || [];
  } catch (error) {
    console.error('Error fetching apps:', error);
    throw error;
  }
};

