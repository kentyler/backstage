import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Creates a new topic path
 * @param {string} path - The ltree path to create
 * @param {number} userId - ID of the user creating the path
 * @param {Pool} pool - The PostgreSQL connection pool to use
 * @returns {Promise<Object>} The created topic path
 */
export async function createTopicPath(path, userId, pool) {
  try {
    console.log(`Getting max index for new topic path`);
    // First, get the maximum index value to place the new topic at the end
    const maxIndexResult = await pool.query('SELECT MAX(index) FROM topic_paths');
    const maxIndex = maxIndexResult.rows[0].max || 0;
    const newIndex = maxIndex + 1;
    
    console.log(`Inserting new topic path: ${path}, index: ${newIndex}`);
    
    // Insert the new topic path with the calculated index
    const result = await pool.query(
      'INSERT INTO topic_paths (path, created_by, index) VALUES ($1::ltree, $2, $3) RETURNING id, path::text, index',
      [path, userId, newIndex]
    );
    
    if (!result.rows || result.rows.length === 0) {
      throw createDbError('Failed to create topic path - no rows returned', {
        code: 'DB_INSERT_FAILED',
        status: 500,
        context: { path, userId }
      });
    }
    
    console.log('Successfully created topic path:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createTopicPath:', {
      error: error.message,
      path,
      userId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'createTopicPath' };
      throw error;
    }
    
    // Check for potential duplicate key errors
    if (error.code === '23505') { // PostgreSQL duplicate key error
      throw createDbError(`Topic path "${path}" already exists`, {
        code: 'DUPLICATE_TOPIC_PATH',
        status: 409, // Conflict
        context: { path, userId },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to create topic path', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { path, userId, operation: 'createTopicPath' },
      cause: error
    });
  }
}

export default createTopicPath;
