/**
 * Utility functions for determining client schema
 */
import { SUBDOMAIN_TO_SCHEMA } from '../middleware/setClientSchema.js';
import { getDefaultSchema } from '../config/schema.js';

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
  
  // For conflict-club specifically, use the conflict_club schema
  if (participant.organization === 'Conflict Club' || 
      participant.email?.includes('@conflict-club') ||
      participant.email?.includes('@conflictclub')) {
    return 'conflict_club';
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