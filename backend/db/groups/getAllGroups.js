// src/db/group/getAllGroups.js
/**
 * @file src/db/group/getAllGroups.js
 * @description Retrieves all group records from the database.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';


/**
 * Retrieves all groups from the database.
 * @returns {Promise<Array<{id: number, name: string, created_at: string}>>} Array of group records.
 * @param { Pool } pool - The PostgreSQL connection pool.
 */
export async function getAllGroups(pool) {
  try {
    const query = `
      SELECT id, name, created_at
      FROM groups
      ORDER BY id
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error retrieving all groups:', {
      error: error.message,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getAllGroups' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Groups table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'getAllGroups' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve groups', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { operation: 'getAllGroups' },
      cause: error
    });
  }
}