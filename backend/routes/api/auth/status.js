/**
 * API route for checking authentication status
 * @module routes/api/auth/status
 */

import express from 'express';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/status', (req, res, next) => {
  try {
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
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return next(new ApiError('Error checking authentication status', 500, { cause: error }));
  }
});

export default router;
