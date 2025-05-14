/**
 * Group conversation uploads routes
 * @module routes/grpConUploads
 */

import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { 
  createGrpConUpload, 
  getGrpConUploadById, 
  getGrpConUploadsByConversation,
  deleteGrpConUpload
} from '../db/grpConUploads/index.js';
import { 
  createGrpConAvatarTurn,
  getGrpConAvatarTurnsByConversation
} from '../db/grpConAvatarTurns/index.js';
import {
  createGrpConUploadVector,
  getGrpConUploadVectorsByUpload
} from '../db/grpConUploadVectors/index.js';
import { uploadFile, getFile, deleteFile } from '../services/supabaseService.js';
import { generateEmbedding, initEmbeddingService } from '../services/embeddingService.js';
import { determineSchemaFromHostname } from '../middleware/setClientSchema.js';

// Turn kind for file uploads
const TURN_KIND_UPLOAD = 6;

// Constants for file chunking
const MAX_CHUNK_SIZE = 1000; // Maximum size of a chunk in characters
const CHUNK_OVERLAP = 100; // Number of characters to overlap between chunks
const MIN_FILE_SIZE_FOR_CHUNKING = 2000; // Minimum file size to trigger chunking

const router = express.Router();

// Configure multer for memory storage (files will be buffered in memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Initially only accepting text files
    if (file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Only text files are allowed for now'), false);
    }
  }
});

/**
 * Split text into chunks with overlap
 * @param {string} text - The text to split
 * @param {number} maxChunkSize - Maximum size of each chunk
 * @param {number} overlap - Number of characters to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
const chunkText = (text, maxChunkSize = MAX_CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
  // If text is smaller than max chunk size, return it as a single chunk
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + maxChunkSize;
    
    // If we're not at the end of the text, try to find a good break point
    if (endIndex < text.length) {
      // Look for a newline or period to break at
      const newlineIndex = text.lastIndexOf('\n', endIndex);
      const periodIndex = text.lastIndexOf('.', endIndex);
      
      // Use the closest break point that's not too far back
      if (newlineIndex > startIndex && newlineIndex > endIndex - 100) {
        endIndex = newlineIndex + 1; // Include the newline
      } else if (periodIndex > startIndex && periodIndex > endIndex - 100) {
        endIndex = periodIndex + 1; // Include the period
      }
      // Otherwise, just use the calculated end index
    }
    
    // Add this chunk to the array
    chunks.push(text.substring(startIndex, endIndex));
    
    // Move start index for next chunk, accounting for overlap
    startIndex = endIndex - overlap;
    
    // Make sure we don't go backwards (can happen with small chunks)
    if (startIndex <= 0 || endIndex >= text.length) {
      break;
    }
  }
  
  // If we didn't reach the end, add the remainder
  if (startIndex < text.length) {
    chunks.push(text.substring(startIndex));
  }
  
  return chunks;
};

/**
 * Upload a file to a conversation
 * @name POST /api/grp-con-uploads
 * @function
 * @memberof module:routes/grpConUploads
 * @param {string} req.body.grpConId - The conversation ID
 * @param {string} req.body.avatarId - The avatar ID (optional, defaults to participant's avatar)
 * @param {File} req.file - The file to upload
 * @returns {Object} The created upload record with chunk count
 */
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    console.log('File upload request received');
    
    const { grpConId, avatarId } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!grpConId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    console.log(`Processing file upload for conversation ${grpConId}`);
    
    try {
      // Upload file to Supabase Storage
      const fileBuffer = file.buffer;
      const fileName = file.originalname;
      const mimeType = file.mimetype;
    
      // Get schema name from hostname for Supabase storage
      const schema = determineSchemaFromHostname(req.hostname);
      console.log(`Using schema ${schema} for Supabase storage`);
      
      let uploadResult;
      try {
        uploadResult = await uploadFile(
          fileBuffer,
          fileName,
          mimeType,
          schema,
          grpConId
        );
        console.log('File uploaded to Supabase successfully');
      } catch (supabaseError) {
        console.error('Supabase upload error:', supabaseError);
        return res.status(500).json({ 
          error: 'Failed to upload file to storage',
          details: supabaseError.message
        });
      }
      
      // Convert buffer to text for processing
      const fileContent = fileBuffer.toString('utf-8');
      
      // Create a turn record for the file upload
      try {
        // Use the participant's ID from req.user or a provided avatar ID
        const participantId = req.user.participantId;
        const effectiveAvatarId = avatarId || participantId;
        
        // Create a turn with the file name as the content
        // Use an empty array for the content vector (or generate one if needed)
        const emptyVector = new Array(1536).fill(0);
        
        console.log(`Getting existing turns for conversation ${grpConId}`);
        // Get all existing turns for the conversation to determine the next turn index
        let existingTurns;
        try {
          existingTurns = await getGrpConAvatarTurnsByConversation(grpConId, req.clientPool);
          console.log(`Found ${existingTurns.length} existing turns`);
        } catch (turnsError) {
          console.error('Error getting existing turns:', turnsError);
          return res.status(500).json({ 
            error: 'Failed to get existing turns',
            details: turnsError.message
          });
        }
        
        // Find the maximum turn index from existing turns
        let maxTurnIndex = 0;
        if (existingTurns.length > 0) {
          maxTurnIndex = Math.max(...existingTurns.map(turn => parseFloat(turn.turn_index)));
        }
        
        // Use the next available index (max + 1) or 1 if there are no existing turns
        const turnIndex = maxTurnIndex + 1;
        console.log(`Creating turn with index ${turnIndex}`);
        
        let turn;
        try {
          turn = await createGrpConAvatarTurn(
            grpConId,
            effectiveAvatarId,
            turnIndex,
            `File: ${fileName}`,
            emptyVector,
            TURN_KIND_UPLOAD,
            null,// messageTypeId parameter
            req.clientPool
          );
          console.log(`Turn created with ID ${turn.id}`);
        } catch (turnError) {
          console.error('Error creating turn:', turnError);
          return res.status(500).json({ 
            error: 'Failed to create turn record',
            details: turnError.message
          });
        }
        
        // Create record in database with the new turn ID
        const uploadData = {
          grpConId,
          turnId: turn.id,
          filename: fileName,
          mimeType,
          filePath: uploadResult.filePath,
          publicUrl: uploadResult.publicUrl,
          bucketName: uploadResult.bucketName
        };
        
        let upload;
        try {
          upload = await createGrpConUpload(uploadData, req.clientPool);
          console.log(`Upload record created with ID ${upload.id}`);
        } catch (uploadError) {
          console.error('Error creating upload record:', uploadError);
          return res.status(500).json({ 
            error: 'Failed to create upload record',
            details: uploadError.message
          });
        }
        
        // Initialize the embedding service if needed
        try {
          console.log('Initializing embedding service');
          initEmbeddingService();
        } catch (embeddingInitError) {
          console.error('Error initializing embedding service:', embeddingInitError);
          // Continue anyway, as this is not critical for the upload itself
        }
        
        // Determine if chunking is necessary based on file size
        let chunks = [];
        if (fileContent.length >= MIN_FILE_SIZE_FOR_CHUNKING) {
          // Split the file into chunks
          console.log(`File size ${fileContent.length} exceeds minimum for chunking, splitting into chunks`);
          chunks = chunkText(fileContent);
        } else {
          // Use the entire file as a single chunk
          console.log(`File size ${fileContent.length} is below minimum for chunking, using single chunk`);
          chunks = [fileContent];
        }
        console.log(`Created ${chunks.length} chunks`);
        
        // Process each chunk and store it in the database
        try {
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // Generate embedding for the chunk
            console.log(`Generating embedding for chunk ${i+1}/${chunks.length}`);
            let embedding;
            try {
              embedding = await generateEmbedding(chunk);
            } catch (embeddingError) {
              console.error(`Error generating embedding for chunk ${i+1}:`, embeddingError);
              // Use a zero vector as fallback
              embedding = new Array(1536).fill(0);
            }
            
            // Create vector record in database
            const vectorData = {
              uploadId: upload.id,
              chunkIndex: i,
              contentText: chunk,
              contentVector: embedding
            };
            
            try {
              await createGrpConUploadVector(vectorData);
              console.log(`Vector record created for chunk ${i+1}`);
            } catch (vectorError) {
              console.error(`Error creating vector record for chunk ${i+1}:`, vectorError);
              // Continue with other chunks even if one fails
            }
          }
        } catch (chunkProcessingError) {
          console.error('Error processing chunks:', chunkProcessingError);
          // Continue anyway, as the file is already uploaded
        }
        
        // Add chunk count to the response
        const response = {
          ...upload,
          chunkCount: chunks.length
        };
        
        console.log('File upload completed successfully');
        res.status(201).json(response);
      } catch (turnCreationError) {
        console.error('Error in turn creation process:', turnCreationError);
        return res.status(500).json({ 
          error: 'Failed to process file upload',
          details: turnCreationError.message
        });
      }
    } catch (processingError) {
      console.error('Error processing file upload:', processingError);
      return res.status(500).json({ 
        error: 'Failed to process file upload',
        details: processingError.message
      });
    }
  } catch (error) {
    console.error('Unhandled error in file upload route:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

/**
 * Get a specific file by ID
 * @name GET /api/grp-con-uploads/:id
 * @function
 * @memberof module:routes/grpConUploads
 * @param {string} req.params.id - The upload ID
 * @param {boolean} [req.query.vectors] - Whether to include vectors in the response
 * @returns {Object} The file data or upload record with vectors
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Get schema name from hostname for Supabase storage
    const schema = determineSchemaFromHostname(req.hostname);
    
    // Get upload record from database
    const upload = await getGrpConUploadById(id);
    
    if (!upload) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if vectors parameter is provided and true
    const includeVectors = req.query.vectors === 'true';
    
    if (includeVectors) {
      // Get vectors for this upload
      const vectors = await getGrpConUploadVectorsByUpload(id, req.clientPool);
      
      // Add vectors to the response
      const response = {
        ...upload,
        vectors
      };
      
      res.json(response);
    } else {
      // Get file from Supabase Storage
      const fileData = await getFile(upload.file_path, schema);
      
      // Set appropriate headers
      res.setHeader('Content-Type', upload.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${upload.filename}"`);
      
      // Send file
      res.send(fileData);
    }
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

/**
 * Get all files for a conversation
 * @name GET /api/grp-con-uploads/conversation/:grpConId
 * @function
 * @memberof module:routes/grpConUploads
 * @param {string} req.params.grpConId - The conversation ID
 * @returns {Array} Array of upload records
 */
router.get('/conversation/:grpConId', requireAuth, async (req, res) => {
  try {
    const { grpConId } = req.params;
    
    // Get all upload records for the conversation
    const uploads = await getGrpConUploadsByConversation(grpConId, req.clientPool);
    
    res.json(uploads);
  } catch (error) {
    console.error('Error getting files for conversation:', error);
    res.status(500).json({ error: 'Failed to get files for conversation' });
  }
});

/**
 * Delete a file
 * @name DELETE /api/grp-con-uploads/:id
 * @function
 * @memberof module:routes/grpConUploads
 * @param {string} req.params.id - The upload ID
 * @returns {Object} Success message
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Get schema name from hostname for Supabase storage
    const schema = determineSchemaFromHostname(req.hostname);
    
    
    // Get upload record from database
    const upload = await getGrpConUploadById(id, req.clientPool);
    
    if (!upload) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete file from Supabase Storage
    await deleteFile(upload.file_path, schema);
    
    // Delete record from database
    const deleted = await deleteGrpConUpload(id, req.clientPool);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Failed to delete file record' });
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;