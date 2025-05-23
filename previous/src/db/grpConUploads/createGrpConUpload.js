/**
 * Create a new group conversation upload record
 * @module db/grpConUploads/createGrpConUpload
 */

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
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<Object>} - The created upload record
 */
const createGrpConUpload = async (uploadData, pool) => {
  
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
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating group conversation upload:', error);
    throw error;
  }
};

export default createGrpConUpload;