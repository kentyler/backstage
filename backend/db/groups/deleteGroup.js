// src/db/group/deleteGroup.js
/**
 * @file src/db/group/deleteGroup.js
 * @description Deletes a group by its ID.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';



/**
 * Deletes a group from the database.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} groupId - The ID of the group to delete.
 * @returns {Promise<boolean>} True if a group was deleted, false otherwise.
 */
export async function deleteGroup(groupId, pool) {
  try {
    const query = `
      DELETE FROM groups
      WHERE id = $1
    `;
    const result = await pool.query(query, [groupId]);
    
    // Check if any rows were affected by the delete operation
    if (result.rowCount === 0) {
      throw createDbError(`Group with ID ${groupId} not found`, {
        code: 'GROUP_NOT_FOUND',
        status: 404,
        context: { groupId }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting group:', {
      error: error.message,
      groupId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'deleteGroup' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '23503') { // Foreign key violation
      throw createDbError(`Cannot delete group ID ${groupId} - it is referenced by other records`, {
        code: 'REFERENCE_CONSTRAINT',
        status: 400, // Bad request - can't delete with references
        context: { groupId, operation: 'deleteGroup' },
        cause: error
      });
    }
    
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Groups table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'deleteGroup' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to delete group', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { groupId, operation: 'deleteGroup' },
      cause: error
    });
  }
}
