/**
 * Get a group by ID from the database
 * 
 * This function retrieves a specific group by its ID
 * with proper schema selection based on the request
 */

const { query } = require('../core/query');

/**
 * Gets a group by its ID
 * 
 * @param {number} id - The ID of the group to retrieve
 * @param {Object} req - Express request object
 * @returns {Object|null} Group object or null if not found
 */
const getGroupById = async (id, req) => {
  try {
    // Get group from the database with schema-aware query
    const result = await query('SELECT id, name FROM groups WHERE id = $1', [id], req);
    
    // Return the first row or null if no group found
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(`Error in getGroupById for ID ${id}:`, error);
    throw error;
  }
};

module.exports = getGroupById;
