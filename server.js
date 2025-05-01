// server.js
/**
 * Main entry point: start the Express server.
 * Assumes `app` is exported as default from app.js.
 */
import app from './app.js';
import { initClaudeService, CLAUDE_PARTICIPANT_ID, CLAUDE_AVATAR_ID } from './src/services/claudeService.js';
import { initEmbeddingService } from './src/services/embeddingService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize Claude service
const claudeInitialized = initClaudeService();
if (claudeInitialized) {
  console.log(`Claude service initialized (Participant ID: ${CLAUDE_PARTICIPANT_ID}, Avatar ID: ${CLAUDE_AVATAR_ID})`);
} else {
  console.warn('Claude service not initialized. LLM responses will be mocked.');
  console.warn('To use Claude, add your API key to the .env file as CLAUDE_API_KEY=your_key_here');
}

// Initialize Embedding service
const embeddingInitialized = initEmbeddingService();
if (embeddingInitialized) {
  console.log('Embedding service initialized successfully');
} else {
  console.warn('Embedding service not initialized. Vector embeddings will not be generated.');
  console.warn('To use embeddings, ensure the CLAUDE_API_KEY is set in the .env file');
}

/**
 * Boot the HTTP server on the specified port.
 */
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

