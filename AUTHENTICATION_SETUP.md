# Authentication Setup Guide

## Overview
Your Habit Tracker now has a login/signup page with backend API integration. Supports:
- **Email & Password**: Custom account registration and login
- **Google OAuth**: Sign in using your Google account

## Backend API Routes Required

The frontend expects these authentication endpoints:

### POST /api/auth/signup
Create a new user account
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/login
Login with email and password
```json
Request:
{
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/google
Login/signup with Google OAuth token
```json
Request:
{
  "token": "google_jwt_credential_token"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "picture": "google_profile_picture_url"
  }
}
```

## Environment Setup

### 1. Backend API URL Configuration

Create a `.env.local` file in the project root:

```env
# Backend API URL (default: https://habbit-tracker-backend-2rib.onrender.com)
VITE_API_URL=https://habbit-tracker-backend-2rib.onrender.com

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 2. Get Your Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - In the left menu, click "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click it and press "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Select **"Web application"**
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for local development with Vite)
     - `http://localhost:3000` (if using different port)
   - Add authorized redirect URIs:
     - `http://localhost:5173` (same as your dev URL)
   - Copy the **Client ID**
5. Add it to `.env.local`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_copied_client_id_here
   ```

## Frontend API Integration

### Authentication Flow

1. **Signup/Login**: User enters credentials or clicks Google login
2. **API Call**: Frontend sends request to backend endpoint
3. **Token Storage**: Backend returns JWT token and user data
4. **Local Storage**: Frontend stores token and user info
5. **Authenticated Requests**: All subsequent API calls include `Authorization: Bearer {token}` header

### Authenticated Requests

All habit API requests automatically include the auth token:

```javascript
// Example: All fetch calls include authentication header
{
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your_jwt_token"
  }
}
```

### API Endpoints for Habits

These endpoints require the JWT token in the Authorization header:

- `GET /api/habits` - Fetch user's habits
- `POST /api/habits` - Create a new habit
- `PUT /api/habits/{id}` - Update a habit
- `DELETE /api/habits/{id}` - Delete a habit
- `PATCH /api/habits/{id}/progress` - Update habit progress
- `PATCH /api/habits/{id}/toggle` - Toggle habit completion
- `PATCH /api/habits/{id}/archive` - Archive a habit

## Running the App

### 1. Start Backend Server

```bash
# Make sure your backend is running on https://habbit-tracker-backend-2rib.onrender.com
# (or whatever URL is set in VITE_API_URL)
npm run dev  # or your backend start command
```

### 2. Start Frontend Dev Server

```bash
npm run dev
```

The app will open with the login/signup page. You can now:
- Sign up with email and password
- Sign in with existing credentials
- Sign in with Google OAuth
- Access the habit tracker after successful authentication

## Features

### Login/Signup Page
- **Email/Password Registration**: Create account with validation
- **Email/Password Login**: Sign in with credentials
- **Google OAuth**: One-click login/signup with Google
- **Form Validation**: Email format and password length checks
- **Error Handling**: Clear error messages for failed authentication
- **Toggle Auth Mode**: Switch between login and signup

### User Session
- User data displayed in app header
- Logout button to clear session
- Automatic session restoration on page refresh
- Persistent authentication across page reloads

## Security Notes

⚠️ **Backend Responsibilities** (implement these on your backend):

1. **Password Hashing**: Hash passwords with bcrypt or similar
2. **JWT Tokens**: Sign and verify JWT tokens securely
3. **Token Expiration**: Implement token expiration and refresh
4. **Email Validation**: Verify user email addresses
5. **CORS**: Configure CORS to allow frontend domain
6. **HTTPS**: Use HTTPS in production
7. **Rate Limiting**: Implement rate limiting on auth endpoints
8. **Input Validation**: Validate all inputs on backend
9. **CSRF Protection**: Implement CSRF tokens if needed
10. **User Isolation**: Ensure users can only access their own data

## Troubleshooting

### "Failed to fetch from API"
- Verify backend is running on the configured VITE_API_URL
- Check browser console for CORS errors
- Ensure authentication endpoints exist on backend

### "Google login failed"
- Verify VITE_GOOGLE_CLIENT_ID is set in .env.local
- Check Client ID is correct in Google Cloud Console
- Ensure localhost is added to authorized origins

### "Invalid credentials"
- Check email and password are correct
- Verify user exists in backend database
- Check backend password validation logic

### "Token expired"
- Implement token refresh endpoint on backend
- Clear localStorage and re-login
- Check token expiration time on backend

## Next Steps

1. ✅ Frontend authentication UI and API integration ready
2. ⏳ Implement backend auth endpoints (if not done)
3. ⏳ Set up database for user storage
4. ⏳ Implement JWT token generation
5. ⏳ Add email verification
6. ⏳ Implement password reset
7. ⏳ Add 2FA for additional security
