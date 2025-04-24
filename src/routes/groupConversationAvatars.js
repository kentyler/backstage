// src/routes/groupConversationAvatars.js
import express from 'express';
import * as avatarsCtrl from '../db/groupConversationAvatars/index.js';

const router = express.Router();

/**
 * POST   /api/group-conversation-avatars
 *    body: { conversationId, avatarId }
 */
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, avatarId } = req.body;
    const link = await avatarsCtrl.createGroupConversationAvatar(conversationId, avatarId);
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/group-conversation-avatars/by-conversation/:conversationId
 */
router.get('/by-conversation/:conversationId', async (req, res, next) => {
  try {
    const list = await avatarsCtrl.getGroupConversationAvatarsByConversation(Number(req.params.conversationId));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/group-conversation-avatars/by-avatar/:avatarId
 */
router.get('/by-avatar/:avatarId', async (req, res, next) => {
  try {
    const list = await avatarsCtrl.getGroupConversationsByAvatar(Number(req.params.avatarId));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/group-conversation-avatars/:conversationId/:avatarId
 */
router.delete('/:conversationId/:avatarId', async (req, res, next) => {
  try {
    const ok = await avatarsCtrl.deleteGroupConversationAvatar(
      Number(req.params.conversationId),
      Number(req.params.avatarId)
    );
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;
