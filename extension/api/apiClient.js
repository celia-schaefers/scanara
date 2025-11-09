// src/api/apiClient.js
const fetch = require('node-fetch');
const config = require('../config');

class ApiClient {
    constructor(authManager) {
        this.authManager = authManager;
        this.baseUrl = config.apiUrl;
    }

    async makeRequest(endpoint, options = {}) {
        const token = await this.authManager.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            let errorMessage = `API error: ${response.status}`;
            try {
                const error = await response.json();
                errorMessage = error.message || error.error || errorMessage;
            } catch (e) {
                errorMessage = await response.text();
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    }

    async createApp(appName) {
        return await this.makeRequest('/api/apps/create', {
            method: 'POST',
            body: JSON.stringify({ appName }),
        });
    }

    async getApps() {
        const response = await this.makeRequest('/api/apps');
        return response.apps;
    }

    async uploadCodebase(appId, files, projectName) {
        return await this.makeRequest('/api/vscode/upload-codebase', {
            method: 'POST',
            body: JSON.stringify({
                appId,
                files,
                projectName,
            }),
        });
    }

    async runAudit(appId) {
        return await this.makeRequest('/api/audit/run', {
            method: 'POST',
            body: JSON.stringify({ appId }),
        });
    }

    async getAuditHistory(appId) {
        const response = await this.makeRequest(`/api/audit/history/${appId}`);
        return response.audits;
    }
}

module.exports = { ApiClient };