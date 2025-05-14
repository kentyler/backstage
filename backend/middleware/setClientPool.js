/**
 * Middleware to create a database connection pool for the client schema
 * This middleware determines the schema directly from the request hostname
 * and uses a cached connection pool for that schema, attaching it to the request object
 */

import pg from 'pg';
import { determineSchemaFromHostname } from './setClientSchema.js';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Tell PG to parse int8 (BIGINT) as a Number
pg.types.setTypeParser(pg.types.builtins.INT8, val => {
  return val === null ? null : Number(val);
});

const { Pool } = pg;

// Cache of pools by schema name
const poolCache = new Map();

/**
 * Creates a new connection pool for the specified schema
 * 
 * @param {string} schema - Database schema name
 * @returns {Object} PostgreSQL connection pool
 */
export function createPool(schema) {
  console.log(`Creating connection pool for schema: ${schema}`);
  
  // Create a connection pool using environment variables
  const pool = new Pool({
    connectionString: process.env.DB_HOST,
    ssl: { rejectUnauthorized: false } // accept Neon's server cert
  });
  
  // Set up a connect hook to set the search_path for this pool
  pool.on('connect', async (client) => {
    await client.query(`SET search_path TO ${schema}, public;`);
    console.log(`Pool connected with search_path set to: ${schema}`);
  });
  
  // Log connection events
  pool.on('error', (err, client) => {
    console.error(`Unexpected error on idle client in schema ${schema}:`, err);
  });
  
  return pool;
}

/**
 * Determines the schema from the request hostname, gets or creates a connection pool,
 * and attaches it to the request object as req.clientPool
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function setClientPool(req, res, next) {
  try {
    // Determine the schema directly from the hostname
    const schema = determineSchemaFromHostname(req.hostname);
    console.log(`Determined schema for request: ${schema}`);
    
    // Check if we already have a pool for this schema
    if (!poolCache.has(schema)) {
      console.log(`Creating new connection pool for schema: ${schema}`);
      poolCache.set(schema, createPool(schema));
    } else {
      console.log(`Using existing connection pool for schema: ${schema}`);
    }
    
    // Attach the cached pool to the request object
    req.clientPool = poolCache.get(schema);
    
    // Also attach the schema name to the request for easy reference
    req.clientSchema = schema;
    
    next();
  } catch (error) {
    console.error(`Error getting connection pool:`, error);
    next(error);
  }
}
