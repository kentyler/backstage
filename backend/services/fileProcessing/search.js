/**
 * File Content Search Service
 * 
 * Provides semantic search functionality across file content
 * using vector similarity search.
 */

import { generateEmbedding } from '../embeddings.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Search within file content using semantic similarity
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @param {string} [options.schemaName] - Schema name to search within
 * @param {number} [options.limit=5] - Maximum number of results to return
 * @param {number} [options.threshold=0.7] - Similarity threshold (0-1)
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} - Search results
 */
export async function searchFileContent(query, options = {}, pool) {
  const {
    schemaName = getDefaultSchema(),
    limit = 5,
    threshold = 0.7
  } = options;
  
  try {
    // 1. Generate embedding for the query
    const queryVector = await generateEmbedding(query);
    
    // 2. Perform vector search
    const { searchSimilarVectors } = await import('../../db/fileUploadVectors/index.js');
    const results = await searchSimilarVectors(queryVector, {
      limit,
      threshold
    }, pool);
    
    // 3. Format results
    return results.map(result => ({
      fileId: result.file_upload_id,
      fileName: result.filename,
      mimeType: result.mime_type,
      chunkIndex: result.chunk_index,
      content: result.content_text,
      url: result.public_url,
      similarity: result.similarity
    }));
  } catch (error) {
    console.error('Error searching file content:', error);
    throw error;
  }
}