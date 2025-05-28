/**
 * Create a new file upload vector
 * @module db/fileUploadVectors/createFileUploadVector
 */

import { createDbError, DB_ERROR_CODES } from '../utils/dbError.js';

// Max retry attempts for handling transient foreign key issues
const MAX_RETRIES = 3;

/**
 * Create a new file upload vector entry for a file chunk
 * @param {Object} vectorData - The vector data
 * @param {number} vectorData.fileUploadId - The ID of the file upload
 * @param {number} vectorData.chunkIndex - The index of the chunk
 * @param {string} vectorData.contentText - The text content of the chunk
 * @param {Array} vectorData.contentVector - The vector representation of the content
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The created vector record
 */
export async function createFileUploadVector(vectorData, pool, retryCount = 0) {
  const {
    fileUploadId,
    chunkIndex,
    contentText,
    contentVector,
    schemaName // Extract schema name if provided
  } = vectorData;
  
  // Log the parameters received to help debug schema issues
  console.log(`Creating vector for file ${fileUploadId}, chunk ${chunkIndex}, schema ${schemaName || 'not specified'}`);
  
  // Validate required fields
  if (!fileUploadId) {
    throw createDbError('File upload ID is required', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  if (chunkIndex === undefined || chunkIndex === null) {
    throw createDbError('Chunk index is required', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  if (!contentText) {
    throw createDbError('Content text is required', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  if (!contentVector || !Array.isArray(contentVector)) {
    throw createDbError('Content vector must be an array', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  
  try {
    // Convert vector to string representation if needed
    const vectorValue = typeof contentVector === 'string' 
      ? contentVector 
      : JSON.stringify(contentVector);
    
    // First verify if file exists - prevents unnecessary insertion attempts
    let client = null;
    try {
      // Get a dedicated connection
      client = await pool.connect();
      
      // Explicitly set the schema context - this is essential for multi-tenant operations
      // First, use the schema explicitly provided in the vectorData if available
      // This takes precedence over all other methods of determining the schema
      let effectiveSchema = vectorData.schemaName || 'public';
      
      // If no schema was explicitly provided, try to determine it from connection options
      if (!vectorData.schemaName) {
        // Try different ways to get the schema name
        if (client.database && client.database.includes('schema=')) {
          // Extract from connection string if available
          const schemaMatch = client.database.match(/schema=([^&]+)/i);
          if (schemaMatch && schemaMatch[1]) {
            effectiveSchema = schemaMatch[1];
          }
        } else if (pool._clients && pool._clients[0] && pool._clients[0].connectionParameters) {
          // Try to get from pool's clients connectionParameters
          const params = pool._clients[0].connectionParameters;
          if (params.search_path) {
            const parts = params.search_path.split(',');
            if (parts.length > 0) {
              effectiveSchema = parts[0].trim().replace(/\"/g, '');
            }
          }
        } else if (pool.options && pool.options.connectionString) {
          // Try extracting from connectionString
          const connStr = pool.options.connectionString;
          if (connStr.includes('search_path=')) {
            const schemaMatch = connStr.match(/search_path=([^&]+)/i);
            if (schemaMatch && schemaMatch[1]) {
              effectiveSchema = schemaMatch[1].split(',')[0].trim();
            }
          }
        }
      }
      
      console.log(`Vector operation: Using schema '${effectiveSchema}' for file ${fileUploadId}. Determined from: ${vectorData.schemaName ? 'explicit parameter' : 'connection info'}`);
      
      // Set the search path explicitly for this query
      await client.query(`SET search_path TO "${effectiveSchema}", public;`);
      
      // Now verify if the file exists
      const checkQuery = `SELECT EXISTS(SELECT 1 FROM file_uploads WHERE id = $1) as exists`;
      const checkResult = await client.query(checkQuery, [fileUploadId]);
      
      if (!checkResult.rows[0].exists) {
        throw createDbError(`File upload with ID ${fileUploadId} does not exist in schema ${effectiveSchema}`, {
          code: DB_ERROR_CODES.NOT_FOUND,
          status: 404,
          context: { fileUploadId, chunkIndex, schema: effectiveSchema }
        });
      }
      
      // Now execute the vector insertion with the same client to maintain schema context
      const queryText = `
        INSERT INTO file_upload_vectors 
        (file_upload_id, chunk_index, content_text, content_vector) 
        VALUES ($1, $2, $3, $4::vector) 
        ON CONFLICT (file_upload_id, chunk_index) DO UPDATE
        SET content_text = EXCLUDED.content_text, 
            content_vector = EXCLUDED.content_vector
        RETURNING *
      `;
      
      const values = [
        fileUploadId,
        chunkIndex,
        contentText,
        vectorValue
      ];
      
      const result = await client.query(queryText, values);
      return result.rows[0];
    } catch (verifyError) {
      // If it's already a DB error, rethrow it
      if (verifyError.isDbError) throw verifyError;
      
      // Otherwise wrap it
      throw createDbError(`Error verifying file ${fileUploadId} existence`, {
        code: DB_ERROR_CODES.DATABASE_ERROR,
        status: 500,
        context: { fileUploadId, chunkIndex, originalError: verifyError }
      });
    } finally {
      // Always release the client back to the pool
      if (client) client.release();
    }
  } catch (error) {
    // Handle foreign key constraint violation with retry logic
    if (error.code === '23503' && // Foreign key violation
        error.constraint === 'file_upload_vectors_file_upload_id_fkey' &&
        retryCount < MAX_RETRIES) {
      
      console.log(`Retrying vector creation for file ${fileUploadId} chunk ${chunkIndex} (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
      
      // Exponential backoff: wait longer between retries
      const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented retry count
      return createFileUploadVector(vectorData, pool, retryCount + 1);
    }
    
    // If we've exhausted retries or it's a different error, throw with proper error structure
    console.error('Error creating file upload vector:', error);
    
    if (error.code === '23503') { // Foreign key violation
      throw createDbError(`Referenced file ${fileUploadId} was not found`, {
        code: DB_ERROR_CODES.FOREIGN_KEY_VIOLATION,
        status: 404,
        context: { fileUploadId, chunkIndex, originalError: error }
      });
    }
    
    // For any other database error
    throw createDbError('Failed to create file upload vector', {
      code: error.code || DB_ERROR_CODES.DATABASE_ERROR,
      status: 500,
      context: { fileUploadId, chunkIndex, originalError: error }
    });
  }
}
