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
 * @param {object} [pool=defaultPool] - Database connection pool
 * @returns {Promise<Array<{id: number, name: string, created_at: string, role: string}>>} Array of group records
 * @throws {Error} If a database error occurs
 */
export async function getGroupsByParticipant(participantId, pool = defaultPool) {
  // Debug: Log the schema being used
  console.log(`getGroupsByParticipant: Using pool with schema:`, 
    pool === defaultPool ? 'defaultPool' : 'custom pool');
  
  // Get the actual schema from the pool if possible
  try {
    const schemaResult = await pool.query('SHOW search_path;');
    console.log('Current search_path:', schemaResult.rows[0].search_path);
  } catch (schemaError) {
    console.error('Error getting search_path:', schemaError.message);
  }
  
  try {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.created_at,
        pg.participant_role_id
      FROM groups g
      JOIN participant_groups pg ON g.id = pg.group_id
      WHERE pg.participant_id = $1
      ORDER BY g.name
    `;
    const values = [participantId];

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get groups by participant: ${error.message}`);
  }
}