/**
 * Database connection test function
 * 
 * Tests connection to the database with proper schema selection
 */

const { pool } = require('./connection');
const { getSchemaFromRequest } = require('./schema');

/**
 * Tests the database connection with schema-aware queries
 * 
 * @param {Object} req - Express request object
 * @returns {Object} Test results including schema, connection status, etc.
 */
const testConnection = async (req = null) => {
  try {
    const client = await pool.connect();
    
    // Get the schema for this request
    const schema = getSchemaFromRequest(req);
    
    // Set the search_path for this connection
    await client.query(`SET search_path TO ${schema}, public;`);
    console.log(`Test connection using schema: ${schema}`);
    
    // First check basic connectivity
    const timeResult = await client.query('SELECT NOW() as current_time');
    
    // Then check if we can access the public participants table
    const participantsResult = await client.query('SELECT COUNT(*) as count FROM public.participants');
    
    // Try to access the groups table from the specific schema
    let groupsResult;
    try {
      groupsResult = await client.query('SELECT COUNT(*) as count FROM groups');
    } catch (err) {
      console.warn(`Could not access groups table in schema ${schema}: ${err.message}`);
      groupsResult = { rows: [{ count: 0 }] };
    }
    
    client.release();
    return {
      success: true,
      schema: schema,
      timestamp: timeResult.rows[0].current_time,
      participantCount: participantsResult.rows[0].count,
      groupCount: groupsResult.rows[0].count,
      message: `Database connection successful, using schema: ${schema}`
    };
  } catch (err) {
    console.error('Database connection error:', err);
    return {
      success: false,
      error: err.message,
      message: 'Database connection failed'
    };
  }
};

module.exports = {
  testConnection
};
