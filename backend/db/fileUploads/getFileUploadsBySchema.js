/**
 * Get file uploads for a schema
 * @module db/fileUploads/getFileUploadsBySchema
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Get all file uploads for a schema, with optional pagination
 * @param {Object} options - Query options
 * @param {number} [options.limit=50] - Maximum number of records to return
 * @param {number} [options.offset=0] - Number of records to skip
 * @param {string} [options.search] - Optional search term to filter by filename
 * @param {string[]} [options.tags] - Optional tags to filter by
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - Object with uploads array and total count
 */
export async function getFileUploadsBySchema(options = {}, pool) {
  const { 
    limit = 50, 
    offset = 0, 
    search = null,
    tags = null
  } = options;

  try {
    
    // Build the query based on filters
    let queryText = `SELECT * FROM file_uploads WHERE 1=1`;
    const queryParams = [];
    let paramIndex = 1;
    
    // Add search filter if provided
    if (search) {
      queryText += ` AND (filename ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add tags filter if provided
    if (tags && tags.length > 0) {
      queryText += ` AND tags && $${paramIndex}`;
      queryParams.push(tags);
      paramIndex++;
    }
    
    // Add sorting
    queryText += ` ORDER BY uploaded_at DESC`;
    
    // Get total count for pagination
    const countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add pagination
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    // Execute the query
    const result = await pool.query(queryText, queryParams);
    
    return {
      uploads: result.rows,
      total: totalCount,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error getting file uploads by schema:', {
      error: error.message,
      options,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getFileUploadsBySchema' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('File uploads table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'getFileUploadsBySchema' },
        cause: error
      });
    }
    
    if (error.code === '42703') { // Undefined column
      throw createDbError('Invalid column in query', {
        code: 'DB_INVALID_COLUMN',
        status: 500,
        context: { options, operation: 'getFileUploadsBySchema' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve file uploads', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { options, operation: 'getFileUploadsBySchema' },
      cause: error
    });
  }
}
