import express from 'express';
import { findSimilarMessages } from '../../db/messageSearch.js';
import { generateEmbedding } from '../../services/embeddings.js';

const router = express.Router();

/**
 * @route   POST /api/search/similar-messages
 * @desc    Find messages similar to the provided text
 * @access  Private
 */
router.post('/similar-messages', async (req, res) => {
  try {
    const { text, excludeTopicPath } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (!excludeTopicPath) {
      return res.status(400).json({ error: 'excludeTopicPath is required' });
    }
    
    // Generate embedding for the search text
    const embedding = await generateEmbedding(text);
    
    // Find similar messages
    const similarMessages = await findSimilarMessages(embedding, excludeTopicPath, 10);
    
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
