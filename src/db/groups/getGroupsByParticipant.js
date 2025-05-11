/**
 * @file src/db/groups/getGroupsByParticipant.js
 * @description Retrieves all groups that a specific participant belongs to.
 */

import { pool } from '../connection.js';

/**
 * Retrieves all groups that a specific participant belongs to
 * @param {number} participantId - The ID of the participant
 * @returns {Promise<Array<{id: number, name: string, created_at: string, role: string}>>} Array of group records
 * @throws {Error} If a database error occurs
 */
export async function getGroupsByParticipant(participantId) {
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