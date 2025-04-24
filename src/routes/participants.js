// src/routes/participants.js
import express from 'express';
import * as participantCtrl from '../db/participant/index.js';

const router = express.Router();

/**
 * POST   /api/participants
 *   body: { name, email, password }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const created = await participantCtrl.createParticipant(name, email, password);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/participants
 */
router.get('/', async (req, res, next) => {
  try {
    const list = await participantCtrl.getAllParticipants();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/participants/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const p = await participantCtrl.getParticipantById(Number(req.params.id));
    if (!p) return res.sendStatus(404);
    res.json(p);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT    /api/participants/:id
 *   body: { name?, email?, password?, current_avatar_id? }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    const updated = await participantCtrl.updateParticipant(
      Number(req.params.id),
      updates
    );
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/participants/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await participantCtrl.deleteParticipant(Number(req.params.id));
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;
