/**
 * Database table information utility
 * 
 * Gets information about tables in the current schema
 */

const { pool } = require('./connection');
const { getSchemaFromRequest } = require('./schema');

/**
 * Gets information about tables in the specified schema
 * 
 * @param {Object} req - Express request object
 * @returns {Object} Table information including schema, tables, etc.
 */
const getTableInfo = async (req = null) => {
  try {
    const schema = getSchemaFromRequest(req);
    
    // Set the search_path
    await pool.query(`SET search_path TO ${schema}, public;`);
    
    // Query for tables in the specified schema
    const tables = await pool.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND table_schema = $1) AS column_count
      FROM information_schema.tables t
      WHERE table_schema = $1
      ORDER BY table_name
    `, [schema]);
    
    return {
      success: true,
      schema: schema,
      tables: tables.rows,
      count: tables.rowCount
    };
  } catch (err) {
    console.error('Error getting table info:', err);
    return {
      success: false,
      error: err.message,
      message: 'Failed to retrieve table information'
    };
  }
};

module.exports = {
  getTableInfo
};
