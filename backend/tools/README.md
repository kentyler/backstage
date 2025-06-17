# Liminal Exploration Tools

This directory contains tools for exploring the "liminal space" of conversations - the unspoken observations, adjacent possibilities, and underlying themes that exist between explicit statements.

## Components

### LiminalTool (`liminalTool.js`)
A tool that can be explicitly invoked to explore conversational liminal space. It provides:
- Unspoken observations
- Adjacent possibilities
- Underlying themes
- Generative thoughts for new directions

### ConversationMonitor (`conversationMonitor.js`)
Monitors conversation patterns and automatically suggests when liminal exploration would be valuable based on:
- Concept density
- Task completions without reflection
- Natural pause points
- Discussion complexity

### LiminalExplorer Service (`../services/liminalExplorer.js`)
Core service that analyzes conversation segments and generates explorations.

## Usage

### Manual Invocation
```javascript
const LiminalTool = require('./liminalTool');
const tool = new LiminalTool();

const result = await tool.execute({
  context: "Recent conversation about building tools...",
  depth: 'deep',
  focus: ['tools', 'meta-programming']
});
```

### Automatic Monitoring
```javascript
const ConversationMonitor = require('./conversationMonitor');
const monitor = new ConversationMonitor();

// Add conversation segments
const check = monitor.addSegment("We've completed the file upload feature");

if (check.shouldExplore) {
  // Trigger liminal exploration
  console.log('Exploration suggested:', check.triggers);
}
```

## Integration Ideas

1. **CLI Integration**: Add a `.` command to Claude Code CLI
2. **API Endpoint**: Create `/api/explore/liminal` endpoint
3. **Real-time Analysis**: WebSocket integration for live monitoring
4. **Conversation Replay**: Analyze past conversations for missed insights

## The Meta Layer

These tools themselves demonstrate liminal thinking - they exist in the space between:
- Explicit conversation and implicit understanding
- Tool creation and tool usage
- Human insight and automated pattern recognition
- Present discussion and future possibilities

The act of building them reveals patterns about how we collaborate and think together.