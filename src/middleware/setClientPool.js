/**
 * Middleware to create a database connection pool for the client schema
 * This middleware creates a connection pool using the schema from req.clientSchema
 * and attaches it to the request object as req.clientPool
 */

import { createPool } from '../db/connection.js';

/**
 * Creates a connection pool for the client schema and attaches it to the request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function setClientPool(req, res, next) {
  // Log the schema being used for debugging
  console.log(`Creating connection pool for schema: ${req.clientSchema}`);
  
  try {
    // Create a connection pool using the schema from req.clientSchema
    const clientPool = createPool(req.clientSchema);
    
    // Attach the pool to the request object
    req.clientPool = clientPool;
    
    next();
  } catch (error) {
    console.error(`Error creating connection pool for schema ${req.clientSchema}:`, error);
    next(error);
  }
}