import { createDbError } from '../utils/index.js';

/**
 * Get all topic paths for a specific group, sorted by index
 * @param {Pool} pool - The PostgreSQL connection pool
 * @param {number} groupId - The group ID to filter by
 * @returns {Promise<Array>} Array of topic paths with ID, index, and path
 */
export async function getTopicPaths(pool, groupId) {
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
      // Get the schema from the pool's options if available
      const poolSchema = pool.options?.schema || 'public';
      console.log('Pool schema from options:', poolSchema);

      // Check current search path
      const schemaResult = await client.query('SHOW search_path');
      const currentSchemaPath = schemaResult.rows[0].search_path;
      console.log('Current search_path for topic paths:', currentSchemaPath);
      
      // If the schema search path doesn't include our needed schema, set it explicitly
      if (!currentSchemaPath.includes(poolSchema)) {
        console.log(`Schema path does not include ${poolSchema} schema, setting it explicitly`);
        await client.query(`SET search_path TO ${poolSchema}, public`);
        const updatedSchema = await client.query('SHOW search_path');
        console.log('Updated search_path:', updatedSchema.rows[0].search_path);
      }
    } catch (schemaError) {
      console.error('Error checking or setting search_path:', schemaError.message);
    }
    
    // Use standard query with a dedicated client that maintains schema context
    const result = await client.query(
      'SELECT id, index, path::text, group_id FROM topic_paths WHERE group_id = $1 ORDER BY index',
      [groupId]
    );
    
    console.log(`Retrieved ${result.rows.length} topic paths for group ${groupId}`);
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
