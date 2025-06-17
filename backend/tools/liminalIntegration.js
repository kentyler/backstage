/**
 * Liminal Tool Integration Options
 * 
 * Different ways to activate the liminal exploration tool
 */

// Option 1: Express API Endpoint
const express = require('express');
const LiminalTool = require('./liminalTool');
const ConversationMonitor = require('./conversationMonitor');

function addLiminalEndpoints(app) {
  const liminalTool = new LiminalTool();
  const monitor = new ConversationMonitor();

  // Manual trigger endpoint
  app.post('/api/explore/liminal', async (req, res) => {
    const { context, depth, focus } = req.body;
    const result = await liminalTool.execute({ context, depth, focus });
    res.json(result);
  });

  // Auto-monitor endpoint
  app.post('/api/conversation/segment', (req, res) => {
    const { segment } = req.body;
    const check = monitor.addSegment(segment);
    
    if (check.shouldExplore) {
      // Trigger exploration automatically
      const exploration = liminalTool.execute({
        context: check.context,
        depth: 'medium'
      });
      res.json({ shouldExplore: true, exploration });
    } else {
      res.json({ shouldExplore: false });
    }
  });
}

// Option 2: CLI Command Integration
function addCLICommand(program) {
  program
    .command('.')
    .description('Explore liminal space of current conversation')
    .action(async () => {
      const liminalTool = new LiminalTool();
      // Would need to get conversation context from somewhere
      const result = await liminalTool.execute({
        context: getRecentContext(), // This would need implementation
        depth: 'medium'
      });
      console.log(result);
    });
}

// Option 3: WebSocket Real-time Integration
const WebSocket = require('ws');

function createLiminalWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  const monitor = new ConversationMonitor();
  const liminalTool = new LiminalTool();

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      
      if (data.type === 'conversation-segment') {
        const check = monitor.addSegment(data.content);
        
        if (check.shouldExplore) {
          const exploration = await liminalTool.execute({
            context: check.context,
            depth: 'medium'
          });
          
          ws.send(JSON.stringify({
            type: 'liminal-exploration',
            exploration
          }));
        }
      }
    });
  });
}

// Option 4: Message Interceptor Middleware
function liminalMiddleware() {
  const monitor = new ConversationMonitor();
  const liminalTool = new LiminalTool();

  return async (req, res, next) => {
    // Intercept all message-related endpoints
    if (req.path.includes('/message') || req.path.includes('/prompt')) {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Add to monitor
        if (req.body && req.body.content) {
          const check = monitor.addSegment(req.body.content);
          
          if (check.shouldExplore) {
            // Add exploration to response
            const parsed = JSON.parse(data);
            liminalTool.execute({
              context: check.context,
              depth: 'medium'
            }).then(exploration => {
              parsed.liminalExploration = exploration;
              originalSend.call(this, JSON.stringify(parsed));
            });
            return;
          }
        }
        
        originalSend.call(this, data);
      };
    }
    
    next();
  };
}

module.exports = {
  addLiminalEndpoints,
  addCLICommand,
  createLiminalWebSocket,
  liminalMiddleware
};