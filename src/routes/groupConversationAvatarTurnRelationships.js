// src/routes/groupConversationAvatarTurnRelationships.js
/**
 * @file HTTP routes for managing avatar‐turn relationships in group conversations.
 */

import express from 'express';
import * as relController from '../db/groupConversationAvatarTurnRelationships/index.js';

const router = express.Router();

/**
 * POST   /api/avatar-turn-relationships/
 * Create a new turn-relationship.
 * Expects JSON body: { turnId, targetTurnId, relationshipTypeId }
 */
router.post('/', async (req, res, next) => {
  try {
    const { turnId, targetTurnId, relationshipTypeId } = req.body;
    const rel = await relController.createAvatarTurnRelationship(
      Number(turnId),
      Number(targetTurnId),
      relationshipTypeId != null ? Number(relationshipTypeId) : undefined
    );
    res.status(201).json(rel);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/avatar-turn-relationships/:id
 * Fetch a single relationship by its ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const rel = await relController.getAvatarTurnRelationshipById(Number(req.params.id));
    if (!rel) return res.status(404).json({ error: 'Not found' });
    res.json(rel);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/avatar-turn-relationships/by-turn/:turnId
 * List all relationships originating from a given turn.
 */
router.get('/by-turn/:turnId', async (req, res, next) => {
  try {
    const list = await relController.getAvatarTurnRelationshipsByTurn(Number(req.params.turnId));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT    /api/avatar-turn-relationships/:id
 * Update the relationship type of an existing relationship.
 * Expects JSON body: { newTypeId }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { newTypeId } = req.body;
    const updated = await relController.updateAvatarTurnRelationship(
      Number(req.params.id),
      Number(newTypeId)
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/avatar-turn-relationships/:id
 * Remove a relationship by its ID.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await relController.deleteAvatarTurnRelationship(Number(req.params.id));
    res.json({ success });
  } catch (err) {
    next(err);
  }
});

export default router;
