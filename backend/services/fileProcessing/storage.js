/**
 * Storage Service for File Operations
 * 
 * Handles file uploads and deletions to/from Supabase storage.
 * Supports multi-tenant bucket organization.
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

/**
 * Upload a file to storage (Supabase)
 * 
 * @param {string} filePath - Path to the file on disk
 * @param {string} storagePath - Path in storage where the file should be stored
 * @param {string} bucketName - Storage bucket name (defaults to schema name)
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadToStorage(filePath, storagePath, bucketName) {
  try {
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Check environment variables.');
    }
    
    console.log('Creating Supabase client with URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if bucket exists
    console.log(`Checking if bucket '${bucketName}' exists in Supabase storage...`);
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error(`Failed to check storage buckets: ${bucketsError.message}`);
    }
    
    const bucketExists = buckets.some(b => b.name === bucketName);
    if (!bucketExists) {
      console.error(`Bucket '${bucketName}' does not exist. Available buckets:`, buckets.map(b => b.name));
      throw new Error(`Storage bucket '${bucketName}' does not exist`);
    }
    
    // Read file contents
    console.log(`Reading file from: ${filePath}`);
    const fileBuffer = readFileSync(filePath);
    console.log(`File read successfully, size: ${fileBuffer.length} bytes`);
    
    console.log(`Uploading ${filePath} to Supabase storage: ${bucketName}/${storagePath}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      });
      
    if (error) {
      console.error('Supabase storage upload error:', error);
      throw error;
    }
    
    console.log('File successfully uploaded to storage');
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
      
    console.log('File uploaded successfully to Supabase storage');
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase storage:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase storage
 * 
 * @param {string} storagePath - Path to the file in storage (e.g., 'uploads/filename.txt')
 * @param {string} [bucketName='uploads'] - Name of the storage bucket
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export async function deleteFromStorage(storagePath, bucketName = 'uploads') {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Check environment variables.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Remove leading slash if present
    const cleanPath = storagePath.startsWith('/') ? storagePath.substring(1) : storagePath;
    
    console.log(`Deleting file from storage: ${bucketName}/${cleanPath}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([cleanPath]);
      
    if (error) {
      // If file not found, consider it a success
      if (error.message.includes('not found')) {
        console.log(`File ${cleanPath} not found in storage, considering it deleted`);
        return true;
      }
      throw error;
    }
    
    console.log(`Successfully deleted file from storage: ${cleanPath}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
}