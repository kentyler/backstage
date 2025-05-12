/**
 * Middleware to create a database connection pool for the client schema
 * This middleware determines the schema directly from the request hostname
 * and uses a cached connection pool for that schema, attaching it to the request object
 */

import { createPool } from '../db/connection.js';
import { determineSchemaFromHostname } from './setClientSchema.js';

// Cache of pools by schema name
const poolCache = new Map();

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
    
    // Check if we already have a pool for this schema
    if (!poolCache.has(schema)) {
      console.log(`Creating new connection pool for schema: ${schema}`);
      poolCache.set(schema, createPool(schema));
    } else {
      console.log(`Using existing connection pool for schema: ${schema}`);
    }
    
    // Attach the cached pool to the request object
    req.clientPool = poolCache.get(schema);
    
    next();
  } catch (error) {
    console.error(`Error getting connection pool:`, error);
    next(error);
  }
}