/**
 * Middleware to set the client schema for each request
 * This middleware extracts the client schema from:
 * 1. Subdomain (dev.example.com, first-congregational.example.com, etc.)
 * 2. JWT payload (req.user.clientSchema)
 * 3. Default schema ('dev')
 */

import { getDefaultSchema } from '../config/schema.js';

// Map of subdomains to schema names
const SUBDOMAIN_TO_SCHEMA = {
  'dev': 'dev',
  'first-congregational': 'first_congregational',
  'conflict-club': 'conflict_club',
  'bsa': 'bsa'
};

/**
 * Extract the subdomain from the hostname
 * 
 * @param {string} hostname - The hostname from the request
 * @returns {string|null} - The subdomain or null if no subdomain
 */
function extractSubdomain(hostname) {
  // Handle localhost separately
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    return null;
  }
  
  // Split the hostname by dots
  const parts = hostname.split('.');
  
  // If we have at least 3 parts (subdomain.domain.tld), the first part is the subdomain
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // No subdomain found
  return null;
}

/**
 * Sets the client schema on the request object
 * Priority order:
 * 1. Subdomain (dev.example.com, first-congregational.example.com, etc.)
 * 2. JWT payload (req.user.clientSchema)
 * 3. Default schema from configuration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function setClientSchema(req, res, next) {
  // First, check if schema can be determined from subdomain
  const subdomain = extractSubdomain(req.hostname);
  if (subdomain && SUBDOMAIN_TO_SCHEMA[subdomain]) {
    req.clientSchema = SUBDOMAIN_TO_SCHEMA[subdomain];
    console.log(`Using schema from subdomain (${subdomain}): ${req.clientSchema}`);
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