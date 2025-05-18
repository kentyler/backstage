// backend/services/embeddings.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536; // Must match the database vector dimensions

/**
 * Generates an embedding vector for the given text using OpenAI
 * @param {string} text - The text to generate embedding for
 * @returns {Promise<number[]>} The embedding vector
 * @throws {Error} If embedding generation fails
 */
export async function generateEmbedding(text) {
  if (!text?.trim()) {
    throw new Error('Text is required to generate embedding');
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS
    });

    const vector = response.data[0]?.embedding;
    if (!vector || !Array.isArray(vector)) {
      throw new Error('Invalid embedding response format');
    }

    return vector;
  } catch (error) {
    console.error('Error generating embedding:', {
      error: error.message,
      textLength: text?.length,
      model: EMBEDDING_MODEL
    });
    throw error;
  }
}