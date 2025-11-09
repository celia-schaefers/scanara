import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';


/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // Verify token with backend
    const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend verification failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return { success: true, user: data.user, token: idToken };
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const idToken = await userCredential.user.getIdToken();
    
    // Verify token with backend
    const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend verification failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return { success: true, user: data.user, token: idToken };
  } catch (error) {
    console.error('Google sign-in error:', error);
    // If it's a network error, provide a more helpful message
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Cannot connect to backend server. Please make sure the backend is running on port 5000.');
    }
    throw error;
  }
};

/**
 * Sign out
 */
export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get current token
 */
export const getCurrentToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

/**
 * Auth state observer
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

