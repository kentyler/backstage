/**
 * @file src/db/participantAvatars/deleteParticipantAvatar.js
 * @description Deletes a participant-avatar relationship.
 */

/**
 * Deletes a participant-avatar relationship by ID.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} id - The ID of the participant-avatar relationship to delete
 * @returns {Promise<object|null>} The deleted relationship or null if not found
 * @throws {Error} If the operation fails
 */
export async function deleteParticipantAvatar(id, pool) {
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