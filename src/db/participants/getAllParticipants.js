/**
 * @file src/db/participant/getAllParticipants.js
 * @description Retrieves all participant records from the database.
 */

/**
 * The database connection pool
 */
import { pool } from '../connection.js';

/**
 * Retrieves all participants from the database
 * @returns {Promise<object[]>} Array of participant records
 * @throws {Error} If a database error occurs
 */
export async function getAllParticipants() {
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