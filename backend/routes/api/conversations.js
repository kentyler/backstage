import express from 'express';
import { getConversationTurns } from '../../db/conversationTurns.js';

const router = express.Router();

/**
 * @route   GET /api/conversations/:conversationId/turns
 * @desc    Get all turns for a conversation
 * @access  Private
 */
router.get('/:conversationId/turns', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    
    const turns = await getConversationTurns(conversationId);
    res.json(turns);
  } catch (error) {
    console.error('Error getting conversation turns:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
