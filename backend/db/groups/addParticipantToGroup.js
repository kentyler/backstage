/**
 * @file src/db/groups/addParticipantToGroup.js
 * @description Adds a participant to a group with optional role.
 */
import { createDbError } from '../utils/index.js';

/**
 * Adds a participant to a group with a specific role
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {number} participantId - The ID of the participant to add
 * @param {number} groupId - The ID of the group to add participant to
 * @param {number} clientId - The client ID to verify group ownership
 * @param {number} [participantRoleId=1] - The role ID for the participant (default: 1)
 * @returns {Promise<{participant_id: number, group_id: number, participant_role_id: number, created_at: string}>} The created membership record
 */
export async function addParticipantToGroup(pool, participantId, groupId, clientId, participantRoleId = 1) {
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
    
    // Verify the participant belongs to the same client
    const participantCheck = await pool.query(
      'SELECT id FROM participants WHERE id = $1 AND client_id = $2',
      [participantId, clientId]
    );
    
    if (participantCheck.rows.length === 0) {
      throw createDbError(`Participant with ID ${participantId} not found for this client`, {
        code: 'PARTICIPANT_NOT_FOUND',
        status: 404,
        context: { participantId, clientId }
      });
    }
    
    // Check if participant is already in the group
    const existingMembership = await pool.query(
      'SELECT * FROM participant_groups WHERE participant_id = $1 AND group_id = $2',
      [participantId, groupId]
    );
    
    if (existingMembership.rows.length > 0) {
      throw createDbError(`Participant ${participantId} is already a member of group ${groupId}`, {
        code: 'DUPLICATE_MEMBERSHIP',
        status: 409,
        context: { participantId, groupId }
      });
    }
    
    // Add the participant to the group
    const query = `
      INSERT INTO participant_groups (participant_id, group_id, participant_role_id)
      VALUES ($1, $2, $3)
      RETURNING participant_id, group_id, participant_role_id, created_at
    `;
    
    const result = await pool.query(query, [participantId, groupId, participantRoleId]);
    return result.rows[0];
    
  } catch (error) {
    console.error('Error adding participant to group:', {
      error: error.message,
      participantId,
      groupId,
      clientId,
      participantRoleId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'addParticipantToGroup' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique violation
      throw createDbError(`Participant ${participantId} is already a member of group ${groupId}`, {
        code: 'DUPLICATE_MEMBERSHIP',
        status: 409,
        context: { participantId, groupId, operation: 'addParticipantToGroup' },
        cause: error
      });
    }
    
    if (error.code === '23503') { // Foreign key violation
      throw createDbError('Invalid participant, group, or role ID', {
        code: 'FOREIGN_KEY_VIOLATION',
        status: 400,
        context: { participantId, groupId, participantRoleId, operation: 'addParticipantToGroup' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to add participant to group', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { participantId, groupId, clientId, operation: 'addParticipantToGroup' },
      cause: error
    });
  }
}