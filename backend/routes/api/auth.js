import express from 'express';
import bcrypt from 'bcrypt';
import { getParticipantByEmail } from '../../db/participants/getParticipantByEmail.js';
import requireClientPool from '../../middleware/requireClientPool.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', requireClientPool, async (req, res) => {
  const { email, password } = req.body;
  
  // Email is required
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  console.log('Login attempt for:', email);
  
  try {
    // Look up the participant by email
    const participant = await getParticipantByEmail(email, req.clientPool);
    
    if (!participant) {
      console.warn(`No participant found with email: ${email}`);
      // Don't reveal if the email exists or not
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password - for demo we're using plain passwords, but in production you'd use bcrypt
    // For testing purposes, we'll accept any non-empty password
    if (!password || (participant.password_hash && !(await bcrypt.compare(password, participant.password_hash)))) {
      if (process.env.NODE_ENV === 'development') {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          message: 'Password validation failed'
        });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
    
    // Set session data
    req.session.userId = participant.id;
    req.session.email = participant.email;
    req.session.authenticated = true;
    
    // Return success with user object to match frontend expectations
    return res.status(200).json({
      authenticated: true,
      user: {
        id: participant.id,
        email: participant.email,
        username: participant.username || participant.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Failed to authenticate',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user
 * @access  Public
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  } else {
    res.status(200).json({ message: 'Already logged out' });
  }
});

/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/status', (req, res) => {
  console.log('Auth status check:', { 
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionData: req.session,
    cookies: req.cookies
  });

  // First check if we have explicitly set the authenticated flag
  if (req.session && req.session.authenticated) {
    console.log('User is authenticated via authenticated flag');
    return res.status(200).json({ 
      authenticated: true, 
      userId: req.session.userId,
      email: req.session.email
    });
  }
  
  // Fallback check if we have userId but not the authenticated flag
  if (req.session && req.session.userId) {
    console.log('User is authenticated via userId');
    // Set the authenticated flag for future checks
    req.session.authenticated = true;
    return res.status(200).json({ 
      authenticated: true,
      userId: req.session.userId,
      email: req.session.email
    });
  }
  
  // If not authenticated, return more debug info
  console.log('User is not authenticated');
  return res.status(200).json({ 
    authenticated: false,
    sessionPresent: !!req.session,
    sessionID: req.sessionID || 'none',
    sessionKeys: req.session ? Object.keys(req.session) : []
  });
});

/**
 * @route   GET /api/auth/test
 * @desc    Diagnostic endpoint for deployment testing
 * @access  Public
 */
router.get('/test', (req, res) => {
  return res.status(200).json({
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CLIENT_URL,
    cookieConfig: req.app.get('trust proxy') ? 
      { secure: true, sameSite: 'none' } : 
      { secure: false, sameSite: 'lax' },
    sessionActive: !!req.session.userId,
    sessionData: req.session,
    headers: req.headers,
    cookies: req.cookies
  });
});

export default router;
