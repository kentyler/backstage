/**
 * @file src/db/groups/removeParticipantFromGroup.js
 * @description Removes a participant from a group.
 */
import { createDbError } from '../utils/index.js';

/**
 * Removes a participant from a group
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {number} participantId - The ID of the participant to remove
 * @param {number} groupId - The ID of the group to remove participant from
 * @param {number} clientId - The client ID to verify group ownership
 * @returns {Promise<boolean>} True if the participant was removed, false if membership didn't exist
 */
export async function removeParticipantFromGroup(pool, participantId, groupId, clientId) {
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
    
    // Remove the participant from the group
    const query = `
      DELETE FROM participant_groups 
      WHERE participant_id = $1 AND group_id = $2
    `;
    
    const result = await pool.query(query, [participantId, groupId]);
    
    // Check if any rows were affected
    if (result.rowCount === 0) {
      throw createDbError(`Participant ${participantId} is not a member of group ${groupId}`, {
        code: 'MEMBERSHIP_NOT_FOUND',
        status: 404,
        context: { participantId, groupId }
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('Error removing participant from group:', {
      error: error.message,
      participantId,
      groupId,
      clientId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'removeParticipantFromGroup' };
      throw error;
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to remove participant from group', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { participantId, groupId, clientId, operation: 'removeParticipantFromGroup' },
      cause: error
    });
  }
}