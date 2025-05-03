/**
 * @file src/db/participantEvents/createParticipantEvent.js
 * @description Creates a new participant event record in the database.
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Creates a new participant event in the database
 * @param {number} participantId - The ID of the participant
 * @param {number} eventTypeId - The ID of the event type
 * @param {object} [details=null] - Optional JSON details about the event
 * @param {string|object} [schemaOrPool=null] - Schema name or database connection pool
 * @returns {Promise<object>} The newly created participant event record
 * @throws {Error} If an error occurs during creation
 */
export async function createParticipantEvent(participantId, eventTypeId, details = null, schemaOrPool = null) {
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
      INSERT INTO participant_events
        (participant_id, event_type_id, details)
      VALUES ($1, $2, $3)
      RETURNING id, participant_id, event_type_id, details, created_at
    `;
    const values = [participantId, eventTypeId, details];

    const { rows } = await queryPool.query(query, values);
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to create participant event: ${error.message}`);
  }
}