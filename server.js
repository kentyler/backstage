// server.js
/**
 * Main entry point: start the Express server.
 * Assumes `app` is exported as default from app.js.
 */
import dotenv from 'dotenv';
import app from './app.js';
import { initLLMService, getLLMId, getLLMConfig, getDefaultLLMConfig } from './src/services/llmService.js';
import { initEmbeddingService } from './src/services/embeddingService.js';
import { getGrpConAvatarTurnsByConversation } from './src/db/grpConAvatarTurns/index.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize LLM and Embedding services with configuration from avatar
(async () => {
  try {
    // Get the LLM ID and configuration using the preference cascade
    const llmId = await getLLMId();
    const config = await getDefaultLLMConfig();
    
    // Initialize the LLM service with the configuration
    const llmInitialized = initLLMService(config);
    
    if (llmInitialized) {
      console.log(`LLM service initialized with configuration from LLM ID ${llmId}`);
      if (config) {
        console.log(`Using provider: ${config.provider}, model: ${config.model}`);
      }
    } else {
      console.warn('LLM service not initialized. LLM responses will be mocked.');
      console.warn('To use LLM, add configuration to the avatar record or set LLM_API_KEY in the .env file');
    }
    
    // Initialize Embedding service with the same configuration
    const embeddingInitialized = initEmbeddingService(config);
    if (embeddingInitialized) {
      console.log('Embedding service initialized successfully with the same configuration');
    } else {
      console.warn('Embedding service not initialized. Vector embeddings will not be generated.');
      console.warn('To use embeddings, ensure LLM configuration is set in the avatar record or LLM_API_KEY is set in the .env file');
    }
  } catch (error) {
    console.warn(`Failed to initialize services: ${error.message}`);
  }
})();

/**
 * Boot the HTTP server on the specified port.
 */
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

