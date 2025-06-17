const express = require('express');
const router = express.Router();
const LiminalTool = require('../../../tools/liminalTool');
const ConversationMonitor = require('../../../tools/conversationMonitor');

// Initialize tools
const liminalTool = new LiminalTool();
const conversationMonitors = new Map(); // Track per-session monitors

// Manual liminal exploration
router.post('/explore', async (req, res) => {
  try {
    const { context, depth = 'medium', focus = [] } = req.body;
    
    if (!context) {
      return res.status(400).json({ error: 'Context is required' });
    }

    const result = await liminalTool.execute({ context, depth, focus });
    res.json(result);
  } catch (error) {
    console.error('Liminal exploration error:', error);
    res.status(500).json({ error: 'Failed to explore liminal space' });
  }
});

// Add conversation segment for monitoring
router.post('/monitor', async (req, res) => {
  try {
    const { sessionId, segment } = req.body;
    
    if (!sessionId || !segment) {
      return res.status(400).json({ error: 'SessionId and segment are required' });
    }

    // Get or create monitor for session
    if (!conversationMonitors.has(sessionId)) {
      conversationMonitors.set(sessionId, new ConversationMonitor());
    }
    
    const monitor = conversationMonitors.get(sessionId);
    const check = monitor.addSegment(segment);
    
    if (check.shouldExplore) {
      const exploration = await liminalTool.execute({
        context: check.context,
        depth: 'medium'
      });
      
      // Reset triggers after exploration
      monitor.resetTriggers();
      
      res.json({ 
        shouldExplore: true, 
        triggers: check.triggers,
        exploration 
      });
    } else {
      res.json({ shouldExplore: false });
    }
  } catch (error) {
    console.error('Monitoring error:', error);
    res.status(500).json({ error: 'Failed to monitor conversation' });
  }
});

// Get liminal tool info
router.get('/info', (req, res) => {
  res.json({
    tool: liminalTool.schema,
    description: 'Explores unspoken observations and adjacent possibilities in conversations',
    endpoints: {
      '/explore': 'Manual liminal exploration',
      '/monitor': 'Add conversation segment for automatic monitoring'
    }
  });
});

module.exports = router;