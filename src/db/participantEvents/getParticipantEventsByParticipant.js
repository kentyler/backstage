/**
 * @file src/db/participantEvents/getParticipantEventsByParticipant.js
 * @description Retrieves all events for a specific participant.
 */

/**
 * Retrieves all events for a specific participant
 * @param {number} participantId - The ID of the participant
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<Array>} Array of participant event records
 * @throws {Error} If an error occurs during retrieval
 */
export async function getParticipantEventsByParticipant(participantId, pool) {
  try {
    
    const query = `
      SELECT e.id, e.participant_id, e.event_type_id, e.details, e.created_at,
             t.name as event_type_name
      FROM participant_events e
      LEFT JOIN participant_event_types t ON e.event_type_id = t.id
      WHERE e.participant_id = $1
      ORDER BY e.created_at DESC
    `;
    const { rows } = await pool.query(query, [participantId]);
    return rows;
  } catch (error) {
    throw new Error(`Failed to retrieve participant events: ${error.message}`);
  }
}