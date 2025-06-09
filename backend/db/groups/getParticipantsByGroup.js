/**
 * @file src/db/groups/getParticipantsByGroup.js
 * @description Retrieves all participants that belong to a specific group.
 */
import { createDbError } from '../utils/index.js';

/**
 * Retrieves all participants that belong to a specific group
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {number} groupId - The ID of the group
 * @param {number} clientId - The client ID to filter by
 * @returns {Promise<Array<{id: number, name: string, email: string, participant_role_id: number, created_at: string}>>} Array of participant records
 */
export async function getParticipantsByGroup(pool, groupId, clientId) {
  try {
    // First verify the group exists and belongs to the client
    const groupCheck = await pool.query(
      'SELECT id FROM groups WHERE id = $1 AND client_id = $2',
      [groupId, clientId]
    );
    
    if (groupCheck.rows.length === 0) {
      throw createDbError(`Group with ID ${groupId} not found for this client`, {
        code: 'GROUP_NOT_FOUND',
        status: 404,
        context: { groupId, clientId }
      });
    }
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p.email,
        pg.participant_role_id,
        pg.created_at as joined_at
      FROM participants p
      JOIN participant_groups pg ON p.id = pg.participant_id
      WHERE pg.group_id = $1 AND p.client_id = $2
      ORDER BY p.name
    `;
    
    const result = await pool.query(query, [groupId, clientId]);
    return result.rows;
    
  } catch (error) {
    console.error('Error getting participants by group:', {
      error: error.message,
      groupId,
      clientId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getParticipantsByGroup' };
      throw error;
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to get participants by group', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { groupId, clientId, operation: 'getParticipantsByGroup' },
      cause: error
    });
  }
}