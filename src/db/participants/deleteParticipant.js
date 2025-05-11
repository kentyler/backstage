/**
 * @file src/db/participant/deleteParticipant.js
 * @description Deletes a participant by ID from the database.
 */

/**
 * The database connection pool
 */
import { pool } from '../connection.js';

/**
 * Deletes a participant from the database
 * @param {number} id - The ID of the participant to delete
 * @returns {Promise<boolean>} True if a participant was deleted, false otherwise
 * @throws {Error} If a database error occurs
 */
export async function deleteParticipant(id) {
  try {
    // Check if it's the test participant (ID: 1) - optional protection
    // if (id === 1) {
    //   throw new Error('Cannot delete the test participant (ID: 1)');
    // }

    const query = `
      DELETE FROM participants
      WHERE id = $1
    `;
    const values = [id];

    const result = await pool.query(query, values);
    return result.rowCount > 0;
  } catch (error) {
    throw new Error(`Failed to delete participant: ${error.message}`);
  }
}