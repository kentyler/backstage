// src/routes/participants.js
/**
 * @file src/routes/participants.js
 * @description Creates routes for all the participant functions.
 */
import express from 'express';
import * as participantCtrl from '../db/participants/index.js';
import { loginHandler } from '../controllers/participants/loginHandler.js';
import { logoutHandler } from '../controllers/participants/logoutHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/participants/login
 * Authenticate a participant and issue a token.
 */
router.post('/login', loginHandler);

/**
 * POST /api/participants/logout
 * Logout a participant and clear their token.
 * Requires authentication.
 */
router.post('/logout', requireAuth, logoutHandler);

/**
 * POST /api/participants
 * Create a new participant.
 * Body: { name, email, password }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const created = await participantCtrl.createParticipant(name, email, password, req.clientPool);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/participants
 * Retrieve all participants.
 */
router.get('/', async (req, res, next) => {
  try {
    const list = await participantCtrl.getAllParticipants(req.clientPool);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/participants/:id
 * Retrieve a single participant by ID.
 */
router.get('/:id', async (req, res, next) => {
  // Validate that the ID is an integer
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid participant ID' });
  }

  try {
    const participant = await participantCtrl.getParticipantById(id, req.clientPool);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(participant);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/participants/:id
 * Update a participant's data.
 * Body: { name?, email?, password? }
 * Note: Avatar preferences are now handled through the preferences system
 */
router.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid participant ID' });
  }

  try {
    const updated = await participantCtrl.updateParticipant(id, req.body, req.clientPool);
    if (!updated) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/participants/:id
 * Delete a participant by ID.
 */
router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid participant ID' });
  }

  try {
    const success = await participantCtrl.deleteParticipant(id, req.clientPool );
    res.json({ success });
  } catch (err) {
    next(err);
  }
});

export default router;
