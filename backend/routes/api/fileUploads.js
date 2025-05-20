/**
 * File Uploads API Routes
 * Handles file upload, retrieval, and search operations.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  fileUploads,
  fileUploadVectors
} from '../../db/index.js';
import { createGrpTopicAvatarTurn } from '../../db/grpTopicAvatarTurns/index.js';
import { MESSAGE_TYPE, TURN_KIND } from '../../db/grpTopicAvatarTurns/createGrpTopicAvatarTurn.js';
import { processFile, searchFileContent } from '../../services/fileProcessing.js';
import { getSchemaFromRequest, DEFAULT_SCHEMA } from '../../db/core/schema.js';
import { createPool } from '../../db/connection.js';

// Initialize router
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/temp'); // Temporary storage before processing
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
});

/**
 * @route POST /api/file-uploads
 * @description Upload a new file
 * @access Public
 */
router.post('/', upload.single('file'), async (req, res) => {
  // Log all form data to debug what's being received
  console.log('==========================================');
  console.log('FILE UPLOAD REQUEST RECEIVED');
  console.log('Form data:');
  console.log(req.body);
  console.log('File:');
  console.log(req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : 'No file');
  console.log('==========================================');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get pool from the request (added by setClientPool middleware)
    const pool = req.clientPool;

    // Get the schema directly from the request - this is set by the setClientPool middleware
    const schemaName = req.clientSchema;
    
    // If schema is not available, it's a critical configuration error
    if (!schemaName) {
      throw new Error('Schema not available from request. Check middleware configuration.');
    }
    
    console.log(`Using schema '${schemaName}' for file upload`);
    
    // Process file options
    const options = {
      schemaName,
      description: req.body.description || null,
      tags: req.body.tags ? JSON.parse(req.body.tags) : null,
      skipVectorization: req.body.skipVectorization === 'true'
    };

    // Process the uploaded file
    const fileUpload = await processFile(req.file, options, pool);
    
    // Log successful upload
    console.log(`File uploaded successfully: ${fileUpload.filename} (ID: ${fileUpload.id})`);
    
    // If topicPathId is provided, create a turn record for this file upload
    const topicPathId = req.body.topicPathId;
    console.log(`Checking for topicPathId in request: ${topicPathId ? 'Found: ' + topicPathId : 'Not found'}`);
    
    if (topicPathId) {
      try {
        // Get the next turn index for this topic path and ensure it's an integer
        console.log('Raw turnIndex from request:', req.body.turnIndex, 'Type:', typeof req.body.turnIndex);
        
        // TEMPORARY FIX: Use a high number for file upload turn index to ensure it appears at the bottom
        // We'll use 1000 plus any existing value as a quick solution
        const baseIndex = req.body.turnIndex ? parseInt(req.body.turnIndex, 10) : 0;
        const turnIndex = 1000 + baseIndex;
        const avatarId = req.body.avatarId || 1;   // Default to system avatar if not provided
        
        console.log('Turn creation parameters after parsing:', { 
          topicPathId, 
          avatarId, 
          turnIndex, 
          schemaName: options.schemaName 
        });
        
        // Create message content describing the file upload
        const contentText = `File uploaded: ${fileUpload.filename} (ID: ${fileUpload.id})`;
        
        console.log('About to create turn record with content:', contentText);
        
        try {
          // Create a turn record
          const turn = await createGrpTopicAvatarTurn(
            topicPathId,
            avatarId,
            turnIndex,
            contentText,
            null, // No vector for this message
            TURN_KIND.REGULAR,
            MESSAGE_TYPE.USER, // Mark as user message
            null, // No template topic
            pool
          );
          
          console.log(`Created turn record for file upload: ${turn.id} in topic path ${topicPathId}`);
          
          // Add turn info to the response
          fileUpload.turn = {
            id: turn.id,
            topicPathId,
            turnIndex
          };
        } catch (innerError) {
          console.error('CRITICAL ERROR in createGrpTopicAvatarTurn:', innerError);
          console.error('Error stack:', innerError.stack);
          
          // Continue without the turn record - the file upload succeeded
          console.log('Continuing without turn record - file upload was successful');
        }
      } catch (turnError) {
        console.error('Error in turn creation process:', turnError);
        console.error('Error stack:', turnError.stack);
        // Continue even if turn creation fails - the file was still uploaded
      }
    }
    
    // Return the file upload record
    res.status(201).json(fileUpload);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

/**
 * @route GET /api/file-uploads/:id
 * @description Get file upload by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Get file upload record
    const fileUpload = await fileUploads.getFileUploadById(fileId, req.clientPool);
    if (!fileUpload) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(fileUpload);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file', details: error.message });
  }
});

/**
 * @route GET /api/file-uploads
 * @description List file uploads with pagination and filtering
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;
    const tags = req.query.tags ? JSON.parse(req.query.tags) : null;

    // Get file uploads
    const result = await fileUploads.getFileUploadsBySchema({
      limit,
      offset,
      search,
      tags
    }, req.clientPool);

    res.json(result);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files', details: error.message });
  }
});

/**
 * @route DELETE /api/file-uploads/:id
 * @description Delete a file upload
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Check if file is currently being processed
    const { isFileInProcessing } = await import('../../services/fileProcessing.js');
    if (isFileInProcessing(fileId)) {
      return res.status(409).json({
        error: 'File is currently being processed',
        message: 'Cannot delete a file while it is being processed. Please try again later.'
      });
    }

    // Delete file upload
    const deletedFile = await fileUploads.deleteFileUpload(fileId, req.clientPool);
    if (!deletedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Note: In a complete implementation, you would also delete the file from storage
    // and remove associated vectors
    
    res.json({ message: 'File deleted successfully', file: deletedFile });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
});

/**
 * @route POST /api/file-uploads/search
 * @description Search file contents using semantic similarity
 * @access Public
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit, threshold } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Perform search
    const results = await searchFileContent(query, {
      limit: limit || 5,
      threshold: threshold || 0.7
    }, req.clientPool);

    res.json({ results });
  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json({ error: 'Failed to search files', details: error.message });
  }
});

/**
 * @route GET /api/file-uploads/:id/content
 * @description Get the processed content of a file with its vectors
 * @access Public
 */
router.get('/:id/content', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Get file upload record
    const fileUpload = await fileUploads.getFileUploadById(fileId, req.clientPool);
    if (!fileUpload) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file content vectors
    const vectors = await fileUploadVectors.getFileUploadVectors(fileId, req.clientPool);
    
    // Return the file info with its content chunks
  res.json({
    file: fileUpload,
    chunks: vectors.map(v => ({
      chunkIndex: v.chunk_index,
      contentText: v.content_text
    }))
  });
} catch (error) {
  console.error('Error getting file content:', error);
  res.status(500).json({ error: 'Failed to get file content', details: error.message });
}
});

export default router;
