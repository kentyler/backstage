/**
 * @file src/db/groups/getGroupsByParticipant.js
 * @description Retrieves all groups that a specific participant belongs to.
 */

/**
 * Retrieves all groups that a specific participant belongs to for a specific client
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {number} participantId - The ID of the participant
 * @param {number} clientId - The client ID to filter by
 * @returns {Promise<Array<{id: number, name: string, created_at: string, client_id: number, participant_role_id: number}>>} Array of group records
 * @throws {Error} If a database error occurs
 */
export async function getGroupsByParticipant(pool, participantId, clientId) {
  try {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.created_at,
        g.client_id,
        pg.participant_role_id
      FROM groups g
      JOIN participant_groups pg ON g.id = pg.group_id
      WHERE pg.participant_id = $1 AND g.client_id = $2
      ORDER BY g.name
    `;
    const values = [participantId, clientId];

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get groups by participant: ${error.message}`);
  }
}