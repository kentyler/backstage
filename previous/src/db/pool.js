/**
 * @file src/db/pool.js
 * @description PostgreSQL connection pool setup
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new Pool instance
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Log when the pool connects to the database
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Log any errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { pool };
