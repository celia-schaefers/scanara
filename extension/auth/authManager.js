// src/auth/authManager.js
const vscode = require('vscode');
const fetch = require('node-fetch');


class AuthManager {
    static TOKEN_KEY = 'scanara.authToken';
    static USER_KEY = 'scanara.user';
    static REFRESH_TOKEN_KEY = 'scanara.refreshToken';

    constructor(context) {
        this.context = context;
    }

    async login() {
        // Get Firebase API key from configuration (or use default)
        const config = vscode.workspace.getConfiguration('scanara');
        const firebaseApiKey = config.get('firebaseApiKey') || 
            'AIzaSyB4z0HPzkI5YPsCVjWIQNyFbXsRc2MBkF0';

        const email = await vscode.window.showInputBox({
            prompt: 'Enter your email',
            placeHolder: 'user@example.com',
            ignoreFocusOut: true,
        });

        if (!email) {
            throw new Error('Email is required');
        }

        const password = await vscode.window.showInputBox({
            prompt: 'Enter your password',
            password: true,
            ignoreFocusOut: true,
        });

        if (!password) {
            throw new Error('Password is required');
        }

        // Sign in with Firebase Auth REST API
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    returnSecureToken: true,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Authentication failed');
        }

        const data = await response.json();

        // Verify token with backend
        const verifyResponse = await fetch(
            'https://prodpush--scanaraai.us-east4.hosted.app/api/auth/verify',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${data.idToken}`,
                },
            }
        );

        if (!verifyResponse.ok) {
            throw new Error('Backend verification failed');
        }

        const verifyData = await verifyResponse.json();

        // Store tokens securely
        await this.context.secrets.store(AuthManager.TOKEN_KEY, data.idToken);
        await this.context.secrets.store(AuthManager.REFRESH_TOKEN_KEY, data.refreshToken);
        await this.context.globalState.update(AuthManager.USER_KEY, verifyData.user);
    }

    async logout() {
        await this.context.secrets.delete(AuthManager.TOKEN_KEY);
        await this.context.secrets.delete(AuthManager.REFRESH_TOKEN_KEY);
        await this.context.globalState.update(AuthManager.USER_KEY, undefined);
    }

    isAuthenticated() {
        return this.context.globalState.get(AuthManager.USER_KEY) !== undefined;
    }

    async getToken() {
        const token = await this.context.secrets.get(AuthManager.TOKEN_KEY);
        
        if (!token) {
            return undefined;
        }

        // Check if token is expired (tokens expire after 1 hour)
        // If expired, refresh it
        try {
            const verifyResponse = await fetch(
                'https://prodpush--scanaraai.us-east4.hosted.app/api/auth/check',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (verifyResponse.ok) {
                return token;
            }

            // Token expired, try to refresh
            return await this.refreshToken();
        } catch (error) {
            // Token verification failed, try to refresh
            return await this.refreshToken();
        }
    }

    async getUser() {
        return this.context.globalState.get(AuthManager.USER_KEY);
    }

    async refreshToken() {
        const refreshToken = await this.context.secrets.get(AuthManager.REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
            return undefined;
        }

        const config = vscode.workspace.getConfiguration('scanara');
        const firebaseApiKey = config.get('firebaseApiKey') || 
            'AIzaSyB4z0HPzkI5YPsCVjWIQNyFbXsRc2MBkF0';

        try {
            const response = await fetch(
                `https://securetoken.googleapis.com/v1/token?key=${firebaseApiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken,
                    }),
                }
            );

            if (!response.ok) {
                // Refresh failed, user needs to login again
                await this.logout();
                return undefined;
            }

            const data = await response.json();
            const newToken = data.id_token;

            // Store new token
            await this.context.secrets.store(AuthManager.TOKEN_KEY, newToken);

            return newToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            await this.logout();
            return undefined;
        }
    }
}

module.exports = { AuthManager };