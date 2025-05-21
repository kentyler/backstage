import { pool as defaultPool } from '../connection.js';

/**
 * Get all topic paths sorted by path
 * @param {Pool} customPool - The PostgreSQL connection pool to use (optional)
 * @returns {Promise<Array>} Array of topic paths with ID, index, and path
 */
export async function getTopicPaths(customPool = null) {
  try {
    // Use the provided pool or fall back to the default pool
    const poolToUse = customPool || defaultPool;
    
    if (!poolToUse) {
      console.error('No database pool available in getTopicPaths');
      throw new Error('No database pool available');
    }
    
    console.log('Getting topic paths with pool:', poolToUse ? 'Pool provided' : 'No pool');
    
    const result = await poolToUse.query(
      'SELECT id, index, path::text FROM topic_paths ORDER BY index'
    );
    
    console.log(`Retrieved ${result.rows.length} topic paths`);
    return result.rows;
  } catch (error) {
    console.error('Error in getTopicPaths:', error);
    throw error;
  }
}

export default getTopicPaths;
