// src/db/group/updateGroup.js

/**
 * @file src/db/group/updateGroup.js
 * @description Updates a group's properties in the database.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Updates an existing group's properties for a specific client.
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {number} groupId - The ID of the group to update.
 * @param {number} clientId - The client ID to filter by.
 * @param {Object} updates - The properties to update.
 * @param {string} [updates.name] - The new name for the group.
 * @returns {Promise<{id: number, name: string, created_at: string, client_id: number}|null>} The updated group record, or null if not found.
 */
export async function updateGroup(pool, groupId, clientId, updates = {}) {
  try {
    // Build the SET clause and values array dynamically based on provided updates
    const setClauses = [];
    const values = [groupId, clientId]; // First parameters are group ID and client ID
    
    if (updates.name !== undefined) {
      // Check if another group with the same name already exists for this client
      if (updates.name) {
        const checkQuery = `
          SELECT id FROM groups
          WHERE name = $1 AND client_id = $2 AND id != $3
        `;
        
        const checkResult = await pool.query(checkQuery, [updates.name, clientId, groupId]);
        if (checkResult.rowCount > 0) {
          throw createDbError(`Group with name '${updates.name}' already exists for this client`, {
            code: 'DUPLICATE_GROUP_NAME',
            status: 409, // Conflict
            context: { groupId, clientId, name: updates.name }
          });
        }
      }
      
      setClauses.push(`name = $${values.length + 1}`);
      values.push(updates.name);
    }
    
    // If no updates were provided, return null
    if (setClauses.length === 0) {
      return null;
    }
    
    const query = `
      UPDATE groups
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND client_id = $2
      RETURNING id, name, created_at, client_id
    `;
    
    const result = await pool.query(query, values);
    
    // Check if the group was found
    if (result.rowCount === 0) {
      throw createDbError(`Group with ID ${groupId} not found`, {
        code: 'GROUP_NOT_FOUND',
        status: 404,
        context: { groupId }
      });
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating group:', {
      error: error.message,
      groupId,
      updates,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'updateGroup' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique violation
      throw createDbError(`Group name '${updates.name}' already in use`, {
        code: 'DUPLICATE_GROUP_NAME',
        status: 409, // Conflict
        context: { groupId, name: updates.name, operation: 'updateGroup' },
        cause: error
      });
    }
    
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Groups table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { groupId, operation: 'updateGroup' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to update group', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { groupId, updates, operation: 'updateGroup' },
      cause: error
    });
  }
}