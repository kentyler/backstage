/**
 * Event logging API routes
 */
import express from 'express';
import { logEvent } from '../../services/eventLogger.js';
import { requireClientPool } from '../../middleware/requireClientPool.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

/**
 * @route POST api/events/log
 * @desc Log a user event
 * @access Private (requires authentication)
 */
router.post('/log', auth, requireClientPool, async (req, res) => {
  try {
    const { eventType, description, details } = req.body;
    
    // Get participant ID from session
    const participantId = req.session?.userId;
    
    if (!participantId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to log events' 
      });
    }
    
    if (!eventType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event type is required' 
      });
    }
    
    // Log the event
    const result = await logEvent({
      schemaName: req.schemaName || 'public',
      participantId,
      eventType,
      description: description || 'No description provided',
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, req.clientPool);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Event logged successfully',
      data: result
    });
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while logging event',
      error: error.message
    });
  }
});

export default router;
