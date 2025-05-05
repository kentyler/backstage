/**
 * Middleware to set the client schema for each request
 * This middleware extracts the client schema from:
 * 1. Subdomain (dev.example.com, first-congregational.example.com, etc.)
 * 2. JWT payload (req.user.clientSchema)
 * 3. Default schema ('dev')
 */

import { getDefaultSchema } from '../config/schema.js';

// Map of subdomains to schema names
export const SUBDOMAIN_TO_SCHEMA = {
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
export function extractSubdomain(hostname) {
  console.log(`Extracting subdomain from hostname: ${hostname}`);
  
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0];
  console.log(`Hostname without port: ${hostWithoutPort}`);
  
  // Split the hostname by dots
  const parts = hostWithoutPort.split('.');
  console.log(`Hostname parts: ${JSON.stringify(parts)}`);
  
  // Handle localhost specially
  if (parts.includes('localhost')) {
    // If the format is subdomain.localhost
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      console.log(`Extracted subdomain from localhost: ${parts[0]}`);
      return parts[0];
    }
    
    // If it's just localhost or localhost:port
    console.log('No subdomain found for localhost');
    return null;
  }
  
  // For regular domains, if we have at least 3 parts (subdomain.domain.tld), 
  // the first part is the subdomain
  if (parts.length >= 3) {
    console.log(`Extracted subdomain from domain: ${parts[0]}`);
    return parts[0];
  }
  
  // No subdomain found
  console.log('No subdomain found');
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
  console.log(`Request hostname: ${req.hostname}`);
  
  // Special case for conflict-club.localhost
  if (req.hostname.includes('conflict-club')) {
    req.clientSchema = 'conflict_club';
    console.log(`Special case: Using schema for conflict-club: ${req.clientSchema}`);
  }
  // First, check if schema can be determined from subdomain
  else {
    const subdomain = extractSubdomain(req.hostname);
    console.log(`Extracted subdomain: ${subdomain}`);
    
    if (subdomain && SUBDOMAIN_TO_SCHEMA[subdomain]) {
      req.clientSchema = SUBDOMAIN_TO_SCHEMA[subdomain];
      console.log(`Using schema from subdomain (${subdomain}): ${req.clientSchema}`);
    }
    // Second, check if schema is specified in JWT payload
    else if (req.user && req.user.clientSchema) {
      req.clientSchema = req.user.clientSchema;
      console.log(`Using schema from JWT payload: ${req.clientSchema}`);
    }
    // Special case for localhost in development
    // The 'dev' schema contains all client tables including participants
    // This ensures we can access these tables when developing locally
    else if (req.hostname.includes('localhost') && process.env.NODE_ENV !== 'production') {
      req.clientSchema = 'dev';
      console.log(`Development environment on localhost: Using dev schema for client tables`);
    }
    // Finally, use default schema
    else {
      req.clientSchema = getDefaultSchema();
      console.log(`Using default schema: ${req.clientSchema}`);
    }
  }
  
  next();
}