import express from 'express';
import { verifyApiKey } from '../middleware/apiKeyAuth.js';
import { db } from '../config/firebase-admin.js';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function generateApiKey() {
  const prefix = 'sk_';
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('base64url');
  return prefix + key;
}

function createHIPAAAnalysisPrompt(codebase, repoName = 'unknown') {
  return `You are an automated HIPAA Compliance Auditor. Analyze the codebase and return structured JSON with compliance findings.

Codebase:
${codebase}

Return JSON with scores, summary, detailed_findings, and remediation_plan.`;
}

router.post('/verify', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'Validation error', message: 'API key is required' });
    }
    const apiRef = db.collection('api');
    const snapshot = await apiRef.where('apiKey', '==', apiKey).where('isActive', '==', true).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or inactive API key' });
    }
    const apiDoc = snapshot.docs[0];
    const apiData = apiDoc.data();
    const appsRef = db.collection('apps');
    const appDoc = await appsRef.doc(apiData.appId).get();
    const appData = appDoc.exists ? appDoc.data() : null;
    res.json({
      success: true,
      connected: true,
      message: 'Connected successfully',
      app: appData ? { id: apiData.appId, name: appData.name, status: appData.status } : null
    });
  } catch (error) {
    console.error('Error verifying API key:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to verify API key' });
  }
});

router.post('/create-app', verifyApiKey, async (req, res) => {
  try {
    const { appName } = req.body;
    const userId = req.userId;
    if (!appName || appName.trim().length === 0) {
      return res.status(400).json({ error: 'Validation error', message: 'App name is required' });
    }
    const apiKey = generateApiKey();
    const appData = { name: appName.trim(), userId: userId, apiKey: apiKey, status: 'setup', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const appsRef = db.collection('apps');
    const docRef = await appsRef.add(appData);
    const apiData = { appId: docRef.id, userId: userId, apiKey: apiKey, createdAt: new Date().toISOString(), isActive: true };
    const apiRef = db.collection('api');
    await apiRef.add(apiData);
    res.status(201).json({ success: true, message: 'App created successfully', app: { id: docRef.id, name: appData.name, apiKey: apiKey, createdAt: appData.createdAt } });
  } catch (error) {
    console.error('Error creating app:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to create app' });
  }
});

router.post('/audit', verifyApiKey, async (req, res) => {
  try {
    const { appName, codebase } = req.body;
    const userId = req.userId;
    const apiKey = req.apiKey;
    if (!codebase || !appName) {
      return res.status(400).json({ error: 'Validation error', message: 'appName and codebase are required' });
    }
    let appId = req.appId;
    if (!appId) {
      const appsRef = db.collection('apps');
      const newAppData = { name: appName.trim(), userId: userId, apiKey: apiKey, status: 'audit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const docRef = await appsRef.add(newAppData);
      appId = docRef.id;
      const apiRef = db.collection('api');
      await apiRef.add({ appId: appId, userId: userId, apiKey: apiKey, createdAt: new Date().toISOString(), isActive: true });
    }
    let codebaseText = Array.isArray(codebase) ? codebase.map(f => `=== File: ${f.path} ===\n${f.content}\n`).join('\n\n') : (typeof codebase === 'string' ? codebase : '');
    if (codebaseText.length > 500000) codebaseText = codebaseText.substring(0, 500000);
    const auditRef = db.collection('audits');
    const auditDoc = await auditRef.add({ appId: appId, userId: userId, status: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    try {
      const prompt = createHIPAAAnalysisPrompt(codebaseText, appName);
      const openaiResponse = await axios.post(OPENAI_API_URL, { model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a HIPAA compliance expert. Analyze code and return structured JSON with compliance findings.' }, { role: 'user', content: prompt }], temperature: 0.2, max_tokens: 8000, response_format: { type: 'json_object' } }, { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
      const content = openaiResponse.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      const overallScore = analysisResult.scores?.overall_score || 0;
      const complianceStatus = overallScore >= 80 ? 'Compliant' : (overallScore >= 60 ? 'Needs Attention' : 'Non-Compliant');
      await auditRef.doc(auditDoc.id).update({ status: 'completed', complianceScore: overallScore, complianceStatus: complianceStatus, metadata: analysisResult.metadata || {}, scores: analysisResult.scores || {}, summary: analysisResult.summary || {}, detailedFindings: analysisResult.detailed_findings || [], remediationPlan: analysisResult.remediation_plan || [], updatedAt: new Date().toISOString() });
      const appsRef = db.collection('apps');
      await appsRef.doc(appId).update({ latestAuditId: auditDoc.id, latestAuditScore: overallScore, status: 'audit', updatedAt: new Date().toISOString() });
      res.json({ success: true, message: 'Audit completed successfully', auditId: auditDoc.id, complianceScore: overallScore, status: complianceStatus, scores: analysisResult.scores || {}, summary: analysisResult.summary || {}, findings: analysisResult.detailed_findings || [], remediationPlan: analysisResult.remediation_plan || [] });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      await auditRef.doc(auditDoc.id).update({ status: 'failed', error: openaiError.message || 'Failed to analyze codebase', updatedAt: new Date().toISOString() });
      throw new Error(`OpenAI API error: ${openaiError.message || 'Failed to analyze codebase'}`);
    }
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to run audit' });
  }
});

export default router;
