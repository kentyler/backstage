const { Pool, types } = require('pg');
require('dotenv').config();

// Tell PG to parse int8 (BIGINT) as a Number
types.setTypeParser(types.builtins.INT8, val => {
  return val === null ? null : Number(val);
});

// Create a connection pool using environment variables
// Using Neon database credentials from .env file
const pool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false } // accept Neon's server cert
});

// Log the database connection for debugging
console.log('Connecting to database:', process.env.DB_HOST ? 'Using DB_HOST from .env' : 'DB_HOST not found');

// For this test app, we're not going to set a specific schema
// We'll access the participants table which is in the public schema
// This mimics the authentication flow in the main app where login happens
// before schema selection

// Test function to verify database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    
    // First check basic connectivity
    const timeResult = await client.query('SELECT NOW() as current_time');
    
    // Then check if we can access the participants table
    const participantsResult = await client.query('SELECT COUNT(*) as count FROM participants');
    
    client.release();
    return {
      success: true,
      timestamp: timeResult.rows[0].current_time,
      participantCount: participantsResult.rows[0].count,
      message: 'Database connection successful, participants table accessible'
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

// Simple query wrapper
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

// Function to get table names in the database
const getTableInfo = async () => {
  try {
    const tables = await pool.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    return {
      success: true,
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
  pool,
  query,
  testConnection,
  getTableInfo
};
