// src/routes/grpConAvatarTurns.js
/**
 * @file src/routes/avatarTurns.js
 * @description HTTP routes for managing avatar‐turns in group conversations.
 */

import express from 'express'
import * as avatarTurns from '../db/grpConAvatarTurns/index.js'  // your barrel of CRUD fns
import { generateEmbedding } from '../services/embeddingService.js'

const router = express.Router()

/**
 * POST /api/avatar-turns
 * Create a new avatar-turn.
 * Expects JSON body: { conversationId, avatarId, turnIndex, contentText, contentVector }
 * If contentVector is not provided, it will be generated from contentText
 */
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, avatarId, turnIndex, contentText, contentVector } = req.body
    
    // If contentVector is not provided, generate it from contentText
    let vectorToUse = contentVector;
    if (!vectorToUse && contentText) {
      try {
        console.log('Generating embedding for content text...');
        vectorToUse = await generateEmbedding(contentText);
        console.log('Successfully generated embedding for content text');
      } catch (error) {
        console.error('Error generating embedding for content text:', error);
        vectorToUse = []; // Fallback to empty vector if embedding generation fails
      }
    }
    
    const turn = await avatarTurns.createGrpConAvatarTurn(
      conversationId,
      avatarId,
      turnIndex,
      contentText,
      vectorToUse || []
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
    const turn = await avatarTurns.getGrpConAvatarTurnById(Number(req.params.id))
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
    const list = await avatarTurns.getGrpConAvatarTurnsByConversation(
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
 * If contentVector is not provided but contentText is, a new vector will be generated
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { contentText, contentVector } = req.body
    
    // If contentVector is not provided but contentText is, generate a new vector
    let vectorToUse = contentVector;
    if (!vectorToUse && contentText) {
      try {
        console.log('Generating embedding for updated content text...');
        vectorToUse = await generateEmbedding(contentText);
        console.log('Successfully generated embedding for updated content text');
      } catch (error) {
        console.error('Error generating embedding for updated content text:', error);
        vectorToUse = []; // Fallback to empty vector if embedding generation fails
      }
    }
    
    const updated = await avatarTurns.updateGrpConAvatarTurn(
      Number(req.params.id),
      contentText,
      vectorToUse || []
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
    const success = await avatarTurns.deleteGrpConAvatarTurn(Number(req.params.id))
    res.json({ success })
  } catch (err) {
    next(err)
  }
})

export default router
