/**
 * Search for file uploads
 * @module db/fileUploads/searchFileUploads
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Search for file uploads by text content, filename, or tags
 * @param {Object} options - Search options
 * @param {string} options.query - The search query
 * @param {string[]} [options.mimeTypes] - Optional filter by MIME types
 * @param {string[]} [options.tags] - Optional filter by tags
 * @param {number} [options.limit=20] - Maximum number of results to return
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} - Array of matching file uploads
 */
export async function searchFileUploads(options, pool) {
  const { 
    query, 
    mimeTypes = null, 
    tags = null, 
    limit = 20 
  } = options;
  
  if (!query) {
    throw createDbError('Search query is required', {
      code: 'INVALID_PARAMETER',
      status: 400,
      context: { operation: 'searchFileUploads' }
    });
  }

  try {

    // Build the query with full-text search capabilities
    let queryText = `
      SELECT f.*, 
             CASE
               WHEN fv.content_text IS NOT NULL THEN 
                 ts_rank(to_tsvector('english', fv.content_text), plainto_tsquery('english', $1))
               ELSE 0
             END AS content_rank,
             CASE
               WHEN f.filename IS NOT NULL THEN
                 ts_rank(to_tsvector('english', f.filename), plainto_tsquery('english', $1))
               ELSE 0
             END AS filename_rank
      FROM file_uploads f
      LEFT JOIN (
        SELECT DISTINCT ON (file_upload_id) 
               file_upload_id, 
               content_text
        FROM file_upload_vectors
        WHERE content_text ILIKE $2
      ) fv ON f.id = fv.file_upload_id
      WHERE (f.filename ILIKE $2 OR fv.content_text ILIKE $2)
    `;
    
    const queryParams = [query, `%${query}%`];
    let paramIndex = 3;
    
    // Add mime type filter if provided
    if (mimeTypes && mimeTypes.length > 0) {
      queryText += ` AND f.mime_type = ANY($${paramIndex})`;
      queryParams.push(mimeTypes);
      paramIndex++;
    }
    
    // Add tags filter if provided
    if (tags && tags.length > 0) {
      queryText += ` AND f.tags && $${paramIndex}`;
      queryParams.push(tags);
      paramIndex++;
    }
    
    // Add ranking and limit
    queryText += `
      ORDER BY 
        (content_rank + filename_rank) DESC,
        f.uploaded_at DESC
      LIMIT $${paramIndex}
    `;
    queryParams.push(limit);
    
    // Execute the query
    const result = await pool.query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error searching file uploads:', {
      error: error.message,
      query,
      mimeTypes,
      tags,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'searchFileUploads' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Required table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'searchFileUploads' },
        cause: error
      });
    }
    
    if (error.code === '22P02') { // Invalid text representation
      throw createDbError('Invalid search parameters', {
        code: 'INVALID_SEARCH_PARAMS',
        status: 400,
        context: { query, mimeTypes, tags, operation: 'searchFileUploads' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Error performing file search', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { query, mimeTypes, tags, limit, operation: 'searchFileUploads' },
      cause: error
    });
  }
}
