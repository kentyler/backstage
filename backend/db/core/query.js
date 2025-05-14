/**
 * Database query utility
 * 
 * Provides a schema-aware query function that sets the search_path 
 * based on the request's hostname/subdomain
 */

const { pool } = require('./connection');
const { getSchemaFromRequest } = require('./schema');

/**
 * Executes a query with the proper schema context based on the request
 * 
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} req - Express request object for schema determination
 * @returns {Object} Query result with rows and rowCount
 */
const query = async (text, params = [], req = null) => {
  try {
    // Get the schema for this request
    const schema = getSchemaFromRequest(req);
    
    // Set the search_path for this query
    await pool.query(`SET search_path TO ${schema}, public;`);
    console.log(`Executing query with schema: ${schema}`);
    
    // Execute the actual query
    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

module.exports = {
  query
};
