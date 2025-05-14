/**
 * Database module - Main entry point
 * 
 * This file exports all database functions from various modules
 * in a structured format.
 */

// Connection pool
import { pool } from './connection.js';

// Core functions
import { DEFAULT_SCHEMA, getSchemaFromRequest } from './core/schema.js';
import { query } from './core/query.js';
import { testConnection } from './core/testConnection.js';
import { getTableInfo } from './core/getTableInfo.js';

// Group functions
import * as groups from './groups/index.js';

// Export everything in a structured format
export {
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
