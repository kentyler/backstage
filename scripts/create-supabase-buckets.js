/**
 * Script to create Supabase buckets for each client schema
 * 
 * This script creates a bucket in Supabase Storage for each client schema.
 * Each bucket is named after the client schema and is configured to:
 * - Be private (not public)
 * - Accept only text files
 * - Have a 10MB file size limit
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

// Hardcoded list of client schemas as provided by the user
const clientSchemas = ['dev', 'conflict-club', 'first-congregational', 'bsa'];

/**
 * Creates a bucket in Supabase Storage if it doesn't already exist
 * @param {string} bucketName - Name of the bucket to create
 * @returns {Promise<void>}
 */
async function createBucketIfNotExists(bucketName) {
  try {
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Error listing buckets: ${listError.message}`);
    }
    
    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists. Skipping creation.`);
      return;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false, // Private access
      allowedMimeTypes: ['text/*'], // Only allow text files
      fileSizeLimit: '10MB', // 10MB file size limit
    });
    
    if (error) {
      throw new Error(`Error creating bucket '${bucketName}': ${error.message}`);
    }
    
    console.log(`Successfully created bucket '${bucketName}'`);
  } catch (error) {
    console.error(`Failed to create bucket '${bucketName}':`, error.message);
  }
}

/**
 * Main function to create buckets for all client schemas
 */
async function createBucketsForClientSchemas() {
  console.log('Creating Supabase buckets for client schemas...');
  
  for (const schema of clientSchemas) {
    await createBucketIfNotExists(schema);
  }
  
  console.log('Bucket creation process completed.');
}

// Run the script
createBucketsForClientSchemas()
  .catch(error => {
    console.error('Error in bucket creation process:', error);
    process.exit(1);
  });