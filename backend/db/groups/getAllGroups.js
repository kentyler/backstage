/**
 * Get all groups from the database
 * 
 * This function retrieves all groups from the database
 * with proper schema selection based on the request
 */

const { query } = require('../core/query');

/**
 * Gets all groups from the database
 * 
 * @param {Object} req - Express request object
 * @returns {Array} Array of group objects
 */
const getAllGroups = async (req) => {
  try {
    // Get groups from the database with schema-aware query
    const result = await query('SELECT id, name FROM groups ORDER BY name', [], req);
    return result.rows;
  } catch (error) {
    console.error('Error in getAllGroups:', error);
    throw error;
  }
};

module.exports = getAllGroups;
