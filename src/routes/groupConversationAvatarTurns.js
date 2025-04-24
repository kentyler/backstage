// src/routes/groupConversationAvatarTurns.js
/**
 * @file src/routes/avatarTurns.js
 * @description HTTP routes for managing avatar‐turns in group conversations.
 */

import express from 'express'
import * as avatarTurns from '../db/groupConversationAvatarTurns/index.js'  // your barrel of CRUD fns

const router = express.Router()

/**
 * POST /api/avatar-turns
 * Create a new avatar-turn.
 * Expects JSON body: { conversationId, avatarId, turnIndex, contentText, contentVector }
 */
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, avatarId, turnIndex, contentText, contentVector } = req.body
    const turn = await avatarTurns.createGroupConversationAvatarTurn(
      conversationId,
      avatarId,
      turnIndex,
      contentText,
      contentVector
    )
    res.status(201).json(turn)
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/avatar-turns/:id
 * Fetch a single turn by its ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const turn = await avatarTurns.getGroupConversationAvatarTurnById(Number(req.params.id))
    if (!turn) return res.status(404).json({ error: 'Not found' })
    res.json(turn)
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/avatar-turns/by-conversation/:conversationId
 * List all turns within a given conversation.
 */
router.get('/by-conversation/:conversationId', async (req, res, next) => {
  try {
    const list = await avatarTurns.getGroupConversationAvatarTurnsByConversation(
      Number(req.params.conversationId)
    )
    res.json(list)
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/avatar-turns/:id
 * Update text and/or vector of an existing turn.
 * Expects JSON body: { contentText, contentVector }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { contentText, contentVector } = req.body
    const updated = await avatarTurns.updateGroupConversationAvatarTurn(
      Number(req.params.id),
      contentText,
      contentVector
    )
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/avatar-turns/:id
 * Remove a turn by its ID.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await avatarTurns.deleteGroupConversationAvatarTurn(Number(req.params.id))
    res.json({ success })
  } catch (err) {
    next(err)
  }
})

export default router
