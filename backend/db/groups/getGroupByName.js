// src/db/group/getGroupByName.js
/** 
 * @file src/db/group/getGroupByName.js
 * @description Retrieves a group record from the database by its name.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';


/**
 * Retrieves a single group by its name.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {string} name - The name of the group to retrieve.
 * @returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
 */
export async function getGroupByName(name, pool) {
  try {
    const query = `
      SELECT id, name, created_at
      FROM groups
      WHERE name = $1
    `;
    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error retrieving group by name:', {
      error: error.message,
      name,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getGroupByName' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Groups table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { name, operation: 'getGroupByName' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve group by name', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { name, operation: 'getGroupByName' },
      cause: error
    });
  }
}