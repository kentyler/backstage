/**
 * @file src/db/participantEvents/getParticipantEventsByType.js
 * @description Retrieves all events of a specific type.
 */

/**
 * Retrieves all events of a specific type
 * @param {number} eventTypeId - The ID of the event type
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<Array>} Array of participant event records
 * @throws {Error} If an error occurs during retrieval
 */
export async function getParticipantEventsByType(eventTypeId, pool) {
  try {
    
    
    const query = `
      SELECT e.id, e.participant_id, e.event_type_id, e.details, e.created_at,
             p.name as participant_name, p.email as participant_email
      FROM participant_events e
      JOIN participants p ON e.participant_id = p.id
      WHERE e.event_type_id = $1
      ORDER BY e.created_at DESC
    `;
    const { rows } = await pool.query(query, [eventTypeId]);
    return rows;
  } catch (error) {
    throw new Error(`Failed to retrieve events by type: ${error.message}`);
  }
}