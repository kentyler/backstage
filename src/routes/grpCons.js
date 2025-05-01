// src/routes/grpCons.js
import express from 'express';
import * as convoCtrl from '../db/grpCons/index.js';

const router = express.Router();

/**
 * POST   /api/grpCons
 *    body: { groupId, name, description }
 */
router.post('/', async (req, res, next) => {
  try {
    const { groupId, name, description } = req.body;
    const conv = await convoCtrl.createGrpCon(groupId, name, description);
    res.status(201).json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grpCons/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const conv = await convoCtrl.getGrpConById(Number(req.params.id));
    if (!conv) return res.sendStatus(404);
    res.json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grpCons/by-group/:groupId
 */
router.get('/by-group/:groupId', async (req, res, next) => {
  try {
    const list = await convoCtrl.getGrpConsByGroup(Number(req.params.groupId));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT    /api/grpCons/:id
 *    body: { newName, newDescription }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { newName, newDescription } = req.body;
    const updated = await convoCtrl.updateGrpCon(
      Number(req.params.id),
      newName,
      newDescription
    );
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/grpCons/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await convoCtrl.deleteGrpCon(Number(req.params.id));
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;
