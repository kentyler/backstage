import express from 'express';
import bcrypt from 'bcrypt';
import { getParticipantByEmail } from '../../db/participants/getParticipantByEmail.js';
import requireClientPool from '../../middleware/requireClientPool.js';
import { logEvent, EVENT_CATEGORY, EVENT_TYPE } from '../../services/eventLogger.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', requireClientPool, async (req, res) => {
  console.log('=============================================');
  console.log('LOGIN ROUTE ACCESSED:', { email: req.body?.email });
  console.log('REQ.CLIENTPOOL:', req.clientPool ? 'EXISTS' : 'MISSING');
  console.log('REQ.SCHEMANAME:', req.schemaName);
  console.log('=============================================');
  
  const { email, password } = req.body;
  
  // Email is required
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Look up the participant by email
    const participant = await getParticipantByEmail(email, req.clientPool);
    
    if (!participant) {
      // Log the "login not found" event (ID: 3)
      await logEvent({
        schemaName: req.schemaName || 'public',
        participantId: null, // No participant ID since user doesn't exist
        eventType: 3, // 'login not found' event type ID
        description: `Login attempt with non-existent email: ${email}`,
        details: { email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }, req.clientPool);
      
      // Don't reveal if the email exists or not
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password - for demo we're using plain passwords, but in production you'd use bcrypt
    // For testing purposes, we'll accept any non-empty password
    if (!password || (participant.password_hash && !(await bcrypt.compare(password, participant.password_hash)))) {
      // Log the "login unsuccessful" event (ID: 2)
      await logEvent({
        schemaName: req.schemaName || 'public',
        participantId: participant.id, // We have a valid participant ID here
        eventType: 2, // 'login unsuccessful' event type ID
        description: `Failed login attempt for ${email}`,
        details: { email, reason: 'Password validation failed' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }, req.clientPool);
      
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
    
    // Log the "login successful" event (ID: 1)
    await logEvent({
      schemaName: req.schemaName || 'public',
      participantId: participant.id,
      eventType: 1, // 'login successful' event type ID
      description: `Successful login for ${email}`,
      details: { email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, req.clientPool);
    
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
    
    // Log server error during login attempt (using 'login unsuccessful' event type)
    await logEvent({
      schemaName: req.schemaName || 'public',
      participantId: null, // No participant ID in case of server error
      eventType: 2, // Using 'login unsuccessful' event type ID since we don't have a specific error type
      description: `Error during login attempt: ${error.message}`,
      details: { email, error: error.message, stack: error.stack },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, req.clientPool);
    
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
router.post('/logout', requireClientPool, async (req, res) => {
  console.log('=============================================');
  console.log('LOGOUT ROUTE ACCESSED');
    try {
        // If we have a session, grab the participant ID before destroying the session
        const participantId = req.session?.userId;
        const email = req.session?.email;
        console.log(`Logout for participant: ${participantId}, email: ${email}`);

        // Always attempt to log the event, even if we hit an error later
        // This ensures the logout is recorded even if session destruction fails
        if (participantId) {
            try {
                await logEvent({
                    schemaName: req.schemaName || 'public',
                    participantId: participantId,
                    eventType: EVENT_TYPE.LOGOUT,
                    description: `User logged out: ${email || 'unknown'}`,
                    details: { 
                        email: email || 'unknown',
                        method: 'explicit_logout',
                        timestamp: new Date().toISOString() 
                    },
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }, req.clientPool);
                console.log('✅ Successfully logged logout event for participant:', participantId);
            } catch (logError) {
                console.error('❌ Failed to log logout event:', logError);
                // Continue with logout even if logging fails
            }
        } else {
            console.log('⚠️ No participant ID found in session for logout event');
        }

        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('❌ Error destroying session:', err);
            } else {
                console.log('✅ Session successfully destroyed');
            }

            // Clear the cookie regardless of session
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
            });

            // Return success response
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        });
    } catch (error) {
        console.error('❌ Error in logout route:', error);
        res.status(500).json({ success: false, message: 'Server error during logout' });
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
