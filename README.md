# Express React Authentication Test

A minimal application to test and debug authentication and proxy issues.

## Project Structure

- `/backend` - Express server with authentication endpoints
- `/frontend` - React client application

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Install dependencies:
```
npm install
```

3. Start the server:
```
npm start
```

The Express server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```
cd frontend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

The React app will run on http://localhost:3000

## Debugging Authentication Loop Issues

This application provides:

- Simple authentication flow with login/logout
- Session management
- Protected API endpoints
- CORS configured for cross-origin requests
- Detailed request/response logging in the browser console

To debug authentication/proxy loop issues:
1. Open browser developer tools (F12)
2. Monitor the Network tab and Console for repeated requests
3. Check for proper cookie handling in request/response headers
4. Verify proxy settings in package.json

## API Endpoints

- `POST /api/login` - Login with any username/password
- `POST /api/logout` - Logout
- `GET /api/groups` - Get sample groups (requires authentication)
- `GET /api/auth-status` - Check authentication status
