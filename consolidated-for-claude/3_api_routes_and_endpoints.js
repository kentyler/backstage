/**
 * CONSOLIDATED FILE: API Routes and Endpoints
 * 
 * This file contains the key API routes and endpoints:
 * 1. Main API router
 * 2. Conversation and message endpoints
 * 3. User and participant endpoints
 * 4. Topic management
 */

//=============================================================================
// MAIN API ROUTER
//=============================================================================

/**
 * Main API router
 * Path: backend/routes/api/index.js
 */

import express from 'express';
import messagesRouter from './messages/index.js';
import topicsRouter from './topics/index.js';
import participantsRouter from './participants/index.js';
import fileUploadsRouter from './fileUploads/fileUpload.js';
import healthRouter from './health/index.js';
import { authenticateRequest } from '../../middleware/auth.js';

const router = express.Router();

// Health check endpoint - no authentication required
router.use('/health', healthRouter);

// Apply authentication middleware to protected routes
router.use(authenticateRequest);

// API routes
router.use('/messages', messagesRouter);
router.use('/topics', topicsRouter);
router.use('/participants', participantsRouter);
router.use('/file-uploads', fileUploadsRouter);

export default router;

//=============================================================================
// MESSAGES API
//=============================================================================

/**
 * Messages API router
 * Path: backend/routes/api/messages/index.js
 */

import express from 'express';
import { getMessages } from '../../../services/messages/messageService.js';
import { createMessage } from '../../../services/messages/createMessage.js';
import { searchMessages } from '../../../services/messages/searchMessages.js';

const router = express.Router();

/**
 * GET /api/messages
 * Get messages for a topic
 */
router.get('/', async (req, res) => {
  try {
    const { topicId, limit = 50, offset = 0 } = req.query;
    
    if (!topicId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Topic ID is required' 
      });
    }
    
    const messages = await getMessages(
      parseInt(topicId), 
      parseInt(limit), 
      parseInt(offset), 
      req.clientPool
    );
    
    return res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

/**
 * POST /api/messages
 * Create a new message
 */
router.post('/', async (req, res) => {
  try {
    const { 
      topicId, 
      content, 
      participantId, 
      messageType = 1 // Default to user message
    } = req.body;
    
    if (!topicId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Topic ID and content are required' 
      });
    }
    
    const message = await createMessage({
      topicId: parseInt(topicId),
      content,
      participantId: participantId ? parseInt(participantId) : null,
      messageType: parseInt(messageType)
    }, req.clientPool);
    
    return res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating message',
      error: error.message
    });
  }
});

/**
 * GET /api/messages/search
 * Search messages by content
 */
router.get('/search', async (req, res) => {
  try {
    const { topicId, query, limit = 10 } = req.query;
    
    if (!topicId || !query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Topic ID and search query are required' 
      });
    }
    
    const results = await searchMessages(
      parseInt(topicId),
      query,
      parseInt(limit),
      req.clientPool
    );
    
    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching messages',
      error: error.message
    });
  }
});

export default router;

//=============================================================================
// TOPICS API
//=============================================================================

/**
 * Topics API router
 * Path: backend/routes/api/topics/index.js
 */

import express from 'express';
import { getTopics, createTopic, getTopic, updateTopic, deleteTopic } from '../../../services/topics/topicService.js';

const router = express.Router();

/**
 * GET /api/topics
 * Get all topics
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, participantId } = req.query;
    
    const topics = await getTopics(
      parseInt(limit),
      parseInt(offset),
      participantId ? parseInt(participantId) : null,
      req.clientPool
    );
    
    return res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching topics',
      error: error.message
    });
  }
});

/**
 * GET /api/topics/:id
 * Get a specific topic
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const topic = await getTopic(parseInt(id), req.clientPool);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: `Topic with ID ${id} not found`
      });
    }
    
    return res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    console.error(`Error fetching topic ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching topic',
      error: error.message
    });
  }
});

/**
 * POST /api/topics
 * Create a new topic
 */
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description = null, 
      participantId = null,
      metadata = {}
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title is required' 
      });
    }
    
    const topic = await createTopic({
      title,
      description,
      participantId: participantId ? parseInt(participantId) : null,
      metadata
    }, req.clientPool);
    
    return res.status(201).json({
      success: true,
      data: topic
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating topic',
      error: error.message
    });
  }
});

/**
 * PUT /api/topics/:id
 * Update a topic
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      metadata 
    } = req.body;
    
    const updatedTopic = await updateTopic(
      parseInt(id),
      {
        title,
        description,
        metadata
      },
      req.clientPool
    );
    
    if (!updatedTopic) {
      return res.status(404).json({
        success: false,
        message: `Topic with ID ${id} not found`
      });
    }
    
    return res.json({
      success: true,
      data: updatedTopic
    });
  } catch (error) {
    console.error(`Error updating topic ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error updating topic',
      error: error.message
    });
  }
});

/**
 * DELETE /api/topics/:id
 * Delete a topic
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await deleteTopic(parseInt(id), req.clientPool);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Topic with ID ${id} not found`
      });
    }
    
    return res.json({
      success: true,
      message: `Topic with ID ${id} deleted successfully`
    });
  } catch (error) {
    console.error(`Error deleting topic ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting topic',
      error: error.message
    });
  }
});

export default router;

//=============================================================================
// PARTICIPANTS API
//=============================================================================

/**
 * Participants API router
 * Path: backend/routes/api/participants/index.js
 */

import express from 'express';
import { 
  getParticipants, 
  createParticipant, 
  getParticipant,
  updateParticipant,
  deleteParticipant,
  getParticipantEvents
} from '../../../services/participants/participantService.js';

const router = express.Router();

/**
 * GET /api/participants
 * Get all participants
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const participants = await getParticipants(
      parseInt(limit),
      parseInt(offset),
      req.clientPool
    );
    
    return res.json({
      success: true,
      data: participants
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching participants',
      error: error.message
    });
  }
});

/**
 * GET /api/participants/:id
 * Get a specific participant
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const participant = await getParticipant(parseInt(id), req.clientPool);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: `Participant with ID ${id} not found`
      });
    }
    
    return res.json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error(`Error fetching participant ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching participant',
      error: error.message
    });
  }
});

/**
 * POST /api/participants
 * Create a new participant
 */
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      email,
      externalId = null,
      metadata = {}
    } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }
    
    const participant = await createParticipant({
      name,
      email,
      externalId,
      metadata
    }, req.clientPool);
    
    return res.status(201).json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Error creating participant:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating participant',
      error: error.message
    });
  }
});

/**
 * GET /api/participants/:id/events
 * Get events for a participant
 */
router.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0, type } = req.query;
    
    const events = await getParticipantEvents(
      parseInt(id),
      parseInt(limit),
      parseInt(offset),
      type ? parseInt(type) : null,
      req.clientPool
    );
    
    return res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error(`Error fetching events for participant ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching participant events',
      error: error.message
    });
  }
});

export default router;

//=============================================================================
// AUTHENTICATION MIDDLEWARE
//=============================================================================

/**
 * Authentication middleware
 * Path: backend/middleware/auth.js
 */

import jwt from 'jsonwebtoken';
import config from '../config/config.js';

/**
 * Authenticate incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function authenticateRequest(req, res, next) {
  // Skip authentication in development mode if configured
  if (process.env.NODE_ENV === 'development' && config.auth.skipAuthInDev) {
    return next();
  }
  
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided'
    });
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
}

//=============================================================================
// ERROR HANDLER MIDDLEWARE
//=============================================================================

/**
 * Error handler middleware
 * Path: backend/middleware/errorHandler.js
 */

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // Log the error
  console.error('API Error:', err);
  
  // Database errors
  if (err.isDbError) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      code: err.code,
      context: err.context
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Default error response
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
}
