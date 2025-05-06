/**
 * Supabase service for file storage operations
 * @module services/supabaseService
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration with hardcoded values
// Using anonymous key for client-side operations
const SUPABASE_URL = 'https://tbmpeqqzaproilxazsjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibXBlcXF6YXByb2lseGF6c2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDI5MTEsImV4cCI6MjA2MDMxODkxMX0.R0HyzKWvAExBSB_rv0wmBTdTvnKQSLcAXsGE7ICA6WI';

// Create Supabase client with anonymous key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Log Supabase configuration for debugging
console.log('Supabase URL:', SUPABASE_URL);
console.log('Using Supabase anonymous key for authentication');

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - The MIME type of the file
 * @param {string} clientSchema - The client schema (used for bucket organization)
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} - The upload result with file path
 */
export const uploadFile = async (fileBuffer, fileName, mimeType, clientSchema, conversationId) => {
  try {
    // Use the client schema as the bucket name for better multi-tenant isolation
    // Each client/tenant gets their own bucket
    const bucketName = clientSchema;
    const filePath = `${conversationId}/${fileName}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false // Don't overwrite if file exists
      });
    
    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }
    
    // Get the public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return {
      filePath,
      publicUrl,
      bucketName
    };
  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    throw error;
  }
};

/**
 * Get a file from Supabase Storage
 * @param {string} filePath - The path of the file in Supabase Storage
 * @param {string} clientSchema - The client schema (used as bucket name)
 * @returns {Promise<Object>} - The file data
 */
export const getFile = async (filePath, clientSchema) => {
  try {
    const bucketName = clientSchema;
    
    // Download the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      throw new Error(`Supabase download error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error downloading file from Supabase:', error);
    throw error;
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The path of the file in Supabase Storage
 * @param {string} clientSchema - The client schema (used as bucket name)
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export const deleteFile = async (filePath, clientSchema) => {
  try {
    const bucketName = clientSchema;
    
    // Delete the file from Supabase Storage
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Supabase deletion error: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file from Supabase:', error);
    throw error;
  }
};

export default {
  uploadFile,
  getFile,
  deleteFile
};