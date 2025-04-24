// src/routes/groupConversations.js
import express from 'express';
import * as convoCtrl from '../db/groupConversations/index.js';

const router = express.Router();

/**
 * POST   /api/group-conversations
 *    body: { groupId, name, description }
 */
router.post('/', async (req, res, next) => {
  try {
    const { groupId, name, description } = req.body;
    const conv = await convoCtrl.createGroupConversation(groupId, name, description);
    res.status(201).json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/group-conversations/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const conv = await convoCtrl.getGroupConversationById(Number(req.params.id));
    if (!conv) return res.sendStatus(404);
    res.json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/group-conversations/by-group/:groupId
 */
router.get('/by-group/:groupId', async (req, res, next) => {
  try {
    const list = await convoCtrl.getGroupConversationsByGroup(Number(req.params.groupId));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT    /api/group-conversations/:id
 *    body: { newName, newDescription }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { newName, newDescription } = req.body;
    const updated = await convoCtrl.updateGroupConversation(
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
 * DELETE /api/group-conversations/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await convoCtrl.deleteGroupConversation(Number(req.params.id));
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
});

export default router;
