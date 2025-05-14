// src/routes/grpConAvatarTurns.js
/**
 * @file src/routes/avatarTurns.js
 * @description HTTP routes for managing avatar‐turns in group conversations.
 */

import express from 'express'
import * as avatarTurns from '../db/grpConAvatarTurns/index.js'  // your barrel of CRUD fns
import { generateEmbedding } from '../services/embeddingService.js'
import { TURN_KIND } from '../db/grpConAvatarTurns/createGrpConAvatarTurn.js'

const router = express.Router()

/**
 * POST /api/avatar-turns
 * Create a new avatar-turn.
 * Expects JSON body: { conversationId, avatarId, turnIndex, contentText, contentVector, turnKindId }
 * If contentVector is not provided, it will be generated from contentText
 */
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, avatarId, turnIndex, contentText, contentVector, turnKindId } = req.body
    
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
      vectorToUse || [],
      turnKindId
    )
    res.status(201).json(turn)
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/avatar-turns/comment
 * Create a new comment on an existing turn.
 * Expects JSON body: { conversationId, avatarId, parentTurnId, contentText, contentVector }
 * Automatically calculates the appropriate turnIndex for the comment
 */
router.post('/comment', async (req, res, next) => {
  try {
    const { conversationId, avatarId, parentTurnId, contentText, contentVector } = req.body
    
    if (!parentTurnId) {
      return res.status(400).json({ error: 'parentTurnId is required for comments' });
    }
    
    // Get the parent turn to determine its index
    const parentTurn = await avatarTurns.getGrpConAvatarTurnById(Number(parentTurnId));
    if (!parentTurn) {
      return res.status(404).json({ error: 'Parent turn not found' });
    }
    
    // Get all turns in the conversation to find the next turn below the parent
    const allTurns = await avatarTurns.getGrpConAvatarTurnsByConversation(conversationId);
    
    // Sort turns by index in ascending order (lowest index first)
    const sortedTurns = allTurns.sort((a, b) => Number(a.turn_index) - Number(b.turn_index));
    
    // Find the parent turn's position
    const parentIndex = Number(parentTurn.turn_index);
    
    // Find the next turn above the parent (with higher index)
    const higherTurns = sortedTurns.filter(turn => Number(turn.turn_index) > parentIndex);
    const nextHigherIndex = higherTurns.length > 0 ? Number(higherTurns[0].turn_index) : parentIndex + 1;
    
    // Find existing comments between parent and next higher turn
    const existingComments = sortedTurns.filter(turn => 
      Number(turn.turn_index) > parentIndex && 
      Number(turn.turn_index) < nextHigherIndex &&
      turn.turn_kind_id === TURN_KIND.COMMENT
    );
    
    // Calculate the new comment index
    let commentIndex;
    if (existingComments.length === 0) {
      // No existing comments, place halfway between parent and next higher
      commentIndex = (parentIndex + nextHigherIndex) / 2;
    } else {
      // Find the highest comment index (furthest from parent)
      const highestCommentIndex = Math.max(...existingComments.map(c => Number(c.turn_index)));
      // Place the new comment halfway between highest comment and next higher turn
      commentIndex = (highestCommentIndex + nextHigherIndex) / 2;
    }
    
    // If contentVector is not provided, generate it from contentText
    let vectorToUse = contentVector;
    if (!vectorToUse && contentText) {
      try {
        console.log('Generating embedding for comment text...');
        vectorToUse = await generateEmbedding(contentText);
        console.log('Successfully generated embedding for comment text');
      } catch (error) {
        console.error('Error generating embedding for comment text:', error);
        vectorToUse = []; // Fallback to empty vector if embedding generation fails
      }
    }
    
    // Create the comment turn
    const turn = await avatarTurns.createGrpConAvatarTurn(
      conversationId,
      avatarId,
      commentIndex,
      contentText,
      vectorToUse || [],
      TURN_KIND.COMMENT
    );
    
    res.status(201).json(turn);
  } catch (err) {
    next(err);
  }
});

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
