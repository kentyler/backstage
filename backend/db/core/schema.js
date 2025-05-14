/**
 * Schema utility functions
 * 
 * Provides functions for schema selection based on hostname/subdomain
 */

// Default schema when we're on localhost with no subdomain
const DEFAULT_SCHEMA = 'dev';

/**
 * Gets the appropriate schema based on host/subdomain
 * For localhost, default to 'dev' schema
 * 
 * @param {Object} req - Express request object
 * @returns {string} Schema name to use
 */
const getSchemaFromRequest = (req) => {
  if (!req) return DEFAULT_SCHEMA;
  
  // Get the hostname from the request
  const hostname = req.hostname || 'localhost';
  
  // If we're on localhost, use the default schema
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return DEFAULT_SCHEMA;
  }
  
  // For actual subdomains, extract the first part of the hostname
  // e.g., for 'bsa.backstage.example.com', use 'bsa'
  const subdomain = hostname.split('.')[0];
  
  // Map known subdomains to schemas
  const schemaMap = {
    'bsa': 'bsa',
    'conflict': 'conflict_club',
    'first': 'first_congregational'
    // Add more mappings as needed
  };
  
  return schemaMap[subdomain] || DEFAULT_SCHEMA;
};

module.exports = {
  DEFAULT_SCHEMA,
  getSchemaFromRequest
};
