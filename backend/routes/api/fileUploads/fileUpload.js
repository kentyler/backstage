/**
 * File Upload API Route
 * @module routes/api/fileUploads/fileUpload
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileUploads } from '../../../db/index.js';
import { MESSAGE_TYPE, TURN_KIND } from '../../../db/grpTopicAvatarTurns/createGrpTopicAvatarTurn.js';
import { processFile } from '../../../services/fileProcessing.js';
import { getNextTurnIndex } from '../../../services/common/getNextTurnIndex.js';
import { getParticipantId } from '../../../services/fileUploads/getParticipantId.js';
import { createFileTurn } from '../../../services/fileUploads/createFileTurn.js';
import { logEvent, EVENT_CATEGORY, EVENT_TYPE } from '../../../services/eventLogger.js';
import { ApiError } from '../../../middleware/errorHandler.js';

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
 * @route   POST /api/file-uploads
 * @desc    Upload a new file
 * @access  Private (requires authentication via middleware in index.js)
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  // Log all form data to debug what's being received
  console.log('==========================================');
  console.log('FILE UPLOAD REQUEST RECEIVED');
  console.log('Form data:', req.body);
  console.log('File:', req.file);
  console.log('==========================================');
  
  try {
    if (!req.file) {
      return next(new ApiError('No file uploaded', 400));
    }

    // Get metadata from request
    const {
      tags,
      topicId,
      metadata,
      keepOriginal,
      generateEmbeddings
    } = req.body;
    
    // Get participant ID (if authenticated)
    let participantId;
    try {
      participantId = await getParticipantId(req);
      console.log(`Participant ID resolved to: ${participantId}`);
    } catch (participantError) {
      console.error('Error resolving participant ID:', participantError);
    }
    
    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (tagError) {
        console.error('Error parsing tags:', tagError);
        // If tags can't be parsed, continue without them
      }
    }

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (metadataError) {
        console.error('Error parsing metadata:', metadataError);
        // If metadata can't be parsed, continue without it
      }
    }

    // Create initial file upload entry
    const fileUpload = await fileUploads.createFileUpload({
      // Match the parameter names expected by the database function
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      fileSize: req.file.size,
      description: parsedMetadata?.description || null,
      tags: parsedTags,
      // Additional metadata that will be preserved but not used directly by the db function
      metadata: parsedMetadata,
      participantId,
      keepOriginal: keepOriginal === 'true' || keepOriginal === true,
      generateEmbeddings: generateEmbeddings !== 'false' && generateEmbeddings !== false
    }, req.clientPool);

    console.log('Created file upload record:', fileUpload);

    // Log successful file upload
    try {
      await logEvent({
        participantId,
        eventType: EVENT_TYPE.FILE_UPLOAD_SUCCESS, // Using correct event type ID 11
        description: 'File upload successful',
        details: {
          fileId: fileUpload.id,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        },
        category: EVENT_CATEGORY.PARTICIPANT, // File uploads are participant events
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }, req.clientPool);
      
      console.log('File upload success event logged');
    } catch (logError) {
      console.error('Failed to log file upload success event:', logError);
    }

    // Process the file in the background (non-blocking)
    try {
      // Send response with file info before processing is complete
      res.status(201).json(fileUpload);
      
      // Process file after response has been sent
      // Map the DB record fields to what processFile expects
      const processFileData = {
        path: fileUpload.file_path, // processFile expects 'path', but our DB has 'file_path'
        originalname: fileUpload.filename,
        mimetype: fileUpload.mime_type,
        size: fileUpload.file_size
      };
      
      const processingResult = await processFile(processFileData, {}, req.clientPool);
      console.log('File processing completed:', processingResult);
      
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
      
      // Log successful file processing
      try {
        await logEvent({
          participantId,
          eventType: EVENT_TYPE.FILE_UPLOAD_SUCCESS, // Consistent event type ID 11
          description: 'File processing completed',
          details: {
            fileId: fileUpload.id,
            fileName: req.file.originalname,
            processingResult
          },
          category: EVENT_CATEGORY.PARTICIPANT, // File processing is a participant event
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }, req.clientPool);
        
        console.log('File processing completion event logged');
      } catch (logError) {
        console.error('Failed to log file processing completion event:', logError);
      }
    } catch (processingError) {
      console.error('Error processing file:', processingError);
      
      // Log failed file processing
      try {
        await logEvent({
          participantId,
          eventType: EVENT_TYPE.FILE_UPLOAD_FAILURE, // Correct event type ID 12
          description: 'File processing failed',
          details: {
            fileId: fileUpload.id,
            fileName: req.file.originalname,
            error: processingError.message
          },
          category: EVENT_CATEGORY.PARTICIPANT, // File uploads are participant events
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }, req.clientPool);
        
        console.log('File processing failure event logged');
      } catch (logError) {
        console.error('Failed to log file processing failure event:', logError);
      }
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Log the failed file upload at the outer level
    try {
      await logEvent({
        participantId: await getParticipantId(req).catch(() => null),
        eventType: EVENT_TYPE.FILE_UPLOAD_FAILURE, // Correct event type ID 12
        description: 'File upload failed',
        details: {
          error: error.message,
          file: req.file ? {
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
          } : 'No file data'
        },
        category: EVENT_CATEGORY.PARTICIPANT, // File uploads are participant events
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }, req.clientPool);
      
      console.log('File upload failure event logged at outer level');
    } catch (logError) {
      console.error('Failed to log file upload failure event at outer level:', logError);
    }
    
    return next(new ApiError('Failed to upload file', 500, { cause: error }));
  }
});

export default router;
