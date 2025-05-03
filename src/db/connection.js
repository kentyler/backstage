/**
 * Database connection module
 * Provides a PostgreSQL connection pool for the application
 * Supports schema-based multi-tenancy
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

// If you have any NUMERIC columns you'd like as floats:
// types.setTypeParser(types.builtins.NUMERIC, val => parseFloat(val));

/**
 * Creates a database connection pool with a specific schema search path
 * 
 * @param {string} schema - The schema to use (defaults to 'public')
 * @returns {Pool} - A PostgreSQL connection pool configured for the specified schema
 */
export function createPool(schema = 'public') {
  const pool = new Pool({
    connectionString: process.env.DB_HOST,
    ssl: { rejectUnauthorized: false }, // accept Neon's server cert
  });

  // Set the search_path for all connections from this pool
  pool.on('connect', (client) => {
    client.query(`SET search_path TO ${schema}, public;`);
  });

  // Set up error handling for the pool
  pool.on('error', (err) => {
    console.error(`Unexpected error on idle client (schema: ${schema})`, err);
    process.exit(-1);
  });

  return pool;
}

// Create the default pool using the dev schema
const defaultPool = createPool('dev');

// Log connection parameters for debugging (without showing credentials)
console.log('Database connection configured:');
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

// Export the default pool
export { defaultPool as pool };