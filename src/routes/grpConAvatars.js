// src/routes/grpConAvatars.js
import express from 'express';
import * as avatarsCtrl from '../db/grpConAvatars/index.js';

const router = express.Router();

/**
 * POST   /api/grp-con-avatars
 *    body: { conversationId, avatarId }
 */
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, avatarId } = req.body;
    // Pass the client schema from the request object
    const link = await avatarsCtrl.createGrpConAvatar(
      conversationId, 
      avatarId,
      req.clientSchema
    );
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grp-con-avatars/by-conversation/:conversationId
 */
router.get('/by-conversation/:conversationId', async (req, res, next) => {
  try {
    // Pass the client schema from the request object
    const list = await avatarsCtrl.getGrpConAvatarsByConversation(
      Number(req.params.conversationId),
      req.clientSchema
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grp-con-avatars/by-avatar/:avatarId
 */
router.get('/by-avatar/:avatarId', async (req, res, next) => {
  try {
    // Pass the client schema from the request object
    const list = await avatarsCtrl.getGrpConsByAvatar(
      Number(req.params.avatarId),
      req.clientSchema
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/grp-con-avatars/:conversationId/:avatarId
 */
router.delete('/:conversationId/:avatarId', async (req, res, next) => {
  try {
    // Pass the client schema from the request object
    const ok = await avatarsCtrl.deleteGrpConAvatar(
      Number(req.params.conversationId),
      Number(req.params.avatarId),
      req.clientSchema
    );
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;