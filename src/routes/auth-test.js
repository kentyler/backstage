// auth-test.js
import express from 'express';
import authenticate from '../middleware/simplified-auth.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const router = express.Router();

// This route creates a token and sets it as a cookie AND returns it in the response
// This supports both approaches from the dual authentication system
router.post('/login', (req, res) => {
  // For this test endpoint, we'll skip password validation
  // Just use a simple test user
  const testUser = {
    participantId: 999,
    name: 'Test User',
    email: 'test@example.com',
    clientSchema: 'dev' // Match your actual schema
  };
  
  // Create the token
  const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  // Set as cookie
  const isLocalhost = req.hostname.includes('localhost') || 
                      req.hostname === '127.0.0.1';
                      
  res.cookie('token', token, {
    httpOnly: true,
    secure: !isLocalhost, // Use secure cookies in production
    sameSite: 'Lax',
    maxAge: 3600000, // 1 hour in milliseconds
    path: '/'
  });
  
  // Also return in response body for dual authentication approach
  res.json({
    success: true,
    message: 'Test login successful',
    token: token,
    participant: testUser
  });
});

// This route is protected by our simplified auth middleware
router.get('/protected', authenticate, (req, res) => {
  // This will only execute if authentication succeeds
  res.json({
    success: true,
    message: 'You are authenticated!',
    user: req.user,
    isLoggedIn: true,
    timestamp: new Date().toISOString()
  });
});

export default router;
