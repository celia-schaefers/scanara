import { db } from '../config/firebase-admin.js';

/**
 * Middleware to verify API key
 * Extracts API key from Authorization header and verifies it
 */
export const verifyApiKey = async (req, res, next) => {
  try {
    // Get API key from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No API key provided or invalid format' 
      });
    }

    const apiKey = authHeader.split('Bearer ')[1];

    // Verify API key exists in Firestore
    const apiRef = db.collection('api');
    const snapshot = await apiRef.where('apiKey', '==', apiKey).where('isActive', '==', true).get();

    if (snapshot.empty) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or inactive API key' 
      });
    }

    // Get API key document
    const apiDoc = snapshot.docs[0];
    const apiData = apiDoc.data();

    // Attach API key info to request object
    req.apiKey = apiKey;
    req.apiKeyData = apiData;
    req.userId = apiData.userId;
    req.appId = apiData.appId;

    next();
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid API key' 
    });
  }
};

