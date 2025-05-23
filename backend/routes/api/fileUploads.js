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
import { getNextTurnIndex } from '../../services/fileUploads/getNextTurnIndex.js';

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
    
    // If topicId is provided, create a turn record for this file upload
    if (!req.body.topicId) {
      console.log('No topicId provided in request, skipping turn creation');
      return res.status(201).json(fileUpload);
    }
    
    const topicId = req.body.topicId;
    console.log(`Creating turn record for topic ID: ${topicId}`);
    
    // Ensure topicId is a number
    const topicIdNum = parseInt(topicId, 10);
    if (isNaN(topicIdNum)) {
      throw new Error(`Invalid topic ID: ${topicId}`);
    }
    console.log(`Parsed topicId as number: ${topicIdNum}`);
    
    try {
      // Get the next turn index for this topic path and ensure it's an integer
      console.log('Raw turnIndex from request:', req.body.turnIndex, 'Type:', typeof req.body.turnIndex);
      
      // Get the next sequential turn index for this topic using our utility function
      const turnIndex = await getNextTurnIndex(topicIdNum, pool);
      const avatarId = req.body.avatarId || 1;   // Default to system avatar if not provided
      
      // Get participant ID from request or session
      let participantId = req.body.participantId || null;
      
      // If participantId is provided in the request, use it
      if (participantId) {
        console.log(`Using participant ID from request: ${participantId}`);
      } 
      // Otherwise, try to get it from the session
      else if (req.session && req.session.userId) {
        participantId = req.session.userId;
        console.log(`Using participant ID from session: ${participantId}`);
      } else {
        console.warn('No participant ID available for turn creation');
      }
      
      console.log('Turn creation parameters after parsing:', { 
        topicId: topicIdNum,
        avatarId, 
        turnIndex, 
        schemaName: options.schemaName 
      });
      
      // Create message content describing the file upload
      const contentText = `File uploaded: ${fileUpload.filename} (ID: ${fileUpload.id})`;
      
      console.log('About to create turn record with content:', contentText);
      
      let turnCreated = false;
      let turnId = null;
      
      try {
        // Create a turn record with turn_kind = 6 for file uploads
        const turn = await createGrpTopicAvatarTurn(
          topicIdNum,
          avatarId,
          turnIndex,
          contentText,
          null, // No vector for this message
          6, // TURN_KIND.FILE_UPLOAD
          MESSAGE_TYPE.USER, // Mark as user message
          null, // No template topic
          pool,
          null, // No LLM ID for file uploads
          participantId // Pass the participant ID
        );
        
        console.log(`Created turn with participantId: ${participantId}`);
        
        if (turn && turn.id) {
          console.log(`Created turn record for file upload: ${turn.id} in topic ${topicIdNum}`);
          turnCreated = true;
          turnId = turn.id;
          
          // Add turn info to the response
          fileUpload.turn = {
            id: turn.id,
            topicId: topicIdNum,
            turnIndex
          };
        }
      } catch (innerError) {
        console.error('CRITICAL ERROR in createGrpTopicAvatarTurn:', innerError);
        console.error('Error stack:', innerError.stack);
        // Continue with the file upload even if turn creation fails
      }
      
      // Add turn creation status to the response
      fileUpload.turnCreated = turnCreated;
      if (turnId) {
        fileUpload.turnId = turnId;
      }
    
      // Return the file upload record
      res.status(201).json(fileUpload);
    } catch (error) {
      console.error('Error in file upload processing:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to process file upload', details: error.message });
    }
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

    // Get file details before deletion
    const fileDetails = await fileUploads.getFileUploadById(fileId, req.clientPool);
    if (!fileDetails) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete associated vectors first
    try {
      await req.clientPool.query(
        'DELETE FROM file_upload_vectors WHERE file_upload_id = $1',
        [fileId]
      );
      console.log(`Deleted vectors for file ${fileId}`);
    } catch (vectorError) {
      console.error(`Error deleting vectors for file ${fileId}:`, vectorError);
      // Continue with file deletion even if vector deletion fails
    }

    // Delete the file from storage if storage_path exists
    if (fileDetails.storage_path) {
      try {
        const { deleteFromStorage } = await import('../services/fileProcessing.js');
        await deleteFromStorage(fileDetails.storage_path, 'uploads');
        console.log(`Deleted file from storage: ${fileDetails.storage_path}`);
      } catch (storageError) {
        console.error(`Error deleting file from storage for file ${fileId}:`, storageError);
        // Continue with database cleanup even if storage deletion fails
      }
    }

    // Finally, delete the file upload record
    const deletedFile = await fileUploads.deleteFileUpload(fileId, req.clientPool);
    
    res.json({ 
      success: true,
      message: 'File and associated data deleted successfully',
      file: deletedFile 
    });
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
