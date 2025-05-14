/**
 * Database module - Main entry point
 * 
 * This file exports all database functions from various modules
 * in a structured format.
 */

// Connection pool
const { pool } = require('./core/connection');

// Core functions
const { DEFAULT_SCHEMA, getSchemaFromRequest } = require('./core/schema');
const { query } = require('./core/query');
const { testConnection } = require('./core/testConnection');
const { getTableInfo } = require('./core/getTableInfo');

// Group functions
const groups = require('./groups');

// Export everything in a structured format
module.exports = {
  // Connection
  pool,
  
  // Core utilities
  query,
  testConnection,
  getTableInfo,
  getSchemaFromRequest,
  
  // Constants
  DEFAULT_SCHEMA,
  
  // Domain-specific functions grouped by entity
  groups
};
