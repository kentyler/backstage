/**
 * @file src/db/preferences/getCurrentParticipantTopic.js
 * @description Retrieves the most recent topic a participant has viewed.
 */

/**
 * Gets the most recent topic preference for a participant
 * @param {number} participantId - The ID of the participant
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>} The current topic preference or null if none exists
 * @throws {Error} If an error occurs during retrieval
 */
export async function getCurrentParticipantTopic(participantId, pool) {
  try {
    // Topic preference type ID is 4
    const preferenceTypeId = 4;
    
    // Get the most recent topic preference by created_at timestamp
    // Using the new numeric ID structure for joining with topic_paths
    const query = `
      SELECT pp.*, tp.path, tp.id as topic_id, tp.index as topic_index
      FROM participant_preferences pp
      JOIN topic_paths tp ON tp.id = pp.value::bigint
      WHERE pp.participant_id = $1 
      AND pp.preference_type_id = $2
      ORDER BY pp.created_at DESC
      LIMIT 1
    `;
    const values = [participantId, preferenceTypeId];

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to get current topic preference: ${error.message}`);
  }
}

export default getCurrentParticipantTopic;
