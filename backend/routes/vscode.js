// routes/vscode.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase-admin.js';

const router = express.Router();

/**
 * POST /api/vscode/upload-codebase
 * Upload codebase files directly from VS Code extension
 * Similar to GitHub clone but accepts files directly
 */
router.post('/upload-codebase', verifyToken, async (req, res) => {
  try {
    const { appId, files, projectName } = req.body;
    const userId = req.user.uid;

    // Validate request
    if (!appId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'appId is required'
      });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'files array is required and must not be empty'
      });
    }

    // Verify app ownership
    const appsRef = db.collection('apps');
    const appDoc = await appsRef.doc(appId).get();

    if (!appDoc.exists) {
      return res.status(404).json({
        error: 'Not found',
        message: 'App not found'
      });
    }

    const appData = appDoc.data();
    if (appData.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this app'
      });
    }

    // Validate file structure
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.path || file.content === undefined || file.content === null) {
        console.error(`File validation failed at index ${i}:`, {
          hasPath: !!file.path,
          hasContent: file.content !== undefined && file.content !== null,
          fileKeys: Object.keys(file),
          file: JSON.stringify(file).substring(0, 200)
        });
        return res.status(400).json({
          error: 'Validation error',
          message: `Each file must have path and content properties (failed at file ${i})`
        });
      }
    }

    // Limit to 100 files (same as GitHub clone)
    const filesToSave = files.slice(0, 100);

    // Process files - add size and ensure proper structure
    const processedFiles = filesToSave.map(file => ({
      path: file.path,
      content: file.content,
      size: Buffer.byteLength(file.content, 'utf8')
    }));

    // Save codebase to Firestore (same structure as GitHub clone)
    const codebaseRef = db.collection('codebases');
    const codebaseDoc = await codebaseRef.add({
      appId: appId,
      userId: userId,
      source: 'vscode', // Mark as VS Code upload
      projectName: projectName || 'VS Code Project',
      files: processedFiles,
      fileCount: processedFiles.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update app status to 'audit' (ready for audit) and set codebaseId
    await appsRef.doc(appId).update({
      status: 'audit',
      codebaseId: codebaseDoc.id,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      codebaseId: codebaseDoc.id,
      fileCount: processedFiles.length,
      message: 'Codebase uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading codebase:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to upload codebase'
    });
  }
});

export default router;