// auth-debug.js
import express from 'express';
import { setClientPool } from '../middleware/setClientPool.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// This route will test each component of the authentication system
// and return detailed diagnostics about what's working and what isn't
router.get('/status', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hostname: req.hostname,
    cookies: {
      present: Object.keys(req.cookies || {}).length > 0,
      names: Object.keys(req.cookies || {}),
      token: req.cookies.token ? 'Present (hidden for security)' : 'Not present'
    },
    headers: {
      authorization: req.headers.authorization ? 'Present (starts with: ' + 
        req.headers.authorization.substring(0, 10) + '...)' : 'Not present',
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      accept: req.headers.accept
    },
    database: {
      clientPool: !!req.clientPool,
      schema: req.clientPool?.options?.schema || 'unknown'
    }
  };
  
  // Test JWT Secret
  try {
    const testToken = jwt.sign({ test: true }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const verified = jwt.verify(testToken, process.env.JWT_SECRET);
    diagnostics.jwt = {
      secretConfigured: !!process.env.JWT_SECRET,
      secretLength: process.env.JWT_SECRET?.length || 0,
      tokenCreation: 'Success',
      tokenVerification: 'Success',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    };
  } catch (jwtError) {
    diagnostics.jwt = {
      error: jwtError.message,
      secretConfigured: !!process.env.JWT_SECRET,
      secretLength: process.env.JWT_SECRET?.length || 0
    };
  }
  
  // Test DB connection
  try {
    if (req.clientPool) {
      const result = await req.clientPool.query('SELECT NOW() as current_time');
      diagnostics.database.connection = 'Success';
      diagnostics.database.timestamp = result.rows[0].current_time;
    } else {
      diagnostics.database.connection = 'No client pool available';
    }
  } catch (dbError) {
    diagnostics.database.connection = 'Failed';
    diagnostics.database.error = dbError.message;
  }
  
  return res.json(diagnostics);
});

// This endpoint attempts to create a test auth token and set it as a cookie
router.get('/test-cookie', (req, res) => {
  try {
    // Create a test token
    const testToken = jwt.sign({ test: true, created: new Date().toISOString() }, 
      process.env.JWT_SECRET, { expiresIn: '5m' });
    
    // Get cookie settings based on environment
    const isLocalhost = req.hostname.includes('localhost') || 
                         req.hostname === '127.0.0.1';
    
    // Set cookie with appropriate security settings
    res.cookie('test_token', testToken, {
      httpOnly: true,
      secure: !isLocalhost, // Use secure cookies in production
      sameSite: 'Lax',
      maxAge: 300000, // 5 minutes in milliseconds
      path: '/'
    });
    
    return res.json({
      success: true,
      message: 'Test cookie set successfully',
      cookieSettings: {
        httpOnly: true,
        secure: !isLocalhost,
        sameSite: 'Lax',
        maxAge: 300000,
        path: '/'
      },
      token: testToken.substring(0, 10) + '...'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// This endpoint tries to read the test cookie
router.get('/check-cookie', (req, res) => {
  const testToken = req.cookies.test_token;
  
  if (!testToken) {
    return res.json({
      success: false,
      message: 'Test cookie not found',
      allCookies: Object.keys(req.cookies || {})
    });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    
    return res.json({
      success: true,
      message: 'Test cookie found and verified',
      decoded,
      allCookies: Object.keys(req.cookies || {})
    });
  } catch (error) {
    return res.json({
      success: false,
      message: 'Test cookie found but verification failed',
      error: error.message,
      allCookies: Object.keys(req.cookies || {})
    });
  }
});

export default router;
