// src/routes/grpCons.js
import express from 'express';
import * as convoCtrl from '../db/grpCons/index.js';

const router = express.Router();

/**
 * POST   /api/grpCons
 *    body: { groupId, name, description, typeId }
 */
router.post('/', async (req, res, next) => {
  try {
    const { groupId, name, description, typeId } = req.body;
    const conv = await convoCtrl.createGrpCon(
      groupId, 
      name, 
      description, 
      typeId // Optional type ID (1=conversation, 2=template)
    );
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
    const conv = await convoCtrl.getGrpConById(
      Number(req.params.id)
    );
    if (!conv) return res.sendStatus(404);
    res.json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grpCons/by-group/:groupId
 *    query: { typeId } - Optional filter by type (1=conversation, 2=template)
 */
router.get('/by-group/:groupId', async (req, res, next) => {
  try {
    const typeId = req.query.typeId ? Number(req.query.typeId) : null;
    const list = await convoCtrl.getGrpConsByGroup(
      Number(req.params.groupId),
      typeId // Optional type ID filter
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT    /api/grpCons/:id
 *    body: { newName, newDescription, newTypeId }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { newName, newDescription, newTypeId } = req.body;
    const updated = await convoCtrl.updateGrpCon(
      Number(req.params.id),
      newName,
      newDescription,
      newTypeId // Optional new type ID
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
    const ok = await convoCtrl.deleteGrpCon(
      Number(req.params.id)
    );
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;
