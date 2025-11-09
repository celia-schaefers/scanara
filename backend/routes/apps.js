import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase-admin.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Generate a unique API key
 */
function generateApiKey() {
  const prefix = 'sk_';
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('base64url');
  return prefix + key;
}

/**
 * POST /api/apps/create
 * Create a new app with API key
 */
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { appName } = req.body;
    const userId = req.user.uid;

    // Validate app name
    if (!appName || appName.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'App name is required'
      });
    }

    if (appName.length > 100) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'App name must be less than 100 characters'
      });
    }

    // Generate API key
    const apiKey = generateApiKey();

    // Create app document
    const appData = {
      name: appName.trim(),
      userId: userId,
      apiKey: apiKey,
      status: 'setup', // setup -> configured -> audit
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save app to Firestore
    const appsRef = db.collection('apps');
    const docRef = await appsRef.add(appData);

    // Save API key separately in API collection
    const apiData = {
      appId: docRef.id,
      userId: userId,
      apiKey: apiKey,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    const apiRef = db.collection('api');
    await apiRef.add(apiData);

    // Return app data (including API key)
    res.status(201).json({
      success: true,
      app: {
        id: docRef.id,
        name: appData.name,
        apiKey: apiKey,
        createdAt: appData.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating app:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to create app'
    });
  }
});

/**
 * GET /api/apps
 * Get all apps for the authenticated user
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all apps for this user from Firestore
    const appsRef = db.collection('apps');
    const snapshot = await appsRef.where('userId', '==', userId).get();

    const apps = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      apps.push({
        id: doc.id,
        name: data.name,
        status: data.status || 'setup', // Default to 'setup' if not set
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
        // Note: API key is not returned for security reasons
      });
    });

    // Sort by creation date (newest first)
    apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      apps: apps
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch apps'
    });
  }
});

export default router;

