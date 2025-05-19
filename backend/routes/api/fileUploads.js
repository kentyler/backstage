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
import { processFile, searchFileContent } from '../../services/fileProcessing.js';
import { getSchemaFromRequest } from '../../db/core/schema.js';
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
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get pool from the request (added by setClientPool middleware)
    const pool = req.clientPool;

    // Process file options
    const options = {
      schemaName: req.clientPool?.options?.schema || 'public',
      description: req.body.description || null,
      tags: req.body.tags ? JSON.parse(req.body.tags) : null,
      skipVectorization: req.body.skipVectorization === 'true'
    };

    // Process the uploaded file
    const fileUpload = await processFile(req.file, options, pool);

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
