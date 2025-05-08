/**
 * Create a new group conversation upload record
 * @module db/grpConUploads/createGrpConUpload
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Create a new group conversation upload record
 * @param {Object} uploadData - The upload data
 * @param {number} uploadData.grpConId - The group conversation ID
 * @param {number} [uploadData.turnId] - The turn ID (optional)
 * @param {string} uploadData.filename - The filename
 * @param {string} uploadData.mimeType - The MIME type
 * @param {string} uploadData.filePath - The file path in Supabase Storage
 * @param {string} [uploadData.publicUrl] - The public URL of the file (optional)
 * @param {string} [uploadData.bucketName] - The Supabase Storage bucket name (optional)
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Object>} - The created upload record
 */
const createGrpConUpload = async (uploadData, customPoolOrSchema = null) => {
  // Determine which pool to use
  let currentPool = pool;
  
  if (customPoolOrSchema) {
    if (typeof customPoolOrSchema === 'string') {
      // If a schema name is provided, create a pool for that schema
      currentPool = createPool(customPoolOrSchema);
    } else {
      // If a pool object is provided, use it
      currentPool = customPoolOrSchema;
    }
  } else {
    // Use default schema if no schema or pool is provided
    const defaultSchema = getDefaultSchema();
    if (defaultSchema !== 'public') {
      currentPool = createPool(defaultSchema);
    }
  }
  
  const {
    grpConId,
    turnId,
    filename,
    mimeType,
    filePath,
    publicUrl,
    bucketName
  } = uploadData;
  
  const query = `
    INSERT INTO grp_con_uploads (
      grp_con_id,
      turn_id,
      filename,
      mime_type,
      file_path,
      public_url,
      bucket_name
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    ) RETURNING *
  `;
  
  const values = [
    grpConId,
    turnId || null,
    filename,
    mimeType,
    filePath,
    publicUrl || null,
    bucketName || null
  ];
  
  try {
    const result = await currentPool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating group conversation upload:', error);
    throw error;
  }
};

export default createGrpConUpload;