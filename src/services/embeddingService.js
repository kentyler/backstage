/**
 * @file src/services/embeddingService.js
 * @description Service for generating embeddings (vectors) from text content using Anthropic API,
 * preprocessing prompts, and finding similar texts based on embedding similarity
 */

import Anthropic from '@anthropic-ai/sdk';

// Constants for embedding configuration
const VECTOR_DIM = 1536; // Dimension of the embedding vectors
const SIMILARITY_THRESHOLD = 0.65; // Threshold for considering texts similar (cosine similarity)
const MAX_RESULTS = 10; // Maximum number of similar texts to return
const MAX_QUERY_VARIANTS = 3; // Maximum number of query variants to generate

// Initialize the Anthropic client
let anthropic = null;

// Store the current configuration
let currentConfig = null;

/**
 * Initialize the embedding service with the provided configuration or environment variable
 * 
 * @param {Object} config - The LLM configuration (optional)
 * @returns {boolean} Whether the initialization was successful
 */
export function initEmbeddingService(config = null) {
  // Store the configuration for later use
  currentConfig = config;
  
  // If no configuration provided, try to use the environment variable
  let apiKey;
  
  if (config && config.api_key) {
    apiKey = config.api_key;
    console.log(`Initializing embedding service with provided API key from configuration`);
  } else {
    apiKey = process.env.LLM_API_KEY;
    console.log(`Initializing embedding service with API key from environment variable`);
  }
  
  if (!apiKey) {
    console.error('No LLM configuration provided and LLM_API_KEY is not set in environment variables');
    return false;
  }
  
  try {
    anthropic = new Anthropic({
      apiKey: apiKey,
    });
    console.log('Embedding service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize embedding service:', error);
    return false;
  }
}

/**
 * Generate an embedding vector for the given text
 * 
 * @param {string} text - The text to generate an embedding for
 * @param {Object} config - The LLM configuration (optional)
 * @returns {Promise<number[]>} The embedding vector
 */
export async function generateEmbedding(text, config = null) {
  // Use the provided config or the current config
  const effectiveConfig = config || currentConfig;
  
  if (!anthropic) {
    throw new Error('Embedding service not initialized');
  }
  
  if (!text || typeof text !== 'string') {
    console.warn('Invalid text provided for embedding generation, returning zero vector');
    return new Array(VECTOR_DIM).fill(0);
  }
  
  try {
    // Use Anthropic's embeddings API to generate embeddings
    console.log(`Generating embedding for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    // Try different approaches to generate embeddings
    try {
      // First try the dedicated embeddings endpoint if available
      if (anthropic.embeddings && typeof anthropic.embeddings.create === 'function') {
        console.log('Using dedicated embeddings.create endpoint');
        const response = await anthropic.embeddings.create({
          // Use the model from the configuration if available, otherwise use the default
          model: effectiveConfig?.model || "claude-3-opus-20240229",
          input: text
        });
        
        if (response && response.embedding) {
          console.log('Successfully generated embedding using embeddings.create');
          return normalizeVector(response.embedding);
        }
      }
    } catch (embeddingError) {
      console.error('Error using embeddings.create endpoint:', embeddingError);
      // Continue to fallback methods
    }
    
    // If we reach here, either the embeddings endpoint is not available or it failed
    // Generate a deterministic mock embedding based on the text content
    console.log('Generating deterministic mock embedding');
    const mockEmbedding = generateDeterministicEmbedding(text);
    console.log('Successfully generated mock embedding');
    return mockEmbedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    // If embedding generation fails, return a zero vector
    // This ensures the application can continue functioning
    console.warn('Returning zero vector due to embedding generation failure');
    return new Array(VECTOR_DIM).fill(0);
  }
}

/**
 * Normalize a vector to ensure it has the correct dimension
 * 
 * @param {number[]} arr - The vector to normalize
 * @returns {number[]} The normalized vector
 */
function normalizeVector(arr) {
  if (!Array.isArray(arr)) throw new TypeError('Vector must be an array');
  if (arr.length === VECTOR_DIM) return arr;
  if (arr.length > VECTOR_DIM) return arr.slice(0, VECTOR_DIM);
  return arr.concat(new Array(VECTOR_DIM - arr.length).fill(0));
}

/**
 * Generate a deterministic embedding vector based on the text content
 * This is a fallback method when the API embedding generation fails
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {number[]} The deterministic embedding vector
 */
function generateDeterministicEmbedding(text) {
  // Create a simple hash of the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash as a seed to generate a deterministic vector
  const embedding = [];
  for (let i = 0; i < VECTOR_DIM; i++) {
    // Generate a value between -1 and 1 based on the hash and position
    const value = Math.sin(hash + i) / 2 + 0.5;
    embedding.push(value);
  }
  
  // Normalize the vector to have unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Check if a value is a valid embedding vector
 * 
 * @param {any} vec - The value to check
 * @returns {boolean} True if the value is a valid embedding vector
 */
function isValidEmbeddingVector(vec) {
  return Array.isArray(vec) && 
         vec.length > 0 && 
         vec.every(val => typeof val === 'number' && !isNaN(val));
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} Cosine similarity (between -1 and 1, higher is more similar)
 */
function calculateCosineSimilarity(vec1, vec2) {
  // Validate inputs
  if (!isValidEmbeddingVector(vec1) || !isValidEmbeddingVector(vec2)) {
    throw new TypeError('Vectors must be arrays of numbers');
  }
  
  if (vec1.length !== vec2.length) {
    throw new Error(`Vectors must have the same dimension (got ${vec1.length} and ${vec2.length})`);
  }
  
  // Calculate dot product
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  
  // Calculate magnitudes
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
  // Avoid division by zero
  if (mag1 === 0 || mag2 === 0) return 0;
  
  // Return cosine similarity
  return dotProduct / (mag1 * mag2);
}

/**
 * Preprocess a prompt to extract key concepts and generate query variants
 * 
 * @param {string} prompt - The original prompt
 * @returns {string[]} Array of query variants
 */
export function preprocessPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return [];
  }
  
  console.log(`Preprocessing prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
  
  // Convert to lowercase for consistent processing
  const lowerPrompt = prompt.toLowerCase();
  
  // Array to store query variants
  const queryVariants = [prompt]; // Always include the original prompt
  
  // Remove question words and phrases to focus on key concepts
  const questionPrefixes = [
    'what is', 'what are', 'what was', 'what were',
    'who is', 'who are', 'who was', 'who were',
    'where is', 'where are', 'where was', 'where were',
    'when is', 'when are', 'when was', 'when were',
    'why is', 'why are', 'why was', 'why were',
    'how is', 'how are', 'how was', 'how were',
    'do you remember', 'can you tell me', 'tell me about',
    'do you know', 'have i mentioned'
  ];
  
  // Try to extract the core query by removing question prefixes
  let coreQuery = lowerPrompt;
  for (const prefix of questionPrefixes) {
    if (lowerPrompt.startsWith(prefix)) {
      coreQuery = lowerPrompt.substring(prefix.length).trim();
      if (coreQuery) {
        queryVariants.push(coreQuery);
      }
      break;
    }
  }
  
  // Extract specific favorite phrases (keeping the full phrase together)
  const specificFavorites = [];
  
  // Look for "my favorite X" or "favorite X" patterns
  const favoriteRegex = /(my\s+)?favorite\s+([a-z]+(?:\s+[a-z]+){0,3})/g;
  let favoriteMatch;
  while ((favoriteMatch = favoriteRegex.exec(lowerPrompt)) !== null) {
    const fullPhrase = favoriteMatch[0]; // The full match (e.g., "my favorite song")
    const specificItem = favoriteMatch[2]; // Just the item (e.g., "song")
    
    // Only add if it's a specific favorite (not just "favorite" by itself)
    if (specificItem && specificItem.length > 0) {
      specificFavorites.push(fullPhrase);
      
      // Also add variant without "my" if it starts with "my"
      if (fullPhrase.startsWith("my ")) {
        specificFavorites.push(fullPhrase.substring(3));
      }
      
      // Add the specific item with "my" and "favorite" separately only if it's not too general
      if (specificItem.length > 3) {
        specificFavorites.push(`my ${specificItem}`);
        specificFavorites.push(`favorite ${specificItem}`);
      }
    }
  }
  
  // Look for other "my X" patterns that aren't about favorites
  const myRegex = /my\s+([a-z]+(?:\s+[a-z]+){0,3})/g;
  let myMatch;
  while ((myMatch = myRegex.exec(lowerPrompt)) !== null) {
    const fullPhrase = myMatch[0]; // The full match (e.g., "my house")
    const specificItem = myMatch[1]; // Just the item (e.g., "house")
    
    // Only add if it's specific enough and not already captured in favorites
    if (specificItem && 
        specificItem.length > 3 && 
        !fullPhrase.includes("favorite") && 
        !specificFavorites.some(f => f.includes(specificItem))) {
      specificFavorites.push(fullPhrase);
    }
  }
  
  // Add specific phrases to query variants
  queryVariants.push(...specificFavorites);
  
  // Remove duplicates and limit to MAX_QUERY_VARIANTS
  const uniqueVariants = [...new Set(queryVariants)].slice(0, MAX_QUERY_VARIANTS);
  
  console.log(`Generated ${uniqueVariants.length} query variants:`, uniqueVariants);
  return uniqueVariants;
}

/**
 * Find similar texts based on embedding similarity
 * 
 * @param {number[]} queryEmbedding - The embedding vector to compare against
 * @param {Array<{text: string, embedding: number[]}>} embeddingDatabase - Array of objects containing text and embedding
 * @param {Object} options - Optional parameters
 * @param {number} options.threshold - Similarity threshold (default: SIMILARITY_THRESHOLD)
 * @param {number} options.maxResults - Maximum number of results to return (default: MAX_RESULTS)
 * @returns {Array<{text: string, similarity: number}>} Array of similar texts with their similarity scores
 */
export function findSimilarTexts(queryEmbedding, embeddingDatabase, options = {}) {
  const threshold = options.threshold || SIMILARITY_THRESHOLD;
  const maxResults = options.maxResults || MAX_RESULTS;
  
  if (!Array.isArray(queryEmbedding)) {
    throw new TypeError('Query embedding must be an array');
  }
  
  if (!Array.isArray(embeddingDatabase)) {
    throw new TypeError('Embedding database must be an array');
  }
  
  console.log(`Finding similar texts among ${embeddingDatabase.length} items`);
  
  // Validate query embedding
  if (!isValidEmbeddingVector(queryEmbedding)) {
    console.error('Invalid query embedding:', queryEmbedding);
    return [];
  }
  
  // Calculate similarity for each item in the database
  const similarities = embeddingDatabase.map(item => {
    try {
      // Skip items with invalid embeddings
      if (!item || !item.text || !isValidEmbeddingVector(item.embedding)) {
        console.warn('Skipping item with invalid embedding:', 
          item ? `text: "${item.text?.substring(0, 20)}...", embedding: ${JSON.stringify(item.embedding).substring(0, 50)}` : 'undefined');
        return {
          text: item?.text || '',
          similarity: 0
        };
      }
      
      // Calculate similarity only for valid embeddings
      const similarity = calculateCosineSimilarity(queryEmbedding, item.embedding);
      return {
        text: item.text,
        similarity
      };
    } catch (error) {
      console.warn('Error calculating similarity:', error);
      console.warn('Problem item:', 
        item ? `text: "${item.text?.substring(0, 20)}...", embedding type: ${typeof item.embedding}` : 'undefined');
      return {
        text: item?.text || '',
        similarity: 0
      };
    }
  });
  
  // Filter by threshold and sort by similarity (descending)
  return similarities
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}

/**
 * Find similar texts using multiple query variants
 * 
 * @param {string} prompt - The original prompt
 * @param {Array<{text: string, embedding: number[]}>} embeddingDatabase - Array of objects containing text and embedding
 * @param {Object} options - Optional parameters
 * @returns {Promise<Array<{text: string, similarity: number}>>} Array of similar texts with their similarity scores
 */
export async function findRelevantContext(prompt, embeddingDatabase, options = {}) {
  if (!prompt || !embeddingDatabase || embeddingDatabase.length === 0) {
    return [];
  }
  
  console.log(`Finding relevant context for prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
  
  // Generate query variants
  const queryVariants = preprocessPrompt(prompt);
  
  // Generate embeddings for each query variant
  const embeddings = [];
  for (const variant of queryVariants) {
    try {
      const embedding = await generateEmbedding(variant, options.config);
      embeddings.push({
        variant,
        embedding
      });
    } catch (error) {
      console.error(`Error generating embedding for variant "${variant}":`, error);
    }
  }
  
  // Find similar texts for each embedding
  const allResults = [];
  for (const {variant, embedding} of embeddings) {
    try {
      const results = findSimilarTexts(embedding, embeddingDatabase, options);
      console.log(`Found ${results.length} results for variant "${variant}"`);
      allResults.push(...results);
    } catch (error) {
      console.error(`Error finding similar texts for variant "${variant}":`, error);
    }
  }
  
  // Remove duplicates by text
  const uniqueResults = [];
  const seenTexts = new Set();
  for (const result of allResults) {
    if (!seenTexts.has(result.text)) {
      seenTexts.add(result.text);
      uniqueResults.push(result);
    }
  }
  
  // Sort by similarity (descending) and limit to maxResults
  const maxResults = options.maxResults || MAX_RESULTS;
  const finalResults = uniqueResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
  
  console.log(`Found ${finalResults.length} unique relevant results across all variants`);
  return finalResults;
}