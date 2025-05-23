/**
 * @file db/llm/utils/db-helpers.js
 * @description Database helper utilities for LLM operations
 */

/**
 * Executes a database operation with a dedicated client
 * @param {Object} pool - Database connection pool
 * @param {Function} operation - Function that takes a client and performs database operations
 * @returns {Promise<any>} The result of the operation
 */
export const withClient = async (pool, operation) => {
  if (!pool) {
    throw new Error('Database pool is required');
  }

  let client;
  try {
    // Get a client from the pool
    client = await pool.connect();
    console.log('Successfully connected to database pool');
    
    // Execute the provided operation with the client
    return await operation(client);
  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  } finally {
    // Always release the client back to the pool
    if (client) {
      await client.release();
    }
  }
};
