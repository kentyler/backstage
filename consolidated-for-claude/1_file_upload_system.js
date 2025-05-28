/**
 * CONSOLIDATED FILE: File Upload and Vectorization System
 * 
 * This file contains the key components of the file upload and vectorization system:
 * 1. File upload route handler
 * 2. File processing service
 * 3. File turn creation
 * 4. Vector creation and storage
 */

//=============================================================================
// FILE UPLOAD ROUTE HANDLER
//=============================================================================

/**
 * File upload route handler
 * Path: backend/routes/api/fileUploads/fileUpload.js
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { createFileTurn } from '../../../services/fileUploads/createFileTurn.js';
import { getNextTurnIndex } from '../../../services/messages/messageService.js';
import { insertFileUpload } from '../../../db/fileUploads/insertFileUpload.js';
import { startBackgroundProcessing } from '../../../services/fileProcessing.js';
import { logParticipantEvent } from '../../../services/eventLogging/logParticipantEvent.js';
import { MESSAGE_TYPE, TURN_KIND } from '../../../db/grpTopicAvatarTurns/createGrpTopicAvatarTurn.js';

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB file size limit
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  const { participantId, topicId } = req.query;
  
  try {
    console.log('File upload request received with params:', { participantId, topicId });
    
    if (!req.file) {
      console.error('No file uploaded');
      
      // Log file upload failure
      if (participantId) {
        await logParticipantEvent({
          participantId: parseInt(participantId),
          eventTypeId: 12, // FILE_UPLOAD_FAILURE
          description: 'File upload failed - no file provided',
          details: { error: 'No file uploaded' },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }, req.clientPool);
      }
      
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    console.log('File received:', req.file.originalname);
    
    // Insert file record into database
    const fileUpload = await insertFileUpload({
      filename: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      metadata: {
        participantId: participantId ? parseInt(participantId) : null,
        topicId: topicId ? parseInt(topicId) : null,
        originalName: req.file.originalname
      }
    }, req.clientPool);
    
    console.log('File upload record created:', fileUpload);
    
    // Start background processing
    const processingResult = await startBackgroundProcessing(fileUpload.id, req.clientPool);
    
    // Log successful file upload event
    if (participantId) {
      await logParticipantEvent({
        participantId: parseInt(participantId),
        eventTypeId: 11, // FILE_UPLOAD_SUCCESS
        description: 'File processing completed',
        details: {
          fileId: fileUpload.id,
          fileName: req.file.originalname,
          processingResult
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }, req.clientPool);
      
      console.log('File processing completion event logged');
    }
    
    // Add file to conversation as a turn if topicId is provided
    if (topicId && participantId) {
      try {
        // Get the next turn index
        const nextIndex = await getNextTurnIndex(topicId, req.clientPool);
        
        // Create a file turn
        // Parameters: topicId, avatarId, turnIndex, fileUpload, participantId, pool
        const avatarId = 1; // Default avatar ID
        await createFileTurn(
          parseInt(topicId),
          avatarId,
          nextIndex,
          fileUpload, // Pass the entire fileUpload object
          participantId,
          req.clientPool
        );
        
        console.log(`Added file to topic ${topicId} as turn ${nextIndex}`);
      } catch (turnError) {
        console.error('Error creating file turn:', turnError);
      }
    }
    
    return res.status(200).json({
      success: true,
      fileId: fileUpload.id,
      message: 'File uploaded successfully',
      file: {
        id: fileUpload.id,
        filename: fileUpload.filename,
        mimetype: fileUpload.mime_type,
        size: fileUpload.file_size
      }
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    
    // Log file upload failure
    if (participantId) {
      try {
        await logParticipantEvent({
          participantId: parseInt(participantId),
          eventTypeId: 12, // FILE_UPLOAD_FAILURE
          description: 'File upload failed',
          details: { 
            error: error.message,
            stack: error.stack,
            file: req.file ? req.file.originalname : 'unknown'
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }, req.clientPool);
      } catch (logError) {
        console.error('Error logging file upload failure:', logError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error processing file upload',
      error: error.message
    });
  }
});

export default router;

//=============================================================================
// FILE PROCESSING SERVICE
//=============================================================================

/**
 * File processing service
 * Path: backend/services/fileProcessing.js
 */

import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { updateFileUploadStatus } from '../db/fileUploads/updateFileUploadStatus.js';
import { createFileUploadVector } from '../db/fileUploadVectors/createFileUploadVector.js';
import { generateEmbedding } from './embeddingService.js';

// Track files currently being processed
const filesInProcessing = new Set();

/**
 * Start background processing of a file
 * @param {number} fileUploadId - The ID of the file upload record
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object>} The updated file upload record
 */
export async function startBackgroundProcessing(fileUploadId, pool) {
  console.log(`Starting background processing for file ${fileUploadId}`);
  
  // Update file status to "processing"
  const updatedFile = await updateFileUploadStatus(fileUploadId, 'processing', pool);
  
  // Add to processing set
  filesInProcessing.add(fileUploadId);
  console.log(`Marked file ${fileUploadId} as being processed - total files in processing: ${filesInProcessing.size}`);
  
  // Extract file info
  const { file_path: filePath, mime_type: mimeType } = updatedFile;
  
  try {
    // Start content extraction
    console.log(`Starting streaming content extraction for file ${fileUploadId}`);
    
    // Create processing stream based on file type
    if (mimeType.startsWith('text/')) {
      await processTextFile(fileUploadId, filePath, mimeType, pool);
    } else {
      console.log(`Unsupported file type: ${mimeType} for file ${fileUploadId}`);
      // Handle other file types as needed
    }
    
    // Update status to "processed"
    const completedFile = await updateFileUploadStatus(fileUploadId, 'processed', pool);
    
    // Remove from processing set
    filesInProcessing.delete(fileUploadId);
    console.log(`Marked file ${fileUploadId} as processed - total files in processing: ${filesInProcessing.size}`);
    
    return completedFile;
  } catch (error) {
    console.error(`Error processing file ${fileUploadId}:`, error);
    
    // Update status to "error"
    const errorFile = await updateFileUploadStatus(fileUploadId, 'error', pool);
    
    // Remove from processing set
    filesInProcessing.delete(fileUploadId);
    
    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Process a text file
 * @param {number} fileUploadId - The ID of the file upload record
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @param {Object} pool - Database connection pool
 * @returns {Promise<void>}
 */
async function processTextFile(fileUploadId, filePath, mimeType, pool) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  console.log(`Creating text extraction stream for ${absolutePath} with type ${mimeType}`);
  
  // Determine schema to use for vectorization
  let effectiveSchema = 'public';
  
  // Try to get schema information from the pool or connection options
  if (pool._clients && pool._clients[0] && pool._clients[0].connectionParameters) {
    const params = pool._clients[0].connectionParameters;
    if (params.search_path) {
      const parts = params.search_path.split(',');
      if (parts.length > 0) {
        effectiveSchema = parts[0].trim().replace(/"/g, '');
      }
    }
  }
  
  console.log(`Using schema '${effectiveSchema}' for file ${fileUploadId} vectorization`);
  
  // Create streaming pipeline for processing
  const stream = createVectorizerStream(fileUploadId, pool, effectiveSchema);
  
  // Set up file reading and line processing
  console.log(`Setting up processing pipeline for file ${fileUploadId}`);
  
  const fileStream = createReadStream(absolutePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let buffer = '';
  const CHUNK_SIZE = 1000; // Characters per chunk
  
  // Process line by line
  for await (const line of rl) {
    buffer += line + '\n';
    
    // When buffer reaches threshold, process a chunk
    if (buffer.length >= CHUNK_SIZE) {
      stream.write(buffer);
      buffer = '';
    }
  }
  
  // Process any remaining content
  if (buffer.length > 0) {
    stream.write(buffer);
  }
  
  // End the stream
  stream.end();
  
  // Wait for stream to finish
  await new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`Completed streaming processing for file ${fileUploadId}`);
      resolve();
    });
  });
}

/**
 * Create a transform stream that vectorizes text chunks
 * @param {number} fileUploadId - The ID of the file upload record
 * @param {Object} pool - Database connection pool
 * @param {string} effectiveSchema - The schema to use for database operations
 * @returns {Transform} A transform stream
 */
function createVectorizerStream(fileUploadId, pool, effectiveSchema) {
  let chunkIndex = 0;
  const queue = [];
  let activePromises = 0;
  const MAX_CONCURRENT = 5;
  
  // Verify file existence in database
  const verifyFileExists = async () => {
    try {
      const client = await pool.connect();
      try {
        // Use the explicitly provided schema name
        const schema = client.escapeIdentifier ? 
          client.escapeIdentifier(effectiveSchema) : 
          `"${effectiveSchema}"`;
          
        await client.query(`SET search_path TO ${schema}, public;`);
        console.log(`Set search_path to ${effectiveSchema} for file verification`);
        
        // Direct query to check file existence
        const result = await client.query(
          'SELECT id FROM file_uploads WHERE id = $1',
          [fileUploadId]
        );
        
        const exists = result.rowCount > 0;
        
        if (!exists) {
          console.error(`File ${fileUploadId} no longer exists in database (direct query), aborting vectorization`);
        } else {
          console.log(`Verified file ${fileUploadId} exists in database (direct query), proceeding with vectorization`);
        }
        
        return exists;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error verifying file ${fileUploadId} existence:`, error);
      return false;
    }
  };
  
  // Process chunks from the queue
  const processQueue = async (stream) => {
    // While we have capacity and items in the queue
    while (activePromises < MAX_CONCURRENT && queue.length > 0) {
      const chunk = queue.shift();
      activePromises++;
      
      try {
        console.log(`Vectorizing chunk ${chunk.index} for file ${fileUploadId}`);
        
        // Generate embedding
        const embedding = await generateEmbedding(chunk.text);
        
        // Store in database using the same pool that was passed to this function
        // Ensure schema context is preserved throughout the entire process
        // Extract schema from connection options if available
        let extractedSchema = 'public';
        
        // Try to get schema information from the pool or connection options
        if (pool._clients && pool._clients[0] && pool._clients[0].connectionParameters) {
          const params = pool._clients[0].connectionParameters;
          if (params.search_path) {
            const parts = params.search_path.split(',');
            if (parts.length > 0) {
              extractedSchema = parts[0].trim().replace(/"/g, '');
            }
          }
        }
        
        console.log(`Using schema '${extractedSchema}' for vectorizing chunk ${chunk.index} of file ${fileUploadId}`);
        
        await createFileUploadVector({
          fileUploadId,
          chunkIndex: chunk.index,
          contentText: chunk.text,
          contentVector: embedding,
          // Explicitly pass the schema name to ensure consistency
          schemaName: extractedSchema
        }, pool);
        
        console.log(`Completed processing chunk ${chunk.index} for file ${fileUploadId}`);
      } catch (error) {
        console.error(`Error vectorizing chunk ${chunk.index}:`, error);
      } finally {
        activePromises--;
        // Process more items if available
        if (queue.length > 0) {
          processQueue(stream);
        }
      }
    }
  };
  
  // Create and return the transform stream
  return new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      // Skip empty chunks
      if (!chunk || chunk.trim().length === 0) {
        callback();
        return;
      }
      
      // Add to processing queue
      queue.push({
        text: chunk.toString(),
        index: chunkIndex++
      });
      
      // Start processing if not already at capacity
      if (activePromises < MAX_CONCURRENT) {
        processQueue(this);
      }
      
      callback();
    },
    async flush(callback) {
      // Wait for all processing to complete
      const checkComplete = () => {
        if (activePromises === 0 && queue.length === 0) {
          callback();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      
      checkComplete();
    }
  });
}

//=============================================================================
// FILE TURN CREATION
//=============================================================================

/**
 * Create a file turn
 * Path: backend/services/fileUploads/createFileTurn.js
 */

import { createGrpTopicAvatarTurn } from '../../db/grpTopicAvatarTurns/index.js';
import { MESSAGE_TYPE, TURN_KIND } from '../../db/grpTopicAvatarTurns/createGrpTopicAvatarTurn.js';

/**
 * Creates a turn record for a file upload
 * @param {number} topicId - The topic ID
 * @param {number} avatarId - The avatar ID
 * @param {number} turnIndex - The turn index
 * @param {Object} fileUpload - The file upload record
 * @param {number|null} participantId - The participant ID
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object>} The created turn and status
 */
export async function createFileTurn(topicId, avatarId, turnIndex, fileUpload, participantId, pool) {
  // Create message content describing the file upload
  const contentText = `File uploaded: ${fileUpload.filename} (ID: ${fileUpload.id})`;
  
  console.log('About to create turn record with content:', contentText);
  
  let turnCreated = false;
  let turnId = null;
  let turnData = null;
  
  try {
    // Create a turn record
    const turn = await createGrpTopicAvatarTurn(
      topicId,
      avatarId,
      turnIndex,
      contentText,
      null, // No vector for this message
      TURN_KIND.FILE, // 6 - File upload turn kind
      MESSAGE_TYPE.USER, // 1 - User message type
      null, // No template topic
      pool,
      null, // No LLM ID for file uploads
      participantId // Pass the participant ID
    );
    
    console.log(`Created turn with participantId: ${participantId}`);
    
    if (turn && turn.id) {
      console.log(`Created turn record for file upload: ${turn.id} in topic ${topicId}`);
      turnCreated = true;
      turnId = turn.id;
      
      // Create turn info object
      turnData = {
        id: turn.id,
        topicId: topicId,
        turnIndex
      };
    }
  } catch (error) {
    console.error('CRITICAL ERROR in createGrpTopicAvatarTurn:', error);
    console.error('Error stack:', error.stack);
    // Continue even if turn creation fails
  }
  
  // Return the turn creation status and data
  return {
    turnCreated,
    turnId,
    turnData
  };
}

//=============================================================================
// FILE UPLOAD VECTOR CREATION
//=============================================================================

/**
 * Create a file upload vector
 * Path: backend/db/fileUploadVectors/createFileUploadVector.js
 */

import { createDbError, DB_ERROR_CODES } from '../utils/dbError.js';

// Max retry attempts for handling transient foreign key issues
const MAX_RETRIES = 3;

/**
 * Create a new file upload vector entry for a file chunk
 * @param {Object} vectorData - The vector data
 * @param {number} vectorData.fileUploadId - The ID of the file upload
 * @param {number} vectorData.chunkIndex - The index of the chunk
 * @param {string} vectorData.contentText - The text content of the chunk
 * @param {Array} vectorData.contentVector - The vector representation of the content
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The created vector record
 */
export async function createFileUploadVector(vectorData, pool, retryCount = 0) {
  const {
    fileUploadId,
    chunkIndex,
    contentText,
    contentVector,
    schemaName // Extract schema name if provided
  } = vectorData;
  
  // Log the parameters received to help debug schema issues
  console.log(`Creating vector for file ${fileUploadId}, chunk ${chunkIndex}, schema ${schemaName || 'not specified'}`);
  
  // Validate required fields
  if (!fileUploadId) {
    throw createDbError('File upload ID is required', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  if (chunkIndex === undefined || chunkIndex === null) {
    throw createDbError('Chunk index is required', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  if (!contentText) {
    throw createDbError('Content text is required', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  if (!contentVector || !Array.isArray(contentVector)) {
    throw createDbError('Content vector must be an array', {
      code: DB_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      context: { vectorData }
    });
  }
  
  try {
    // Convert vector to string representation if needed
    const vectorValue = typeof contentVector === 'string' 
      ? contentVector 
      : JSON.stringify(contentVector);
    
    // First verify if file exists - prevents unnecessary insertion attempts
    let client = null;
    try {
      // Get a dedicated connection
      client = await pool.connect();
      
      // Explicitly set the schema context - this is essential for multi-tenant operations
      // First, use the schema explicitly provided in the vectorData if available
      // This takes precedence over all other methods of determining the schema
      let effectiveSchema = vectorData.schemaName || 'public';
      
      // If no schema was explicitly provided, try to determine it from connection options
      if (!vectorData.schemaName) {
        // Try different ways to get the schema name
        if (client.database && client.database.includes('schema=')) {
          // Extract from connection string if available
          const schemaMatch = client.database.match(/schema=([^&]+)/i);
          if (schemaMatch && schemaMatch[1]) {
            effectiveSchema = schemaMatch[1];
          }
        } else if (pool._clients && pool._clients[0] && pool._clients[0].connectionParameters) {
          // Try to get from pool's clients connectionParameters
          const params = pool._clients[0].connectionParameters;
          if (params.search_path) {
            const parts = params.search_path.split(',');
            if (parts.length > 0) {
              effectiveSchema = parts[0].trim().replace(/\"/g, '');
            }
          }
        } else if (pool.options && pool.options.connectionString) {
          // Try extracting from connectionString
          const connStr = pool.options.connectionString;
          if (connStr.includes('search_path=')) {
            const schemaMatch = connStr.match(/search_path=([^&]+)/i);
            if (schemaMatch && schemaMatch[1]) {
              effectiveSchema = schemaMatch[1].split(',')[0].trim();
            }
          }
        }
      }
      
      console.log(`Vector operation: Using schema '${effectiveSchema}' for file ${fileUploadId}. Determined from: ${vectorData.schemaName ? 'explicit parameter' : 'connection info'}`);
      
      // Set the search path explicitly for this query
      await client.query(`SET search_path TO "${effectiveSchema}", public;`);
      
      // Now verify if the file exists
      const checkQuery = `SELECT EXISTS(SELECT 1 FROM file_uploads WHERE id = $1) as exists`;
      const checkResult = await client.query(checkQuery, [fileUploadId]);
      
      if (!checkResult.rows[0].exists) {
        throw createDbError(`File upload with ID ${fileUploadId} does not exist in schema ${effectiveSchema}`, {
          code: DB_ERROR_CODES.NOT_FOUND,
          status: 404,
          context: { fileUploadId, chunkIndex, schema: effectiveSchema }
        });
      }
      
      // Now execute the vector insertion with the same client to maintain schema context
      const queryText = `
        INSERT INTO file_upload_vectors 
        (file_upload_id, chunk_index, content_text, content_vector) 
        VALUES ($1, $2, $3, $4::vector) 
        ON CONFLICT (file_upload_id, chunk_index) DO UPDATE
        SET content_text = EXCLUDED.content_text, 
            content_vector = EXCLUDED.content_vector
        RETURNING *
      `;
      
      const values = [fileUploadId, chunkIndex, contentText, vectorValue];
      const result = await client.query(queryText, values);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        throw createDbError('Failed to insert file upload vector', {
          code: DB_ERROR_CODES.DATABASE_ERROR,
          status: 500,
          context: { fileUploadId, chunkIndex }
        });
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    // Handle foreign key violations with retry
    if (error.code === '23503' && retryCount < MAX_RETRIES) { // Foreign key violation
      console.log(`Foreign key violation when creating vector for file ${fileUploadId}, chunk ${chunkIndex}. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Add small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
      
      // Retry
      return createFileUploadVector(vectorData, pool, retryCount + 1);
    }
    
    // Wrap error with context
    if (error.isDbError) {
      throw createDbError('Failed to create file upload vector', {
        code: error.code || DB_ERROR_CODES.DATABASE_ERROR,
        status: error.status || 500,
        context: {
          fileUploadId,
          chunkIndex,
          originalError: error
        }
      });
    } else {
      throw createDbError('Failed to create file upload vector', {
        code: DB_ERROR_CODES.DATABASE_ERROR,
        status: 500,
        context: {
          fileUploadId,
          chunkIndex,
          originalError: error
        }
      });
    }
  }
}

//=============================================================================
// DB ERROR UTILITIES
//=============================================================================

/**
 * Database error utilities
 * Path: backend/db/utils/dbError.js
 */

// Error codes used throughout the application
export const DB_ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Create a standardized database error object
 * @param {string} message - Error message
 * @param {Object} options - Error options
 * @param {string} options.code - Error code
 * @param {number} options.status - HTTP status code
 * @param {Object} options.context - Additional context for the error
 * @returns {Error} Standardized error object
 */
export function createDbError(message, options = {}) {
  const error = new Error(message);
  error.code = options.code || DB_ERROR_CODES.UNKNOWN_ERROR;
  error.status = options.status || 500;
  error.context = options.context || {};
  error.isDbError = true;
  return error;
}
