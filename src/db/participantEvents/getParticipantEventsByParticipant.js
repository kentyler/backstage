/**
 * @file src/db/participantEvents/getParticipantEventsByParticipant.js
 * @description Retrieves all events for a specific participant.
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves all events for a specific participant
 * @param {number} participantId - The ID of the participant
 * @param {string|object} [schemaOrPool=null] - Schema name or database connection pool
 * @returns {Promise<Array>} Array of participant event records
 * @throws {Error} If an error occurs during retrieval
 */
export async function getParticipantEventsByParticipant(participantId, schemaOrPool = null) {
  try {
    // Determine which pool to use
    let queryPool = pool;
    
    if (schemaOrPool) {
      if (typeof schemaOrPool === 'string') {
        // If a schema name is provided, create a pool for that schema
        queryPool = createPool(schemaOrPool);
      } else {
        // If a pool object is provided, use it
        queryPool = schemaOrPool;
      }
    }
    
    const query = `
      SELECT e.id, e.participant_id, e.event_type_id, e.details, e.created_at,
             t.name as event_type_name
      FROM participant_events e
      LEFT JOIN participant_event_types t ON e.event_type_id = t.id
      WHERE e.participant_id = $1
      ORDER BY e.created_at DESC
    `;
    const { rows } = await queryPool.query(query, [participantId]);
    return rows;
  } catch (error) {
    throw new Error(`Failed to retrieve participant events: ${error.message}`);
  }
}