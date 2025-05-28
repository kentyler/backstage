/**
 * API route for user login
 * @module routes/api/auth/login
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { getParticipantByEmail } from '../../../db/participants/getParticipantByEmail.js';
import requireClientPool from '../../../middleware/requireClientPool.js';
import { logEvent, EVENT_CATEGORY, EVENT_TYPE } from '../../../services/eventLogger.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', requireClientPool, async (req, res, next) => {
  console.log('=============================================');
  console.log('LOGIN ROUTE ACCESSED:', { email: req.body?.email });
  console.log('REQ.CLIENTPOOL:', req.clientPool ? 'EXISTS' : 'MISSING');
  console.log('REQ.SCHEMANAME:', req.schemaName);
  console.log('=============================================');
  
  const { email, password } = req.body;
  
  // Email is required
  if (!email) {
    return next(new ApiError('Email is required', 400));
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
      return next(new ApiError('Invalid credentials', 401));
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
      
      const errorDetails = process.env.NODE_ENV === 'development' 
        ? { message: 'Password validation failed' } 
        : undefined;
      
      return next(new ApiError('Invalid credentials', 401, errorDetails));
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
    
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { message: error.message } 
      : undefined;
    
    return next(new ApiError('Failed to authenticate', 500, errorDetails));
  }
});

export default router;
