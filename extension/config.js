// src/config.js

// Toggle this for local vs production testing
const USE_LOCAL = true;

const config = {
    // API URLs
    apiUrl: USE_LOCAL 
        ? 'http://localhost:5000'
        : 'https://testingbackend--rnglab3303.us-east4.hosted.app',
    
    // Web dashboard URL
    webUrl: USE_LOCAL
        ? 'http://localhost:5173'
        : 'https://your-web-app-url.com',
    
    // Firebase API Key (can be overridden in VS Code settings)
    defaultFirebaseApiKey: 'AIzaSyB4z0HPzkI5YPsCVjWIQNyFbXsRc2MBkF0'
};

module.exports = config;