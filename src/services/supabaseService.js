/**
 * Supabase service for file storage operations
 * @module services/supabaseService
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
// Using service role key for file operations to ensure proper permissions
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Log initialization without exposing sensitive information
console.log('Supabase client initialized with service role key');

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
    
    console.log(`Attempting to upload file to bucket: ${bucketName}, path: ${filePath}`);
    
    // Check if bucket exists, create it if it doesn't
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error(`Supabase bucket list error: ${bucketsError.message}`);
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} does not exist, creating it...`);
      const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
        public: true // Make bucket public for easier access
      });
      
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        throw new Error(`Supabase bucket creation error: ${createBucketError.message}`);
      }
      console.log(`Bucket ${bucketName} created successfully`);
    }
    
    // Upload the file to Supabase Storage
    console.log(`Uploading file to bucket ${bucketName}, path: ${filePath}`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true // Allow overwriting if file exists
      });
    
    if (error) {
      console.error('Supabase upload error details:', error);
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