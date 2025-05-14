/**
 * Utility functions for determining client schema
 * This file provides functions for determining the schema to use
 * based on hostname, participant attributes, etc.
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
 * Determines the client schema based on the hostname
 * 
 * @param {string} hostname - The hostname from the request
 * @returns {string} - The schema name
 */
export function determineSchemaFromHostname(hostname) {
  console.log(`Determining schema from hostname: ${hostname}`);
  
  // When in localhost, use 'dev' schema by default
  if (hostname.includes('localhost')) {
    // Extract subdomain from localhost (e.g., subdomain.localhost)
    const subdomain = extractSubdomain(hostname);
    
    // If we have a valid subdomain and it's in our mapping, use that schema
    if (subdomain && SUBDOMAIN_TO_SCHEMA[subdomain]) {
      console.log(`Using schema from localhost subdomain (${subdomain}): ${SUBDOMAIN_TO_SCHEMA[subdomain]}`);
      return SUBDOMAIN_TO_SCHEMA[subdomain];
    }
    
    // Otherwise use 'dev' schema for localhost
    console.log(`Development environment on localhost: Using dev schema for client tables`);
    return 'dev';
  }
  // For non-localhost hostnames
  else {
    const subdomain = extractSubdomain(hostname);
    console.log(`Extracted subdomain: ${subdomain}`);
    
    if (subdomain && SUBDOMAIN_TO_SCHEMA[subdomain]) {
      console.log(`Using schema from subdomain (${subdomain}): ${SUBDOMAIN_TO_SCHEMA[subdomain]}`);
      return SUBDOMAIN_TO_SCHEMA[subdomain];
    }
    // If no subdomain or unknown subdomain, use 'dev' as a fallback
    else {
      console.log(`No subdomain or unknown subdomain: Using dev schema as fallback`);
      return 'dev';
    }
  }
}

/**
 * Determines the client schema for a participant
 * Uses the SUBDOMAIN_TO_SCHEMA mapping to determine the schema
 * based on the participant's organization or other attributes
 * 
 * @param {Object} participant - The participant object
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.isLocalhost] - Whether the request is from localhost
 * @returns {string} - The schema name for the participant
 */
export function determineClientSchema(participant, options = {}) {
  // For localhost in development, use the dev schema
  // This ensures that JWT tokens created during local development
  // will use the dev schema, which contains the participants table
  if (options.isLocalhost && process.env.NODE_ENV !== 'production') {
    console.log('Development environment on localhost: Using dev schema for JWT token');
    return 'dev';
  }
  
  // If the participant has a clientSchema property, use that
  if (participant.clientSchema) {
    return participant.clientSchema;
  }
  
  // If the participant has an organization property, use that to determine the schema
  if (participant.organization) {
    // Check if the organization matches a known subdomain
    const subdomain = participant.organization.toLowerCase().replace(/\s+/g, '-');
    if (SUBDOMAIN_TO_SCHEMA[subdomain]) {
      return SUBDOMAIN_TO_SCHEMA[subdomain];
    }
  }
  
  // For development environment, use the dev schema
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development environment: Using dev schema as fallback');
    return 'dev';
  }
  
  // Return the default schema as a last resort for production
  return getDefaultSchema();
}

/**
 * Gets a list of all client schemas
 * This is used for operations that need to be performed across all schemas
 * 
 * @returns {Promise<string[]>} - A promise that resolves to an array of schema names
 */
export async function getAllClientSchemas() {
  // Return all known schemas from the SUBDOMAIN_TO_SCHEMA mapping
  const schemas = Object.values(SUBDOMAIN_TO_SCHEMA);
  
  // Add the default schema if it's not already included
  const defaultSchema = getDefaultSchema();
  if (!schemas.includes(defaultSchema)) {
    schemas.push(defaultSchema);
  }
  
  return schemas;
}
