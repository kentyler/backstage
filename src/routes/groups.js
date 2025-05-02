
/**
 * @file src/routes/groups.js
 * @description Creates routes for all the group functions.
 */

import express from 'express';
import * as groupCtrl from '../db/groups/index.js';

const router = express.Router();

// all routes are now mounted under `/api/groups`
router
  .post(   '/',      (req, res, next) => groupCtrl.createGroup(req.body.name).then(r => res.status(201).json(r)).catch(next))
  .get(    '/',      async (req, res, next) => {
    try {
      // If participantId is provided, get groups for that participant
      if (req.query.participantId) {
        const participantId = parseInt(req.query.participantId, 10);
        if (isNaN(participantId)) {
          return res.status(400).json({ error: 'Invalid participant ID' });
        }
        const groups = await groupCtrl.getGroupsByParticipant(participantId);
        return res.json(groups);
      }
      
      // Otherwise, get all groups
      const groups = await groupCtrl.getAllGroups();
      return res.json(groups);
    } catch (err) {
      next(err);
    }
  })
  .get(    '/:id',   (req, res, next) => groupCtrl.getGroupById(+req.params.id).then(r => r ? res.json(r) : res.sendStatus(404)).catch(next))
  .put(    '/:id',   (req, res, next) => {
    // Create updates object with properties from request body
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    
    return groupCtrl.updateGroup(+req.params.id, updates)
      .then(r => r ? res.json(r) : res.sendStatus(404))
      .catch(next);
  })
  .delete( '/:id',   (req, res, next) => groupCtrl.deleteGroup(+req.params.id).then(ok => res.json({ success: ok })).catch(next));

export default router;