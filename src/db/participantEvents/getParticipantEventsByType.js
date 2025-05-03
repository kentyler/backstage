/**
 * @file src/db/participantEvents/getParticipantEventsByType.js
 * @description Retrieves all events of a specific type.
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves all events of a specific type
 * @param {number} eventTypeId - The ID of the event type
 * @param {string|object} [schemaOrPool=null] - Schema name or database connection pool
 * @returns {Promise<Array>} Array of participant event records
 * @throws {Error} If an error occurs during retrieval
 */
export async function getParticipantEventsByType(eventTypeId, schemaOrPool = null) {
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
             p.name as participant_name, p.email as participant_email
      FROM participant_events e
      JOIN participants p ON e.participant_id = p.id
      WHERE e.event_type_id = $1
      ORDER BY e.created_at DESC
    `;
    const { rows } = await customPool.query(query, [eventTypeId]);
    return rows;
  } catch (error) {
    throw new Error(`Failed to retrieve events by type: ${error.message}`);
  }
}