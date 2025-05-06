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
import { uploadFile, getFile, deleteFile } from '../services/supabaseService.js';

// Turn kind for file uploads
const TURN_KIND_UPLOAD = 6;

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
 * Upload a file to a conversation
 * @name POST /api/grp-con-uploads
 * @function
 * @memberof module:routes/grpConUploads
 * @param {string} req.body.grpConId - The conversation ID
 * @param {string} req.body.avatarId - The avatar ID (optional, defaults to participant's avatar)
 * @param {File} req.file - The file to upload
 * @returns {Object} The created upload record
 */
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { grpConId, avatarId } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!grpConId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    // Upload file to Supabase Storage
    const fileBuffer = file.buffer;
    const fileName = file.originalname;
    const mimeType = file.mimetype;
    const clientSchema = req.clientSchema;
    
    const uploadResult = await uploadFile(
      fileBuffer,
      fileName,
      mimeType,
      clientSchema,
      grpConId
    );
    
    // Create a turn record for the file upload
    // Use the participant's ID from req.user or a provided avatar ID
    const participantId = req.user.participantId;
    const effectiveAvatarId = avatarId || participantId;
    
    // Create a turn with the file name as the content
    // Use an empty array for the content vector (or generate one if needed)
    const emptyVector = new Array(1536).fill(0);
    
    // Get all existing turns for the conversation to determine the next turn index
    const existingTurns = await getGrpConAvatarTurnsByConversation(grpConId, clientSchema);
    
    // Find the maximum turn index from existing turns
    let maxTurnIndex = 0;
    if (existingTurns.length > 0) {
      maxTurnIndex = Math.max(...existingTurns.map(turn => parseFloat(turn.turn_index)));
    }
    
    // Use the next available index (max + 1) or 1 if there are no existing turns
    const turnIndex = maxTurnIndex + 1;
    
    // Create the turn record
    const turn = await createGrpConAvatarTurn(
      grpConId,
      effectiveAvatarId,
      turnIndex,
      `File: ${fileName}`,
      emptyVector,
      TURN_KIND_UPLOAD,
      clientSchema
    );
    
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
    
    const upload = await createGrpConUpload(uploadData, clientSchema);
    
    res.status(201).json(upload);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * Get a specific file by ID
 * @name GET /api/grp-con-uploads/:id
 * @function
 * @memberof module:routes/grpConUploads
 * @param {string} req.params.id - The upload ID
 * @returns {Object} The file data
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const clientSchema = req.clientSchema;
    
    // Get upload record from database
    const upload = await getGrpConUploadById(id, clientSchema);
    
    if (!upload) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file from Supabase Storage
    const fileData = await getFile(upload.file_path, clientSchema);
    
    // Set appropriate headers
    res.setHeader('Content-Type', upload.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${upload.filename}"`);
    
    // Send file
    res.send(fileData);
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
    const clientSchema = req.clientSchema;
    
    // Get all upload records for the conversation
    const uploads = await getGrpConUploadsByConversation(grpConId, clientSchema);
    
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
    const clientSchema = req.clientSchema;
    
    // Get upload record from database
    const upload = await getGrpConUploadById(id, clientSchema);
    
    if (!upload) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete file from Supabase Storage
    await deleteFile(upload.file_path, clientSchema);
    
    // Delete record from database
    const deleted = await deleteGrpConUpload(id, clientSchema);
    
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