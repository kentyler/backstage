/**
 * Middleware to set the client schema for each request
 * This middleware extracts the client schema from:
 * 1. Querystring parameter (?schema=client1)
 * 2. JWT payload (req.user.clientSchema)
 * 3. Default schema ('dev')
 */

import { getDefaultSchema } from '../config/schema.js';

/**
 * Sets the client schema on the request object
 * Priority order:
 * 1. Querystring parameter (?schema=client1)
 * 2. JWT payload (req.user.clientSchema)
 * 3. Default schema from configuration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function setClientSchema(req, res, next) {
  // First, check if schema is specified in querystring
  if (req.query && req.query.schema) {
    req.clientSchema = req.query.schema;
    console.log(`Using schema from querystring: ${req.clientSchema}`);
  }
  // Second, check if schema is specified in JWT payload
  else if (req.user && req.user.clientSchema) {
    req.clientSchema = req.user.clientSchema;
    console.log(`Using schema from JWT payload: ${req.clientSchema}`);
  }
  // Finally, use default schema
  else {
    req.clientSchema = getDefaultSchema();
    console.log(`Using default schema: ${req.clientSchema}`);
  }
  
  next();
}