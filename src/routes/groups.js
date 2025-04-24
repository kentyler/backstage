// src/routes/groups.js
import express from 'express';
import * as groupCtrl from '../db/groups/index.js';

const router = express.Router();

// all routes are now mounted under `/api/groups`
router
  .post(   '/',      (req, res, next) => groupCtrl.createGroup(req.body.name).then(r => res.status(201).json(r)).catch(next))
  .get(    '/',      (req, res, next) => groupCtrl.getAllGroups().then(r => res.json(r)).catch(next))
  .get(    '/:id',   (req, res, next) => groupCtrl.getGroupById(+req.params.id).then(r => r ? res.json(r) : res.sendStatus(404)).catch(next))
  .put(    '/:id',   (req, res, next) => groupCtrl.updateGroup(+req.params.id, req.body.name).then(r => r ? res.json(r) : res.sendStatus(404)).catch(next))
  .delete( '/:id',   (req, res, next) => groupCtrl.deleteGroup(+req.params.id).then(ok => res.json({ success: ok })).catch(next));

export default router;