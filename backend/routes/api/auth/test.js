/**
 * API route for diagnostic testing
 * @module routes/api/auth/test
 */

import express from 'express';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/auth/test
 * @desc    Diagnostic endpoint for deployment testing
 * @access  Public
 */
router.get('/test', (req, res, next) => {
  try {
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
  } catch (error) {
    console.error('Error in diagnostic test endpoint:', error);
    return next(new ApiError('Error in diagnostic test endpoint', 500, { cause: error }));
  }
});

export default router;
