/**
 * Storage Utility
 * Handles file operations for different storage backends
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base directory for file storage
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Delete a file from the local filesystem
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export async function deleteFileFromStorage(filePath) {
  try {
    // If it's a relative path, resolve it relative to the uploads directory
    const fullPath = filePath.startsWith('/') 
      ? filePath 
      : path.join(UPLOADS_DIR, filePath);
    
    await fs.unlink(fullPath);
    console.log(`Successfully deleted file: ${fullPath}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`File not found, may have already been deleted: ${filePath}`);
      return true; // File doesn't exist, consider it deleted
    }
    console.error(`Error deleting file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Ensure the uploads directory exists
 * @returns {Promise<void>}
 */
export async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Error creating uploads directory:', error);
      throw error;
    }
  }
}

export default {
  deleteFileFromStorage,
  ensureUploadsDir
};
