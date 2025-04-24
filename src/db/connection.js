/**
 * Database connection module
 * Provides a PostgreSQL connection pool for the application
 */

import dotenv from 'dotenv';
import pkg from 'pg';

const { types, Pool } = pkg;

// Load environment variables
dotenv.config();

// Tell PG to parse int8 (BIGINT) as a Number
types.setTypeParser(types.builtins.INT8, val => {
  // you might want to guard against very large values here
  return val === null ? null : Number(val);
});

// If you have any NUMERIC columns you’d like as floats:
// types.setTypeParser(types.builtins.NUMERIC, val => parseFloat(val));



// Create the database connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false }, // accept Neon’s server cert
});

// Set up error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Log connection parameters for debugging (without showing credentials)
console.log('Database connection configured:');
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

// Export the pool
export { pool };