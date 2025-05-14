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
      typeId, // Optional type ID (1=conversation, 2=template)
      req.clientPool
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
      Number(req.params.id),
      req.clientPool
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
      typeId,
      req.clientPool
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT    /api/grpCons/:id
 *    body: { newName, newDescription, newTypeId, template_id }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { newName, newDescription, newTypeId, template_id } = req.body;
    
    // If template_id is provided in the request, update the conversation's template
    if (template_id !== undefined) {
      try {
        // Update the conversation with the template_id
        const query = `
          UPDATE grp_cons
          SET template_id = $1,
              updated_at = NOW()
          WHERE id = $2
          RETURNING id, group_id, name, description, type_id, template_id, created_at, updated_at
        `;
        
        const params = [template_id === null ? null : Number(template_id), Number(req.params.id)];
        const result = await req.clientPool.query(query, params);
        
        if (result.rows.length === 0) {
          return res.sendStatus(404);
        }
        
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating conversation template:', error);
        return next(error);
      }
    }
    
    // Otherwise, proceed with the regular update
    const updated = await convoCtrl.updateGrpCon(
      Number(req.params.id),
      newName,
      newDescription,
      newTypeId,
      req.clientPool
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
      Number(req.params.id),
      req.clientPool
    );
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;
