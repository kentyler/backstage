/**
 * @file src/db/participant/getAllParticipants.js
 * @description Retrieves all participant records from the database.
 */


/**
 * Retrieves all participants from the database
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object[]>} Array of participant records
 * @throws {Error} If a database error occurs
 */
export async function getAllParticipants(pool) {
  try {
    const query = `
      SELECT * FROM participants
      ORDER BY id
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get all participants: ${error.message}`);
  }
}