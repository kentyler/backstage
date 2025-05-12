/**
 * @file src/routes/participantAvatars.js
 * @description Routes for managing participant-avatar relationships.
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createParticipantAvatar,
  getParticipantAvatarById,
  getParticipantAvatarsByParticipant,
  getParticipantAvatarsByAvatar,
  deleteParticipantAvatar
} from '../db/participantAvatars/index.js';

const router = express.Router();

/**
 * Create a new participant-avatar relationship
 * POST /api/participant-avatars
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { participantId, avatarId } = req.body;
    
    if (!participantId || !avatarId) {
      return res.status(400).json({ error: 'participantId and avatarId are required' });
    }
    
    const createdByParticipantId = req.user?.participantId || null;
    
    const relationship = await createParticipantAvatar(
      participantId,
      avatarId,
      createdByParticipantId,
      req.clientPool
    );
    
    res.status(201).json(relationship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a participant-avatar relationship by ID
 * GET /api/participant-avatars/:id
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const relationship = await getParticipantAvatarById(Number(req.params.id), req.clientPool);
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    res.json(relationship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all avatar relationships for a participant
 * GET /api/participant-avatars/participant/:participantId
 */
router.get('/participant/:participantId', requireAuth, async (req, res) => {
  try {
    const relationships = await getParticipantAvatarsByParticipant(Number(req.params.participantId), req.clientPool);
    res.json(relationships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all participant relationships for an avatar
 * GET /api/participant-avatars/avatar/:avatarId
 */
router.get('/avatar/:avatarId', requireAuth, async (req, res) => {
  try {
    const relationships = await getParticipantAvatarsByAvatar(Number(req.params.avatarId), req.clientPool);
    res.json(relationships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a participant-avatar relationship
 * DELETE /api/participant-avatars/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const relationship = await deleteParticipantAvatar(Number(req.params.id), req.clientPool);
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    res.json(relationship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;