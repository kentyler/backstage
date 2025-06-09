import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Update a topic path in the database for a specific group.
 * TODO: In the future, we'll need to handle any posts that use this path
 * by updating their paths as well.
 */
export default async function updateTopicPath(pool, oldPath, newPath, groupId) {
  try {
  // First check if the new path already exists in this group
  const existingPath = await pool.query(
    'SELECT id FROM topic_paths WHERE path::text = $1 AND group_id = $2',
    [newPath, groupId]
  );

  if (existingPath.rowCount > 0) {
    throw createDbError(`Topic path "${newPath}" already exists in this group`, {
      code: 'DUPLICATE_TOPIC_PATH',
      status: 409, // Conflict
      context: { oldPath, newPath, groupId }
    });
  }

  // Update the path and any paths that start with this path followed by a dot
  const result = await pool.query(
    `UPDATE topic_paths 
     SET path = 
       CASE 
         WHEN path::text = $1 THEN $2::ltree
         ELSE ($2::ltree || subpath(path, nlevel($1::ltree)))::ltree
       END
     WHERE group_id = $4 AND (path::text = $1 OR path::text LIKE $3)
     RETURNING id, path`,
    [oldPath, newPath, `${oldPath}.%`, groupId]
  );

  if (result.rowCount === 0) {
    throw createDbError(`Topic path "${oldPath}" not found`, {
      code: 'TOPIC_PATH_NOT_FOUND',
      status: 404,
      context: { oldPath, newPath, groupId }
    });
  }

  // Return info about what was updated
  return {
    updatedCount: result.rowCount,
    paths: result.rows.map(row => row.path)
  };
  } catch (error) {
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'updateTopicPath' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Topic paths table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { oldPath, newPath, groupId, operation: 'updateTopicPath' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to update topic path', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { oldPath, newPath, groupId, operation: 'updateTopicPath' },
      cause: error
    });
  }
}
