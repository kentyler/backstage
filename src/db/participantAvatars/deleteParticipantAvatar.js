/**
 * @file src/db/participantAvatars/deleteParticipantAvatar.js
 * @description Deletes a participant-avatar relationship.
 */
import { pool } from '../connection.js';

/**
 * Deletes a participant-avatar relationship by ID.
 *
 * @param {number} id - The ID of the participant-avatar relationship to delete
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<object|null>} The deleted relationship or null if not found
 * @throws {Error} If the operation fails
 */
export async function deleteParticipantAvatar(id) {
  try {
    const query = `
      DELETE FROM participant_avatars
      WHERE id = $1
      RETURNING id, participant_id, avatar_id, created_at, created_by_participant_id
    `;
    
    const { rows } = await pool.query(query, [id]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Failed to delete participant-avatar relationship: ${error.message}`);
  }
}