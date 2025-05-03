/**
 * @file src/db/participantEvents/getParticipantEventById.js
 * @description Retrieves a participant event by its ID.
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves a participant event by its ID
 * @param {number} id - The ID of the participant event to retrieve
 * @param {string|object} [schemaOrPool=null] - Schema name or database connection pool
 * @returns {Promise<object|null>} The participant event record or null if not found
 * @throws {Error} If an error occurs during retrieval
 */
export async function getParticipantEventById(id, schemaOrPool = null) {
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
      SELECT id, participant_id, event_type_id, details, created_at
      FROM participant_events
      WHERE id = $1
    `;
    const { rows } = await queryPool.query(query, [id]);
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to retrieve participant event: ${error.message}`);
  }
}