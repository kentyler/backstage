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
    // Pass the client schema from the request object
    const conv = await convoCtrl.createGrpCon(
      groupId, 
      name, 
      description, 
      typeId, // Optional type ID (1=conversation, 2=course)
      req.clientSchema
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
    // Pass the client schema from the request object
    const conv = await convoCtrl.getGrpConById(
      Number(req.params.id),
      req.clientSchema
    );
    if (!conv) return res.sendStatus(404);
    res.json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grpCons/by-group/:groupId
 *    query: { typeId } - Optional filter by type (1=conversation, 2=course)
 */
router.get('/by-group/:groupId', async (req, res, next) => {
  try {
    // Get typeId from query parameters if provided
    const typeId = req.query.typeId ? Number(req.query.typeId) : null;
    
    // Pass the client schema from the request object
    const list = await convoCtrl.getGrpConsByGroup(
      Number(req.params.groupId),
      typeId, // Optional type ID filter
      req.clientSchema
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
    // Pass the client schema from the request object
    const updated = await convoCtrl.updateGrpCon(
      Number(req.params.id),
      newName,
      newDescription,
      newTypeId, // Optional new type ID
      req.clientSchema
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
    // Pass the client schema from the request object
    const ok = await convoCtrl.deleteGrpCon(
      Number(req.params.id),
      req.clientSchema
    );
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;
