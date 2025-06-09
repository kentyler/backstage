// src/db/group/createGroup.js
/**
 * @file src/db/group/createGroup.js
 * @description Creates a new group record in the database.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Creates a new group with the given name for a specific client.
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {string} name - The name of the group.
 * @param {number} clientId - The client ID the group belongs to.
 * @returns {Promise<{id: number, name: string, created_at: string, client_id: number}>} The newly created group record.
 */
export async function createGroup(pool, name, clientId) {
  try {
    // Check if a group with this name already exists for this client
    const checkQuery = `
      SELECT id FROM groups
      WHERE name = $1 AND client_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [name, clientId]);
    if (checkResult.rowCount > 0) {
      throw createDbError(`Group with name '${name}' already exists for this client`, {
        code: 'DUPLICATE_GROUP_NAME',
        status: 409, // Conflict
        context: { name, clientId }
      });
    }
    
    // Create the new group
    const query = `
      INSERT INTO groups (name, client_id)
      VALUES ($1, $2)
      RETURNING id, name, created_at, client_id
    `;
    const result = await pool.query(query, [name, clientId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating group:', {
      error: error.message,
      name,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'createGroup' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique violation
      throw createDbError(`Group with name '${name}' already exists`, {
        code: 'DUPLICATE_GROUP_NAME',
        status: 409, // Conflict
        context: { name, operation: 'createGroup' },
        cause: error
      });
    }
    
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Groups table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'createGroup' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to create group', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { name, operation: 'createGroup' },
      cause: error
    });
  }
}