/**
 * File Deletion API Route
 * @module routes/api/fileUploads/fileDeletion
 */

import express from 'express';
import { fileUploads } from '../../../db/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   DELETE /api/file-uploads/:id
 * @desc    Delete a file upload
 * @access  Private (requires authentication via middleware in index.js)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return next(new ApiError('Invalid file ID', 400));
    }

    // Check if file is currently being processed
    const { isFileInProcessing } = await import('../../../services/fileProcessing.js');
    if (isFileInProcessing(fileId)) {
      return next(new ApiError('Cannot delete a file while it is being processed. Please try again later.', 409));
    }

    // Get file details before deletion
    const fileDetails = await fileUploads.getFileUploadById(fileId, req.clientPool);
    if (!fileDetails) {
      return next(new ApiError('File not found', 404));
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
        const { deleteFromStorage } = await import('../../../services/fileProcessing.js');
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
    return next(new ApiError('Failed to delete file', 500, { cause: error }));
  }
});

export default router;
