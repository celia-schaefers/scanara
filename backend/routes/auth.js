import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { auth } from '../config/firebase-admin.js';

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verify Firebase ID token from frontend
 */
router.post('/verify', verifyToken, async (req, res) => {
  try {
    // Token is already verified by middleware
    // Return user info
    res.json({
      success: true,
      user: req.user,
      message: 'Token verified successfully'
    });
  } catch (error) {
    console.error('Error in verify endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/check
 * Check if user is authenticated
 */
router.get('/check', verifyToken, async (req, res) => {
  try {
    // If middleware passes, user is authenticated
    res.json({
      authenticated: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error in check endpoint:', error);
    res.status(500).json({
      authenticated: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;

