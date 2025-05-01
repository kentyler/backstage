/**
 * @file src/db/groups/getGroupsByParticipant.js
 * @description Retrieves all groups that a specific participant belongs to.
 */

/**
 * The database connection pool
 */
import { pool as defaultPool } from '../connection.js';

/**
 * Retrieves all groups that a specific participant belongs to
 * @param {number} participantId - The ID of the participant
 * @param {object} [pool=defaultPool] - Database connection pool (for testing)
 * @returns {Promise<object[]>} Array of group records
 * @throws {Error} If a database error occurs
 */
export async function getGroupsByParticipant(participantId, pool = defaultPool) {
  try {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.created_at,
        pg.role
      FROM public.groups g
      JOIN public.participant_groups pg ON g.id = pg.group_id
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