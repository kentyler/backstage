/**
 * @file src/db/participantAvatars/createParticipantAvatar.js
 * @description Creates a new participant-avatar relationship.
 */
import { pool } from '../connection.js';

/**
 * Creates a new participant-avatar relationship.
 *
 * @param {number} participantId - The ID of the participant
 * @param {number} avatarId - The ID of the avatar
 * @param {number} [createdByParticipantId=null] - The ID of the participant who created this relationship
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<object>} The newly created participant-avatar relationship
 * @throws {Error} If the operation fails
 */
export async function createParticipantAvatar(
  participantId,
  avatarId,
  createdByParticipantId = null,
  customPool = pool
) {
  try {
    const query = `
      INSERT INTO participant_avatars
        (participant_id, avatar_id, created_by_participant_id)
      VALUES ($1, $2, $3)
      RETURNING id, participant_id, avatar_id, created_at, created_by_participant_id
    `;
    
    const values = [participantId, avatarId, createdByParticipantId];
    const { rows } = await customPool.query(query, values);
    
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to create participant-avatar relationship: ${error.message}`);
  }
}