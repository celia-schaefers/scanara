  <img width="2934" height="1596" alt="image" src="https://github.com/user-attachments/assets/f5629eaa-ba67-46ca-b083-23358b8ce46c" />

Scanara AI helps developers and organizations quickly determine if their app or project is HIPAA compliant. Users can check their codebase 3 ways:
* Connecting a GitHub repo in the web app
* Using the VS Code extension
* Installing the npm package

The app scans the project, detects missing security elements, and generates a detailed compliance report highlighting violations, missing safeguards, and recommended fixes — giving teams a clear path to HIPAA alignment.


* System Architect

Firebase Authentication Backend & Frontend
A complete authentication system with Node.js/Express backend and React frontend using Firebase Authentication.

Architecture
Backend: Node.js + Express with Firebase Admin SDK for token verification
Frontend: React (Vite) with Firebase Client SDK
Authentication Flow: Login → Backend verifies token → Redirect to Dashboard
Pages: Index (landing/login) → Dashboard (after authentication)
Setup Instructions
Backend Setup
Navigate to the backend directory:
cd backend
Install dependencies:
npm install
The .env file has been created with Firebase Admin SDK credentials. Make sure it's properly configured.

Start the backend server:

npm start
The server will run on http://localhost:5000

Frontend Setup
Navigate to the frontend directory:
cd frontend
Create a .env file in the frontend directory with the following content:
VITE_FIREBASE_API_KEY=AIzaSyB4z0HPzkI5YPsCVjWIQNyFbXsRc2MBkF0
VITE_FIREBASE_AUTH_DOMAIN=scanaraai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=scanaraai
VITE_FIREBASE_STORAGE_BUCKET=scanaraai.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=840074904641
VITE_FIREBASE_APP_ID=1:840074904641:web:7f10e0ee9eec577de972c0
VITE_FIREBASE_MEASUREMENT_ID=G-QVCDEXRW34
VITE_BACKEND_URL=http://localhost:5000
Install dependencies:
npm install
Start the development server:
npm run dev
The frontend will run on http://localhost:5173

Authentication Flow
User visits the landing page (Index) at /
User logs in with email/password or Google sign-in
Frontend gets Firebase ID token after successful authentication
Frontend sends token to backend /api/auth/verify endpoint
Backend verifies token using Firebase Admin SDK
On successful verification, user is redirected to Dashboard at /dashboard
Dashboard is protected and requires authentication
Features
Email/Password authentication
Google Sign-In authentication
Backend token verification
Protected routes
Session management with localStorage
Responsive UI
API Endpoints
POST /api/auth/verify
Verifies Firebase ID token from frontend

Headers: Authorization: Bearer <token>
Returns: User information if token is valid
GET /api/auth/check
Checks if user is authenticated

Headers: Authorization: Bearer <token>
Returns: Authentication status and user information
Security Notes
Service account credentials are stored in .env file (not committed to git)
All sensitive data uses environment variables
CORS is configured for frontend communication
Token verification happens on backend for all protected routes
Project Structure
backend/
  ├── config/
  │   └── firebase-admin.js
  ├── middleware/
  │   └── auth.js
  ├── routes/
  │   └── auth.js
  ├── .env
  ├── .gitignore
  ├── package.json
  └── server.js

frontend/
  ├── src/
  │   ├── config/
  │   │   └── firebase.js
  │   ├── services/
  │   │   └── auth.js
  │   ├── pages/
  │   │   ├── Index.jsx
  │   │   └── Dashboard.jsx
  │   ├── components/
  │   │   └── ProtectedRoute.jsx
  │   ├── App.jsx
  │   └── main.jsx
  ├── .env
  ├── .gitignore
  ├── package.json
  └── vite.config.js
