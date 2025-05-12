/**
 * @file src/db/participantAvatars/getParticipantAvatarsByParticipant.js
 * @description Retrieves all avatar relationships for a specific participant.
 */

/**
 * Retrieves all avatar relationships for a specific participant.
 * @param {number} participantId - The ID of the participant
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<Array<object>>} Array of participant-avatar relationships
 * @throws {Error} If the operation fails
 */
export async function getParticipantAvatarsByParticipant(participantId, pool) {
  try {
    const query = `
      SELECT 
        pa.id, 
        pa.participant_id, 
        pa.avatar_id, 
        pa.created_at, 
        pa.created_by_participant_id,
        a.name AS avatar_name,
        a.instruction_set
      FROM participant_avatars pa
      JOIN avatars a ON pa.avatar_id = a.id
      WHERE pa.participant_id = $1
      ORDER BY pa.created_at DESC
    `;
    
    const { rows } = await pool.query(query, [participantId]);
    
    return rows;
  } catch (error) {
    throw new Error(`Failed to retrieve participant-avatar relationships: ${error.message}`);
  }
}