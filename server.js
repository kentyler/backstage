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
import { getDefaultSchema, setDefaultSchema } from './src/config/schema.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Set default schema from environment variable
if (process.env.DB_SCHEMA) {
  setDefaultSchema(process.env.DB_SCHEMA);
} else {
  // Default to 'dev' schema if not specified
  setDefaultSchema('dev');
}

console.log(`Default database schema: ${getDefaultSchema()} (can be overridden with ?schema=name)`);

// Initialize LLM and Embedding services with configuration from avatar
(async () => {
  try {
    // Get the default schema
    const schema = getDefaultSchema();
    
    // Get the LLM ID and configuration using the preference cascade
    const llmId = await getLLMId(null, null, schema);
    const config = await getDefaultLLMConfig(schema);
    
    // Initialize the LLM service with the configuration
    const llmInitialized = initLLMService(config, { schema });
    
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
    const embeddingInitialized = initEmbeddingService(config, { schema });
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

