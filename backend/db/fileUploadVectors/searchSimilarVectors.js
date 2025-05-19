/**
 * Search for similar vectors
 * @module db/fileUploadVectors/searchSimilarVectors
 */

/**
 * Search for similar vectors using vector similarity
 * @param {Array|string} queryVector - The query vector to compare against
 * @param {Object} options - Search options
 * @param {number} [options.limit=10] - Maximum number of results to return
 * @param {number} [options.threshold=0.7] - Similarity threshold (0-1)
 * @param {number} [options.excludeFileId] - Optional file ID to exclude from results
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} - Array of similar vectors with similarity scores
 */
export async function searchSimilarVectors(queryVector, options = {}, pool) {
  const { 
    limit = 10, 
    threshold = 0.7, 
    excludeFileId = null 
  } = options;
  
  if (!queryVector) {
    throw new Error('Query vector is required');
  }

  try {
    
    // Convert vector to string if it's an array
    const vecLiteral = typeof queryVector === 'string' 
      ? queryVector 
      : JSON.stringify(queryVector);
    
    // Build the query
    let queryText = `
      SELECT 
        fv.id,
        fv.file_upload_id,
        fv.chunk_index,
        fv.content_text,
        f.filename,
        f.mime_type,
        f.public_url,
        f.bucket_name,
        1 - (fv.content_vector <=> $1::vector) as similarity
      FROM 
        file_upload_vectors fv
      JOIN 
        file_uploads f ON fv.file_upload_id = f.id
      WHERE 
        1 - (fv.content_vector <=> $1::vector) > $2
    `;
    
    const queryParams = [vecLiteral, threshold];
    let paramIndex = 3;
    
    // Add exclusion if needed
    if (excludeFileId) {
      queryText += ` AND fv.file_upload_id != $${paramIndex}`;
      queryParams.push(excludeFileId);
      paramIndex++;
    }
    
    // Add ordering and limit
    queryText += `
      ORDER BY 
        similarity DESC
      LIMIT $${paramIndex}
    `;
    queryParams.push(limit);
    
    // Execute the query
    const result = await pool.query(queryText, queryParams);
    
    return result.rows;
  } catch (error) {
    console.error('Error searching for similar vectors:', error);
    throw error;
  }
}
