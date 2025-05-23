/**
 * @file src/db/participant/getParticipantByEmail.js
 * @description Retrieves a participant record from the database by email address.
 */

/**
 * Retrieves a participant by their email address
 * @param {string} email - The email of the participant to retrieve
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>} The participant record, or null if not found
 * @throws {Error} If a database error occurs
 */
export async function getParticipantByEmail(email, pool) {
  try {
        
    const query = `
      SELECT * FROM participants
      WHERE email = $1
    `;
    const values = [email];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to get participant by email: ${error.message}`);
  }
}