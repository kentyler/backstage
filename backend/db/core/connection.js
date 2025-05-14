/**
 * Database connection module
 * Provides a PostgreSQL connection pool for the application
 * Supports schema-based multi-tenancy
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool, types } = pg;

// Configure dotenv
dotenv.config();

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

export { pool };
