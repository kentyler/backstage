/**
 * @file src/db/participantAvatars/getParticipantAvatarsByAvatar.js
 * @description Retrieves all participant relationships for a specific avatar.
 */
import { pool } from '../connection.js';

/**
 * Retrieves all participant relationships for a specific avatar.
 *
 * @param {number} avatarId - The ID of the avatar
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<Array<object>>} Array of participant-avatar relationships
 * @throws {Error} If the operation fails
 */
export async function getParticipantAvatarsByAvatar(avatarId, customPool = pool) {
  try {
    const query = `
      SELECT 
        pa.id, 
        pa.participant_id, 
        pa.avatar_id, 
        pa.created_at, 
        pa.created_by_participant_id,
        p.name AS participant_name,
        p.email AS participant_email
      FROM public.participant_avatars pa
      JOIN public.participants p ON pa.participant_id = p.id
      WHERE pa.avatar_id = $1
      ORDER BY pa.created_at DESC
    `;
    
    const { rows } = await customPool.query(query, [avatarId]);
    
    return rows;
  } catch (error) {
    throw new Error(`Failed to retrieve participant-avatar relationships: ${error.message}`);
  }
}