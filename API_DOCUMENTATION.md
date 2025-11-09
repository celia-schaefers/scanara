# API Documentation

**Base URL:** `https://testingbackend--rnglab3303.us-east4.hosted.app`

**Authentication:** Most endpoints require a Firebase ID token in the `Authorization` header:
```
Authorization: Bearer <firebase_id_token>
```

---

## Table of Contents

1. [Health Check](#1-health-check)
2. [Authentication Endpoints](#2-authentication-endpoints)
3. [App Management Endpoints](#3-app-management-endpoints)
4. [GitHub Integration Endpoints](#4-github-integration-endpoints)
5. [Audit Endpoints](#5-audit-endpoints)
6. [Error Responses](#error-responses)
7. [Getting a Firebase ID Token](#getting-a-firebase-id-token)
8. [Quick Reference](#quick-reference)

---

## 1. Health Check

### GET `/health`
**Description:** Check if server is running  
**Authentication:** None required

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

**Example:**
```bash
curl https://testingbackend--rnglab3303.us-east4.hosted.app/health
```

---

## 2. Authentication Endpoints (`/api/auth`)

### POST `/api/auth/verify`
**Description:** Verify Firebase ID token  
**Authentication:** Required (Firebase token)

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "string",
    "email": "string",
    "emailVerified": boolean,
    "name": "string"
  },
  "message": "Token verified successfully"
}
```

**Example:**
```bash
curl -X POST https://testingbackend--rnglab3303.us-east4.hosted.app/api/auth/verify \
  -H "Authorization: Bearer <token>"
```

---

### GET `/api/auth/check`
**Description:** Check if user is authenticated  
**Authentication:** Required (Firebase token)

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "uid": "string",
    "email": "string",
    "emailVerified": boolean,
    "name": "string"
  }
}
```

**Example:**
```bash
curl -X GET https://testingbackend--rnglab3303.us-east4.hosted.app/api/auth/check \
  -H "Authorization: Bearer <token>"
```

---

## 3. App Management Endpoints (`/api/apps`)

### POST `/api/apps/create`
**Description:** Create a new app with API key  
**Authentication:** Required (Firebase token)

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "appName": "string"  // Required, max 100 characters
}
```

**Response:**
```json
{
  "success": true,
  "app": {
    "id": "string",
    "name": "string",
    "apiKey": "string",  // Only returned on creation
    "createdAt": "ISO8601 string"
  }
}
```

**Example:**
```bash
curl -X POST https://testingbackend--rnglab3303.us-east4.hosted.app/api/apps/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"appName": "My App"}'
```

---

### GET `/api/apps`
**Description:** Get all apps for authenticated user  
**Authentication:** Required (Firebase token)

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "apps": [
    {
      "id": "string",
      "name": "string",
      "status": "string",  // "setup" | "configured" | "audit"
      "createdAt": "ISO8601 string",
      "updatedAt": "ISO8601 string"
    }
  ]
}
```

**Example:**
```bash
curl -X GET https://testingbackend--rnglab3303.us-east4.hosted.app/api/apps \
  -H "Authorization: Bearer <token>"
```

---

## 4. GitHub Integration Endpoints (`/api/github`)

### GET `/api/github/auth`
**Description:** Get GitHub OAuth authorization URL  
**Authentication:** Required (Firebase token)

**Query Parameters:**
- `appId` (required): The app ID

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://github.com/login/oauth/authorize?..."
}
```

**Example:**
```bash
curl -X GET "https://testingbackend--rnglab3303.us-east4.hosted.app/api/github/auth?appId=<app_id>" \
  -H "Authorization: Bearer <token>"
```

---

### GET `/api/github/callback`
**Description:** Handle GitHub OAuth callback (used by GitHub, not directly called)  
**Authentication:** None (handled by OAuth flow)

**Query Parameters:**
- `code`: OAuth code from GitHub
- `state`: State parameter containing user ID and app ID

**Note:** This endpoint redirects to the frontend. Not typically called directly from CLI.

---

### GET `/api/github/repos`
**Description:** Get user's GitHub repositories  
**Authentication:** Required (Firebase token + GitHub must be connected)

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "repos": [
    {
      "id": "number",
      "name": "string",
      "fullName": "string",
      "description": "string",
      "private": boolean,
      "url": "string",
      "cloneUrl": "string",
      "defaultBranch": "string",
      "updatedAt": "ISO8601 string"
    }
  ]
}
```

**Error Response (if GitHub not connected):**
```json
{
  "error": "Unauthorized",
  "message": "GitHub not connected. Please authorize first."
}
```

**Example:**
```bash
curl -X GET https://testingbackend--rnglab3303.us-east4.hosted.app/api/github/repos \
  -H "Authorization: Bearer <token>"
```

---

### POST `/api/github/clone`
**Description:** Clone a GitHub repository and save to Firestore  
**Authentication:** Required (Firebase token + GitHub must be connected)

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "appId": "string",      // Required
  "repoUrl": "string",    // Required (e.g., "https://github.com/owner/repo.git")
  "repoName": "string"    // Optional
}
```

**Response:**
```json
{
  "success": true,
  "codebaseId": "string",
  "fileCount": number,
  "message": "Repository cloned and saved successfully"
}
```

**Example:**
```bash
curl -X POST https://testingbackend--rnglab3303.us-east4.hosted.app/api/github/clone \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "app_id_here",
    "repoUrl": "https://github.com/owner/repo.git",
    "repoName": "My Repository"
  }'
```

---

## 5. Audit Endpoints (`/api/audit`)

### POST `/api/audit/run`
**Description:** Run HIPAA compliance audit on codebase  
**Authentication:** Required (Firebase token)

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "appId": "string"  // Required
}
```

**Response:**
```json
{
  "success": true,
  "auditId": "string",
  "complianceScore": number,  // 0-100
  "status": "string",  // "Compliant" | "Needs Attention" | "Non-Compliant"
  "scores": {
    "overall_score": number,
    "technical_safeguards_score": number,
    "administrative_safeguards_score": number,
    "physical_safeguards_score": number,
    "audit_coverage_score": number,
    "encryption_coverage_percent": number
  },
  "summary": {
    "top_issues_count": number,
    "critical": number,
    "high": number,
    "medium": number,
    "low": number,
    "top_3_findings": [...]
  },
  "findings": [...],
  "metrics": {...},
  "remediationPlan": [...],
  "actionsRequired": {...},
  "componentAnalysis": {...},
  "message": "Audit completed successfully"
}
```

**Example:**
```bash
curl -X POST https://testingbackend--rnglab3303.us-east4.hosted.app/api/audit/run \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"appId": "app_id_here"}'
```

---

### GET `/api/audit/history/:appId`
**Description:** Get audit history for an app  
**Authentication:** Required (Firebase token)

**URL Parameters:**
- `appId` (required): The app ID

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "audits": [
    {
      "id": "string",
      "complianceScore": number,
      "status": "string",
      "summary": {...},
      "findings": [...],
      "scores": {...},
      "metrics": {...},
      "remediationPlan": [...],
      "actionsRequired": {...},
      "componentAnalysis": {...},
      "categories": {...},
      "createdAt": "ISO8601 string",
      "updatedAt": "ISO8601 string"
    }
  ]
}
```

**Example:**
```bash
curl -X GET https://testingbackend--rnglab3303.us-east4.hosted.app/api/audit/history/<app_id> \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

All endpoints may return these error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No token provided or invalid format"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Error description"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error description"
}
```

---

## Getting a Firebase ID Token

To get a Firebase ID token for authentication, use Firebase Auth REST API:

```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<FIREBASE_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password",
    "returnSecureToken": true
  }'
```

The response will include an `idToken` field that you can use in the `Authorization` header.

**Response:**
```json
{
  "kind": "identitytoolkit#VerifyPasswordResponse",
  "localId": "string",
  "email": "string",
  "displayName": "string",
  "idToken": "string",  // Use this in Authorization header
  "registered": true,
  "refreshToken": "string",
  "expiresIn": "3600"
}
```

---

## Quick Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/auth/verify` | Yes | Verify token |
| GET | `/api/auth/check` | Yes | Check auth status |
| POST | `/api/apps/create` | Yes | Create app |
| GET | `/api/apps` | Yes | List apps |
| GET | `/api/github/auth` | Yes | Get GitHub auth URL |
| GET | `/api/github/callback` | No | GitHub OAuth callback |
| GET | `/api/github/repos` | Yes | List GitHub repos |
| POST | `/api/github/clone` | Yes | Clone repository |
| POST | `/api/audit/run` | Yes | Run audit |
| GET | `/api/audit/history/:appId` | Yes | Get audit history |

---

## Notes

- All timestamps are in ISO8601 format
- All endpoints return JSON responses
- Protected endpoints require a valid Firebase ID token
- GitHub endpoints require GitHub OAuth to be completed first
- Audit endpoints require an app with a cloned codebase
- App status values: `setup` → `configured` → `audit`

---

**Last Updated:** November 8, 2025

