import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase-admin.js';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clean up temp directory with retry logic for Windows
 */
async function cleanupTempDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Use rimraf-like approach: remove files first, then directory
      const removeDir = async (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            await removeDir(filePath);
          } else {
            fs.unlinkSync(filePath);
          }
        }
        fs.rmdirSync(dir);
      };

      await removeDir(dirPath);
      return;
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        console.error(`Failed to cleanup temp directory after ${maxRetries} attempts:`, error);
        // On Windows, sometimes we need to wait a bit for file handles to release
        if (process.platform === 'win32') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
          } catch (finalError) {
            console.error('Final cleanup attempt failed:', finalError);
            // Don't throw - just log the error
          }
        }
        return;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

const router = express.Router();

// GitHub OAuth credentials - configured via apphosting.yaml secrets
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

// Validate required environment variables
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
  console.error('ERROR: GitHub OAuth credentials not set in environment variables');
  console.error('Required: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI');
}

/**
 * GET /api/github/auth
 * Initiate GitHub OAuth flow
 */
router.get('/auth', verifyToken, (req, res) => {
  const { appId } = req.query;
  const state = req.user.uid + '|' + appId; // Encode user ID and app ID in state
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo&state=${encodeURIComponent(state)}`;
  
  res.json({
    success: true,
    authUrl: authUrl
  });
});

/**
 * GET /api/github/callback
 * Handle GitHub OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup/${state.split('|')[1]}/github?error=oauth_failed`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup/${state.split('|')[1]}/github?error=token_failed`);
    }

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    const githubUser = userResponse.data;
    const [userId, appId] = state.split('|');

    // Save GitHub token to Firestore
    const githubTokensRef = db.collection('github_tokens');
    await githubTokensRef.doc(userId).set({
      userId: userId,
      appId: appId,
      accessToken: access_token,
      githubUsername: githubUser.login,
      githubUserId: githubUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup/${appId}/github?success=true&token=${access_token}`);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    const appId = req.query.state ? req.query.state.split('|')[1] : 'unknown';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup/${appId}/github?error=oauth_error`);
  }
});

/**
 * GET /api/github/repos
 * Get user's GitHub repositories
 */
router.get('/repos', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get GitHub token from Firestore
    const githubTokensRef = db.collection('github_tokens');
    const tokenDoc = await githubTokensRef.doc(userId).get();

    if (!tokenDoc.exists) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'GitHub not connected. Please authorize first.'
      });
    }

    const tokenData = tokenDoc.data();
    const accessToken = tokenData.accessToken;

    // Fetch repositories from GitHub
    const reposResponse = await axios.get('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const repos = reposResponse.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
    }));

    res.json({
      success: true,
      repos: repos
    });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch repositories'
    });
  }
});

/**
 * POST /api/github/clone
 * Clone a GitHub repository and save to Firestore
 */
router.post('/clone', verifyToken, async (req, res) => {
  try {
    const { appId, repoUrl, repoName } = req.body;
    const userId = req.user.uid;

    if (!appId || !repoUrl) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'appId and repoUrl are required'
      });
    }

    // Get GitHub token
    const githubTokensRef = db.collection('github_tokens');
    const tokenDoc = await githubTokensRef.doc(userId).get();

    if (!tokenDoc.exists) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'GitHub not connected'
      });
    }

    const tokenData = tokenDoc.data();
    const accessToken = tokenData.accessToken;

    // Create temp directory for cloning (use OS temp directory to avoid OneDrive sync issues)
    const osTempDir = os.tmpdir();
    const tempDir = path.join(osTempDir, `scanara-repo-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Clone repository with token
      // Format: https://token@github.com/owner/repo.git
      const cloneUrl = repoUrl.replace('https://github.com/', `https://${accessToken}@github.com/`);
      await execAsync(`git clone ${cloneUrl} .`, { cwd: tempDir });

      // Read all code files
      const codeFiles = [];
      const readFiles = (dir, basePath = '') => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const relativePath = path.join(basePath, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            // Skip node_modules, .git, and other common ignored directories
            if (!['node_modules', '.git', 'dist', 'build', '.next', '.cache'].includes(file)) {
              readFiles(filePath, relativePath);
            }
          } else {
            // Only include code files
            const ext = path.extname(file);
            const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala', '.dart', '.vue', '.svelte'];
            if (codeExtensions.includes(ext) || !ext) {
              try {
                const content = fs.readFileSync(filePath, 'utf-8');
                codeFiles.push({
                  path: relativePath,
                  content: content,
                  size: stat.size,
                });
              } catch (err) {
                console.error(`Error reading file ${filePath}:`, err);
              }
            }
          }
        });
      };

      readFiles(tempDir);

      // Save codebase to Firestore
      const codebaseRef = db.collection('codebases');
      const codebaseDoc = await codebaseRef.add({
        appId: appId,
        userId: userId,
        repoUrl: repoUrl,
        repoName: repoName,
        files: codeFiles,
        fileCount: codeFiles.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update app status to 'audit' (ready for audit)
      const appsRef = db.collection('apps');
      await appsRef.doc(appId).update({
        status: 'audit',
        codebaseId: codebaseDoc.id,
        updatedAt: new Date().toISOString(),
      });

      // Clean up temp directory (with retry for Windows)
      await cleanupTempDir(tempDir);

      res.json({
        success: true,
        codebaseId: codebaseDoc.id,
        fileCount: codeFiles.length,
        message: 'Repository cloned and saved successfully'
      });
    } catch (cloneError) {
      // Clean up temp directory on error (with retry)
      await cleanupTempDir(tempDir).catch(err => {
        console.error('Failed to cleanup temp directory:', err);
      });
      throw cloneError;
    }
  } catch (error) {
    console.error('Error cloning repository:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to clone repository'
    });
  }
});

export default router;

