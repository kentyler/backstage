/**
 * API route for user logout
 * @module routes/api/auth/logout
 */

import express from 'express';
import requireClientPool from '../../../middleware/requireClientPool.js';
import { logEvent, EVENT_CATEGORY, EVENT_TYPE } from '../../../services/eventLogger.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user
 * @access  Public
 */
router.post('/logout', requireClientPool, async (req, res, next) => {
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
        return next(new ApiError('Error destroying session', 500, { cause: err }));
      }

      console.log('✅ Session successfully destroyed');
      
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
    return next(new ApiError('Server error during logout', 500, { cause: error }));
  }
});

export default router;
