/**
 * @file src/routes/participantEvents.js
 * @description API routes for participant events
 */

import express from 'express';
import { 
  createParticipantEvent,
  getParticipantEventById,
  getParticipantEventsByParticipant,
  getParticipantEventsByType
} from '../db/participantEvents/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/participant-events
 * @description Get all events for the authenticated participant
 * @access Private
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const events = await getParticipantEventsByParticipant(req.user.id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/participant-events/:id
 * @description Get a specific participant event by ID
 * @access Private
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const event = await getParticipantEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Only allow participants to view their own events
    if (event.participant_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/participant-events/type/:typeId
 * @description Get all events of a specific type (admin only)
 * @access Private/Admin
 */
router.get('/type/:typeId', requireAuth, async (req, res) => {
  try {
    // This route would typically have additional admin authorization
    // For now, we'll just implement the basic functionality
    const events = await getParticipantEventsByType(req.params.typeId);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route POST /api/participant-events
 * @description Create a new participant event
 * @access Private
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { eventTypeId, details } = req.body;
    
    if (!eventTypeId) {
      return res.status(400).json({ message: 'Event type ID is required' });
    }
    
    const event = await createParticipantEvent(req.user.id, eventTypeId, details);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;