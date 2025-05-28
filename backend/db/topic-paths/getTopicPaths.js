import { createDbError } from '../utils/index.js';

/**
 * Get all topic paths sorted by path
 * @param {Pool} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} Array of topic paths with ID, index, and path
 */
export async function getTopicPaths(pool) {
  // Get a dedicated client from the pool
  const client = await pool.connect();
  
  try {
    if (!pool) {
      console.error('No database pool provided to getTopicPaths');
      throw createDbError('Database connection not available', {
        code: 'DB_CONNECTION_ERROR',
        status: 500,
        context: { operation: 'getTopicPaths' }
      });
    }
    
    console.log('Getting topic paths using dedicated client');
    
    // Log the current search path to debug schema issues
    try {
      const schemaResult = await client.query('SHOW search_path');
      console.log('Current search_path:', schemaResult.rows[0].search_path);
    } catch (schemaError) {
      console.error('Error checking search_path:', schemaError.message);
    }
    
    // Use standard query with a dedicated client that maintains schema context
    const result = await client.query(
      'SELECT id, index, path::text FROM topic_paths ORDER BY index'
    );
    
    console.log(`Retrieved ${result.rows.length} topic paths`);
    return result.rows;
  } catch (error) {
    console.error('Error in getTopicPaths:', error);
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getTopicPaths' };
      throw error;
    }
    
    // Otherwise wrap the error
    throw createDbError('Failed to retrieve topic paths', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { operation: 'getTopicPaths' },
      cause: error
    });
  } finally {
    // Always release the client back to the pool
    client.release();
    console.log('Released client back to the pool');
  }
}

export default getTopicPaths;
