/**
 * @file src/config/schema.js
 * @description Configuration for database schema selection
 * 
 * This file provides functions for getting and setting the default schema
 * to use for database operations. The schema can be configured via
 * environment variables or set programmatically.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default schema to use if not specified
let currentSchema = process.env.DB_SCHEMA || 'public';

/**
 * Get the current default schema
 * 
 * @returns {string} The current default schema
 */
export function getDefaultSchema() {
  return currentSchema;
}

/**
 * Set the default schema
 * 
 * @param {string} schema - The schema to use as default
 */
export function setDefaultSchema(schema) {
  if (!schema) {
    throw new Error('Schema cannot be empty');
  }
  
  currentSchema = schema;
  console.log(`Default schema set to: ${schema}`);
}

/**
 * Get a connection pool for the specified schema
 * 
 * @param {string} [schema=null] - The schema to use (optional, defaults to current default schema)
 * @returns {Object} A connection pool for the specified schema
 */
export function getSchemaPool(schema = null) {
  const { createPool } = require('../db/connection.js');
  return createPool(schema || currentSchema);
}

export default {
  getDefaultSchema,
  setDefaultSchema,
  getSchemaPool
};