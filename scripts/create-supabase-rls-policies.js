/**
 * Script to create RLS policies for Supabase Storage
 * 
 * This script creates the necessary RLS policies to allow file uploads
 * to Supabase Storage buckets. It creates policies for:
 * - INSERT: Allow file uploads
 * - SELECT: Allow file downloads
 * - DELETE: Allow file deletions
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration with hardcoded values
const SUPABASE_URL = 'https://tbmpeqqzaproilxazsjf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibXBlcXF6YXByb2lseGF6c2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDc0MjkxMSwiZXhwIjoyMDYwMzE4OTExfQ.Yx9TpCxySGHkYQVPQXMKBDjWvLJGz1FNRQDPxiNtqDc';

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Hardcoded list of client schemas/buckets
const buckets = ['dev', 'conflict-club', 'first-congregational', 'bsa'];

/**
 * Creates RLS policies for a bucket
 * @param {string} bucketName - Name of the bucket
 * @returns {Promise<void>}
 */
async function createRLSPoliciesForBucket(bucketName) {
  try {
    console.log(`Creating RLS policies for bucket '${bucketName}'...`);
    
    // Get the bucket ID
    const { data: bucketData, error: bucketError } = await supabase
      .from('storage.buckets')
      .select('id')
      .eq('name', bucketName)
      .single();
    
    if (bucketError) {
      throw new Error(`Error getting bucket ID: ${bucketError.message}`);
    }
    
    if (!bucketData) {
      throw new Error(`Bucket '${bucketName}' not found`);
    }
    
    const bucketId = bucketData.id;
    
    // Create INSERT policy to allow file uploads
    const { error: insertError } = await supabase.rpc('create_storage_policy', {
      bucket_id: bucketId,
      policy_name: `${bucketName}_insert_policy`,
      definition: 'true', // Allow all uploads
      operation: 'INSERT'
    });
    
    if (insertError) {
      throw new Error(`Error creating INSERT policy: ${insertError.message}`);
    }
    
    console.log(`Created INSERT policy for bucket '${bucketName}'`);
    
    // Create SELECT policy to allow file downloads
    const { error: selectError } = await supabase.rpc('create_storage_policy', {
      bucket_id: bucketId,
      policy_name: `${bucketName}_select_policy`,
      definition: 'true', // Allow all downloads
      operation: 'SELECT'
    });
    
    if (selectError) {
      throw new Error(`Error creating SELECT policy: ${selectError.message}`);
    }
    
    console.log(`Created SELECT policy for bucket '${bucketName}'`);
    
    // Create DELETE policy to allow file deletions
    const { error: deleteError } = await supabase.rpc('create_storage_policy', {
      bucket_id: bucketId,
      policy_name: `${bucketName}_delete_policy`,
      definition: 'true', // Allow all deletions
      operation: 'DELETE'
    });
    
    if (deleteError) {
      throw new Error(`Error creating DELETE policy: ${deleteError.message}`);
    }
    
    console.log(`Created DELETE policy for bucket '${bucketName}'`);
    
    console.log(`Successfully created RLS policies for bucket '${bucketName}'`);
  } catch (error) {
    console.error(`Failed to create RLS policies for bucket '${bucketName}':`, error.message);
  }
}

/**
 * Main function to create RLS policies for all buckets
 */
async function createRLSPoliciesForAllBuckets() {
  console.log('Creating RLS policies for all buckets...');
  
  for (const bucket of buckets) {
    await createRLSPoliciesForBucket(bucket);
  }
  
  console.log('RLS policy creation process completed.');
}

// Run the script
createRLSPoliciesForAllBuckets()
  .catch(error => {
    console.error('Error in RLS policy creation process:', error);
    process.exit(1);
  });