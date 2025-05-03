/**
 * @file src/db/participant/getParticipantByEmail.js
 * @description Retrieves a participant record from the database by email address.
 */

/**
 * The database connection pool and schema utilities
 */
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves a participant by their email address
 * @param {string} email - The email of the participant to retrieve
 * @param {string|object} [schemaOrPool=null] - Schema name or database connection pool
 * @returns {Promise<object|null>} The participant record, or null if not found
 * @throws {Error} If a database error occurs
 */
export async function getParticipantByEmail(email, schemaOrPool = null) {
  try {
    // Determine which pool to use
    let queryPool = pool;
    
    if (schemaOrPool) {
      if (typeof schemaOrPool === 'string') {
        // If a schema name is provided, create a pool for that schema
        queryPool = createPool(schemaOrPool);
      } else {
        // If a pool object is provided, use it
        queryPool = schemaOrPool;
      }
    }
    
    const query = `
      SELECT * FROM participants
      WHERE email = $1
    `;
    const values = [email];

    const result = await queryPool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to get participant by email: ${error.message}`);
  }
}