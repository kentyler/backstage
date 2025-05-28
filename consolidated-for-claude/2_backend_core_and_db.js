/**
 * CONSOLIDATED FILE: Backend Core and Database Structure
 * 
 * This file contains the key components of the backend architecture:
 * 1. Server setup and middleware
 * 2. Database connection management
 * 3. Multi-tenant schema handling
 * 4. Core database operations
 */

//=============================================================================
// SERVER SETUP
//=============================================================================

/**
 * Express server setup
 * Path: backend/server.js
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPool } from './db/pool.js';
import apiRoutes from './routes/api/index.js';
import { setupSchemaMiddleware } from './middleware/schemaMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import config from './config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create database pool
const pool = createPool();

// Standard middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware - adds clientPool to req object
app.use((req, res, next) => {
  req.clientPool = pool;
  next();
});

// Schema middleware - determines and sets the tenant schema
app.use(setupSchemaMiddleware);

// API routes
app.use('/api', apiRoutes);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

//=============================================================================
// DATABASE POOL AND CONNECTION MANAGEMENT
//=============================================================================

/**
 * Database pool creation
 * Path: backend/db/pool.js
 */

import pg from 'pg';
import config from '../config/config.js';

/**
 * Create a PostgreSQL connection pool
 * @returns {Object} PostgreSQL connection pool
 */
export function createPool() {
  const { Pool } = pg;
  
  // Create pool with configuration from environment
  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection
  });
  
  // Pool error handling
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
  });
  
  console.log('Created PostgreSQL connection pool');
  
  return pool;
}

/**
 * Execute a query with automatic schema setting
 * @param {Object} pool - Database connection pool
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {string} schema - Schema to use
 * @returns {Promise<Object>} Query result
 */
export async function executeQuery(pool, text, params, schema = 'public') {
  const client = await pool.connect();
  try {
    // Set schema context
    await client.query(`SET search_path TO "${schema}", public;`);
    
    // Execute the query
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

//=============================================================================
// SCHEMA MIDDLEWARE AND MULTI-TENANT HANDLING
//=============================================================================

/**
 * Schema middleware
 * Path: backend/middleware/schemaMiddleware.js
 */

import { getSchemaByDomain } from '../db/schemas/getSchemaByDomain.js';

/**
 * Middleware to determine and set the schema based on request headers or params
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function setupSchemaMiddleware(req, res, next) {
  try {
    // Check for schema override in request headers
    let schemaName = req.headers['x-schema-name'];
    
    // If no schema in headers, check for domain-based mapping
    if (!schemaName && req.headers.host) {
      const domain = req.headers.host.split(':')[0]; // Remove port if present
      const schema = await getSchemaByDomain(domain, req.clientPool);
      
      if (schema) {
        schemaName = schema.name;
      }
    }
    
    // If still no schema, use default from query params or 'public'
    if (!schemaName) {
      schemaName = req.query.schema || 'public';
    }
    
    // Set schema name on request
    req.schemaName = schemaName;
    console.log(`Using schema: ${schemaName}`);
    
    next();
  } catch (error) {
    console.error('Error in schema middleware:', error);
    next(error);
  }
}

/**
 * Get schema by domain
 * Path: backend/db/schemas/getSchemaByDomain.js
 */

/**
 * Get schema information by domain
 * @param {string} domain - Domain name
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object|null>} Schema information or null if not found
 */
export async function getSchemaByDomain(domain, pool) {
  const client = await pool.connect();
  try {
    // Query schema information from domain_schemas table
    const query = `
      SELECT s.id, s.name, s.display_name, s.description, s.metadata, s.created_at
      FROM public.schemas s
      JOIN public.domain_schemas ds ON s.id = ds.schema_id
      WHERE ds.domain = $1
    `;
    
    const result = await client.query(query, [domain]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

//=============================================================================
// CORE DATABASE OPERATIONS - AVATAR TURNS
//=============================================================================

/**
 * Create group topic avatar turn
 * Path: backend/db/grpTopicAvatarTurns/createGrpTopicAvatarTurn.js
 */

// Message and turn types
export const MESSAGE_TYPE = {
  SYSTEM: 0,
  USER: 1,
  ASSISTANT: 2,
  FILE: 3
};

export const TURN_KIND = {
  TEXT: 0,
  IMAGE: 1,
  AUDIO: 2,
  VIDEO: 3,
  DOCUMENT: 4,
  CHAT: 5,
  FILE: 6
};

/**
 * Create a group topic avatar turn record
 * @param {number} topicId - Topic ID
 * @param {number} avatarId - Avatar ID
 * @param {number} turnIndex - Turn index in the conversation
 * @param {string} contentText - Text content of the message
 * @param {Array|null} contentVector - Vector representation of the content
 * @param {number} turnKind - Kind of turn (text, image, etc)
 * @param {number} messageType - Type of message (system, user, assistant)
 * @param {number|null} templateTopicId - Template topic ID (if any)
 * @param {Object} pool - Database connection pool
 * @param {number|null} llmId - LLM ID used for generation
 * @param {number|null} participantId - Participant ID (for user messages)
 * @returns {Promise<Object>} Created turn record
 */
export async function createGrpTopicAvatarTurn(
  topicId, 
  avatarId, 
  turnIndex, 
  contentText, 
  contentVector,
  turnKind = TURN_KIND.TEXT,
  messageType = MESSAGE_TYPE.ASSISTANT,
  templateTopicId = null,
  pool,
  llmId = null,
  participantId = null
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get the schema name from the pool if possible
    let schemaName = 'public';
    if (client.connectionParameters && client.connectionParameters.search_path) {
      const parts = client.connectionParameters.search_path.split(',');
      if (parts.length > 0) {
        schemaName = parts[0].trim().replace(/"/g, '');
      }
    }
    
    // Set the schema explicitly
    await client.query(`SET search_path TO "${schemaName}", public;`);
    
    // Prepare the vector if provided
    let vectorValue = null;
    if (contentVector) {
      vectorValue = Array.isArray(contentVector) 
        ? JSON.stringify(contentVector) 
        : contentVector;
    }
    
    // Insert the turn
    const query = `
      INSERT INTO grp_topic_avatar_turns
      (topic_id, avatar_id, turn_index, content_text, content_vector, turn_kind, message_type, 
       template_topic_id, llm_id, participant_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      topicId,
      avatarId,
      turnIndex,
      contentText,
      vectorValue,
      turnKind,
      messageType,
      templateTopicId,
      llmId,
      participantId
    ];
    
    const result = await client.query(query, values);
    await client.query('COMMIT');
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating turn:', error);
    throw error;
  } finally {
    client.release();
  }
}

//=============================================================================
// EVENT LOGGING
//=============================================================================

/**
 * Log participant event
 * Path: backend/services/eventLogging/logParticipantEvent.js
 */

/**
 * Log a participant event
 * @param {Object} eventData - Event data
 * @param {number} eventData.participantId - Participant ID
 * @param {number} eventData.eventTypeId - Event type ID
 * @param {string} eventData.description - Event description
 * @param {Object} eventData.details - Additional event details
 * @param {string} eventData.ipAddress - IP address
 * @param {string} eventData.userAgent - User agent
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object>} Created event log entry
 */
export async function logParticipantEvent(eventData, pool) {
  const {
    schemaName,
    participantId,
    eventTypeId,
    description,
    details,
    ipAddress,
    userAgent
  } = eventData;
  
  const client = await pool.connect();
  
  try {
    console.log('==== EVENT LOGGING: Starting event log insert ====');
    console.log('Event log details:', {
      schemaName,
      participantId,
      eventType: eventTypeId,
      description
    });
    
    // Check if participant_event_logs table exists in the current schema
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'participant_event_logs'
      ) as exists
    `;
    
    const tableCheckResult = await client.query(tableCheckQuery);
    console.log('Table check result:', tableCheckResult.rows[0]);
    
    if (!tableCheckResult.rows[0].exists) {
      throw new Error('Participant event logs table does not exist');
    }
    
    // Use public schema as fallback
    console.log('Setting schema path to: public');
    await client.query('SET search_path TO public');
    
    // Check if schemas table exists
    const schemasTableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schemas'
      ) as exists
    `;
    
    const schemasTableCheckResult = await client.query(schemasTableCheckQuery);
    console.log('Schemas table check:', schemasTableCheckResult.rows[0]);
    
    // Get schema ID
    let schemaId = 1; // Default to public schema (ID 1)
    
    if (schemasTableCheckResult.rows[0].exists) {
      const schemaQuery = `SELECT id FROM schemas WHERE name = $1`;
      const schemaParam = schemaName || 'public';
      
      console.log(`Querying for schema ID with name: ${schemaParam}`);
      const schemaResult = await client.query(schemaQuery, [schemaParam]);
      console.log('Schema query result:', schemaResult.rows);
      
      if (schemaResult.rows.length > 0) {
        schemaId = schemaResult.rows[0].id;
        console.log(`Found schema ID: ${schemaId}`);
      }
    }
    
    // Insert event log
    const insertQuery = `
      INSERT INTO participant_event_logs
      (schema_id, participant_id, event_type_id, description, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      schemaId,
      participantId,
      eventTypeId,
      description,
      details || {},
      ipAddress,
      userAgent
    ];
    
    console.log('Executing event log query with values:', values);
    const result = await client.query(insertQuery, values);
    
    console.log('Event log insert success, returned:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging participant event:', error);
    // Continue execution even if logging fails
    return null;
  } finally {
    client.release();
  }
}

//=============================================================================
// FILE UPLOADS DATABASE OPERATIONS
//=============================================================================

/**
 * Insert file upload
 * Path: backend/db/fileUploads/insertFileUpload.js
 */

/**
 * Insert a file upload record
 * @param {Object} fileData - File data
 * @param {string} fileData.filename - Original filename
 * @param {string} fileData.filepath - Path to the file on disk
 * @param {string} fileData.mimetype - MIME type
 * @param {number} fileData.size - File size in bytes
 * @param {Object} fileData.metadata - Additional metadata
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object>} Created file upload record
 */
export async function insertFileUpload(fileData, pool) {
  const {
    filename,
    filepath,
    mimetype,
    size,
    metadata = {}
  } = fileData;
  
  const client = await pool.connect();
  
  try {
    // Set schema based on pool connection
    let schemaName = 'public';
    if (client.connectionParameters && client.connectionParameters.search_path) {
      const parts = client.connectionParameters.search_path.split(',');
      if (parts.length > 0) {
        schemaName = parts[0].trim().replace(/"/g, '');
      }
    }
    
    await client.query(`SET search_path TO "${schemaName}", public;`);
    
    // Insert file record
    const query = `
      INSERT INTO file_uploads
      (filename, file_path, mime_type, file_size, description, tags, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      filename,
      filepath,
      mimetype,
      size,
      metadata.description || null,
      metadata.tags || null,
      'pending' // Initial status
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Update file upload status
 * Path: backend/db/fileUploads/updateFileUploadStatus.js
 */

/**
 * Update file upload status
 * @param {number} fileId - File ID
 * @param {string} status - New status
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object>} Updated file upload record
 */
export async function updateFileUploadStatus(fileId, status, pool) {
  const client = await pool.connect();
  
  try {
    // Set schema context
    let schemaName = 'public';
    if (client.connectionParameters && client.connectionParameters.search_path) {
      const parts = client.connectionParameters.search_path.split(',');
      if (parts.length > 0) {
        schemaName = parts[0].trim().replace(/"/g, '');
      }
    }
    
    await client.query(`SET search_path TO "${schemaName}", public;`);
    
    // Update status
    const query = `
      UPDATE file_uploads
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [status, fileId]);
    
    if (result.rows.length === 0) {
      throw new Error(`File with ID ${fileId} not found`);
    }
    
    return result.rows[0];
  } finally {
    client.release();
  }
}
