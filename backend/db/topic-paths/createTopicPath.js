import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Creates a new topic path for a specific group
 * @param {Pool} pool - The PostgreSQL connection pool to use
 * @param {string} path - The ltree path to create
 * @param {number} groupId - The group ID the topic belongs to
 * @param {number} userId - ID of the user creating the path
 * @returns {Promise<Object>} The created topic path
 */
export async function createTopicPath(pool, path, groupId, userId) {
  try {
    console.log(`Getting max index for new topic path in group ${groupId}`);
    // First, get the maximum index value to place the new topic at the end for this group
    const maxIndexResult = await pool.query('SELECT MAX(index) FROM topic_paths WHERE group_id = $1', [groupId]);
    const maxIndex = maxIndexResult.rows[0].max || 0;
    const newIndex = maxIndex + 1;
    
    console.log(`Inserting new topic path: ${path}, group: ${groupId}, index: ${newIndex}`);
    
    // Insert the new topic path with the calculated index
    const result = await pool.query(
      'INSERT INTO topic_paths (path, created_by, group_id, index) VALUES ($1::ltree, $2, $3, $4) RETURNING id, path::text, group_id, index',
      [path, userId, groupId, newIndex]
    );
    
    if (!result.rows || result.rows.length === 0) {
      throw createDbError('Failed to create topic path - no rows returned', {
        code: 'DB_INSERT_FAILED',
        status: 500,
        context: { path, groupId, userId }
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
        context: { path, groupId, userId },
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
