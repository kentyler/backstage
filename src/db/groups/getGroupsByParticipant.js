/**
 * @file src/db/groups/getGroupsByParticipant.js
 * @description Retrieves all groups that a specific participant belongs to.
 */

/**
 * The database connection pool and schema utilities
 */
import { pool as defaultPool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves all groups that a specific participant belongs to
 * @param {number} participantId - The ID of the participant
 * @param {string|object} [schemaOrPool=null] - Database schema name or connection pool
 * @returns {Promise<Array<{id: number, name: string, created_at: string, role: string}>>} Array of group records
 * @throws {Error} If a database error occurs
 */
export async function getGroupsByParticipant(participantId, schemaOrPool = null) {
  // Determine which pool to use
  let queryPool = defaultPool;
  
  if (schemaOrPool) {
    if (typeof schemaOrPool === 'string') {
      // If a schema name is provided, create a pool for that schema
      queryPool = createPool(schemaOrPool);
    } else {
      // If a pool object is provided, use it
      queryPool = schemaOrPool;
    }
  } else {
    // Use default schema if no schema or pool is provided
    const defaultSchema = getDefaultSchema();
    if (defaultSchema !== 'public') {
      queryPool = createPool(defaultSchema);
    }
  }
  try {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.created_at,
        pg.role
      FROM groups g
      JOIN participant_groups pg ON g.id = pg.group_id
      WHERE pg.participant_id = $1
      ORDER BY g.name
    `;
    const values = [participantId];

    const result = await queryPool.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get groups by participant: ${error.message}`);
  }
}