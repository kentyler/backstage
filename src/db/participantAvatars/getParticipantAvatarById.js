/**
 * @file src/db/participantAvatars/getParticipantAvatarById.js
 * @description Retrieves a participant-avatar relationship by ID.
 */
import { pool } from '../connection.js';

/**
 * Retrieves a participant-avatar relationship by ID.
 *
 * @param {number} id - The ID of the participant-avatar relationship
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<object|null>} The participant-avatar relationship or null if not found
 * @throws {Error} If the operation fails
 */
export async function getParticipantAvatarById(id, customPool = pool) {
  try {
    const query = `
      SELECT 
        pa.id, 
        pa.participant_id, 
        pa.avatar_id, 
        pa.created_at, 
        pa.created_by_participant_id,
        p.name AS participant_name,
        a.name AS avatar_name
      FROM participant_avatars pa
      JOIN participants p ON pa.participant_id = p.id
      JOIN avatars a ON pa.avatar_id = a.id
      WHERE pa.id = $1
    `;
    
    const { rows } = await customPool.query(query, [id]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Failed to retrieve participant-avatar relationship: ${error.message}`);
  }
}