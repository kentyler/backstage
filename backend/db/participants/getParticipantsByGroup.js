/**
 * @file src/db/participant/getParticipantsByGroup.js
 * @description Retrieves all participants in a specific group.
 */


/**
 * Retrieves all participants in a specific group
 * @param {number} groupId - The ID of the group
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object[]>} Array of participant records with their roles in the group
 * @throws {Error} If a database error occurs
 */
export async function getParticipantsByGroup(groupId, pool) {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.email,
        p.created_at,
        pg.role
      FROM participants p
      JOIN participant_groups pg ON p.id = pg.participant_id
      WHERE pg.group_id = $1
      ORDER BY p.id
    `;
    const values = [groupId];

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get participants by group: ${error.message}`);
  }
}