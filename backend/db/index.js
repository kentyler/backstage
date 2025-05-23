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

// Topic avatar functions
import * as grpTopicAvatars from './grpTopicAvatars/index.js';

// Topic avatar turns functions
import * as grpTopicAvatarTurns from './grpTopicAvatarTurns/index.js';

// File upload functions
import * as fileUploads from './fileUploads/index.js';

// File upload vector functions
import * as fileUploadVectors from './fileUploadVectors/index.js';

// LLM functions
import * as llm from './llm/index.js';

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
  groups,
  grpTopicAvatars,
  grpTopicAvatarTurns,
  fileUploads,
  fileUploadVectors,
  llm
};
