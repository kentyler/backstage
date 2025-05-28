/**
 * @file src/db/participant/getParticipantsByGroup.js
 * @description Retrieves all participants in a specific group.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Retrieves all participants in a specific group
 * @param {number} groupId - The ID of the group
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object[]>} Array of participant records with their roles in the group
 * @throws {Error} If a database error occurs
 */
export async function getParticipantsByGroup(groupId, pool) {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.email,
        p.created_at,
        pg.role
      FROM participants p
      JOIN participant_groups pg ON p.id = pg.participant_id
      WHERE pg.group_id = $1
      ORDER BY p.id
    `;
    const values = [groupId];

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting participants by group:', {
      error: error.message,
      groupId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getParticipantsByGroup' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Required table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { groupId, operation: 'getParticipantsByGroup' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve participants by group', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { groupId, operation: 'getParticipantsByGroup' },
      cause: error
    });
  }
}