
/**
 * @file src/routes/groups.js
 * @description Creates routes for all the group functions.
 */

import express from 'express';
import * as groupCtrl from '../db/groups/index.js';

const router = express.Router();

// all routes are now mounted under `/api/groups`
router
  .post(   '/',      (req, res, next) => groupCtrl.createGroup(req.body.name, req.clientPool).then(r => res.status(201).json(r)).catch(next))
  .get('/', async (req, res, next) => {
    try {
      // Check if clientPool is available
      if (!req.clientPool) {
        console.error('[Groups API] Database connection pool not available');
        return res.status(500).json({ 
          error: 'Database connection not available',
          message: 'The application is unable to access the database. This may be due to an authentication issue.'
        });
      }

      // If participantId is provided, get groups for that participant
      if (req.query.participantId) {
        const participantId = parseInt(req.query.participantId, 10);
        if (isNaN(participantId)) {
          return res.status(400).json({ error: 'Invalid participant ID' });
        }
        
        try {
          const groups = await groupCtrl.getGroupsByParticipant(participantId, req.clientPool);
          return res.json(groups || []);
        } catch (participantErr) {
          console.error(`[Groups API] Error fetching groups for participant ${participantId}:`, participantErr);
          // Return empty array instead of error to prevent UI crashes
          return res.json([]);
        }
      }
      
      // Otherwise, get all groups with error handling
      try {
        console.log('[Groups API] Fetching all groups');
        const groups = await groupCtrl.getAllGroups(req.clientPool);
        return res.json(groups || []);
      } catch (groupsErr) {
        console.error('[Groups API] Error fetching all groups:', groupsErr);
        // Return empty array rather than throwing error to make UI more resilient
        return res.json([]);
      }
    } catch (err) {
      console.error('[Groups API] Unexpected error:', err);
      // Return empty array rather than error
      return res.json([]);
    }
  })
  .get(    '/:id',   (req, res, next) => groupCtrl.getGroupById(+req.params.id, req.clientPool).then(r => r ? res.json(r) : res.sendStatus(404)).catch(next))
  .put(    '/:id',   (req, res, next) => {
    // Create updates object with properties from request body
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    
    return groupCtrl.updateGroup(+req.params.id, updates, req.clientPool)
      .then(r => r ? res.json(r) : res.sendStatus(404))
      .catch(next);
  })
  .delete( '/:id',   (req, res, next) => groupCtrl.deleteGroup(+req.params.id, req.clientPool).then(ok => res.json({ success: ok })).catch(next));

export default router;