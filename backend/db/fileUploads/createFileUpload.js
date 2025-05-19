/**
 * Create a new file upload record
 * @module db/fileUploads/createFileUpload
 */

/**
 * File Uploads module - creates file upload records
 * @module db/fileUploads/createFileUpload
 */

/**
 * Create a new file upload record
 * @param {Object} uploadData - The upload data
 * @param {string} uploadData.filename - The filename
 * @param {string} uploadData.mimeType - The MIME type
 * @param {string} uploadData.filePath - The file path in storage
 * @param {number} [uploadData.fileSize] - The file size in bytes (optional)
 * @param {string} [uploadData.publicUrl] - The public URL of the file (optional)
 * @param {string} [uploadData.description] - Optional description of the file
 * @param {string[]} [uploadData.tags] - Optional tags for categorizing the file
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The created upload record
 */
export async function createFileUpload(uploadData, pool) {
  const {
    filename,
    mimeType,
    filePath,
    fileSize,
    publicUrl,
    description,
    tags
  } = uploadData;
  
  // Default bucket name to 'public' if not available from pool options
  let bucketName = pool?.options?.schema || 'public';
  
  try {
      
    // Execute the query
    const queryText = `
      INSERT INTO file_uploads 
      (filename, mime_type, file_path, file_size, public_url, bucket_name, description, tags) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const values = [
      filename,
      mimeType,
      filePath,
      fileSize || null,
      publicUrl || null,
      bucketName,
      description || null,
      tags || null
    ];
    
    const result = await pool.query(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating file upload:', error);
    throw error;
  }
}
