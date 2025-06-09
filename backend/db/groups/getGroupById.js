// src/db/group/getGroupById.js
/**
 * @file src/db/group/getGroupById.js
 * @description Retrieves a group record from the database by its ID.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';



/**
 * Retrieves a single group by its ID for a specific client.
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {number} id - The ID of the group to retrieve.
 * @param {number} clientId - The client ID to filter by.
 * @returns {Promise<{id: number, name: string, created_at: string, client_id: number}|null>} The group record, or null if not found.
 */
export async function getGroupById(pool, id, clientId) {
  try {
    const query = `
      SELECT id, name, created_at, client_id
      FROM groups
      WHERE id = $1 AND client_id = $2
    `;
    const result = await pool.query(query, [id, clientId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting group by ID:', {
      error: error.message,
      groupId: id,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getGroupById' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Groups table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { groupId: id, operation: 'getGroupById' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve group', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { groupId: id, operation: 'getGroupById' },
      cause: error
    });
  }
}
