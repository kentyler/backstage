import express from 'express';
import { findSimilarMessages } from '../../db/messageSearch.js';
import { generateEmbedding } from '../../services/embeddings.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/search/similar-messages
 * @desc    Find messages similar to the provided text
 * @access  Private
 */
router.post('/similar-messages', async (req, res) => {
  try {
    // Extract parameters from the request body
    const { text, topicId, currentMessageId } = req.body;
    
    // Validate required parameters
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    
    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }
    
    // Generate embedding for the search text
    const embedding = await generateEmbedding(text);
    
    // Find similar messages
    const similarMessages = await findSimilarMessages(embedding, topicId, 10, currentMessageId);
    
    res.json({
      success: true,
      results: similarMessages
    });
    
  } catch (error) {
    console.error('Error in similar messages search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search for similar messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
