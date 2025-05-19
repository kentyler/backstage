import { pool } from './connection.js';

/**
 * Find similar messages using vector similarity search
 * @param {number[]} embedding - The embedding vector to compare against
 * @param {string} excludeTopicPath - Topic path to exclude from results
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - Array of similar messages with their topic paths
 */
export async function findSimilarMessages(embedding, excludeTopicPath, limit = 10) {
  const client = await pool.connect();
  try {
    console.log('Searching for similar messages with params:', {
      excludeTopicPath,
      embeddingLength: embedding?.length,
      limit,
      embeddingType: typeof embedding,
      embeddingIsArray: Array.isArray(embedding),
      firstFewValues: embedding?.slice?.(0, 3)
    });
    
    // Check if we have a valid embedding
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.error('Invalid embedding provided to findSimilarMessages:', {
        type: typeof embedding,
        isArray: Array.isArray(embedding),
        length: embedding?.length
      });
      return [];
    }
    
    // Log the query and parameters
    console.log('Running vector similarity query with excludeTopicPath:', excludeTopicPath);

    const query = `
      WITH similar_messages AS (
        SELECT 
          m.id,
          m.content_text as content,
          m.topicpathid as "topicPathId",
          tp.path::text as "topicPath",
          m.created_at as "createdAt",
          m.message_type_id = 1 as "isUser",
          m.content_vector <-> $1 as distance,
          m.turn_index
        FROM grp_topic_avatar_turns m
        LEFT JOIN topic_paths tp ON m.topicpathid = tp.path::text
        WHERE m.topicpathid != $2
        AND m.content_text IS NOT NULL
        AND m.content_text != ''
        AND m.content_vector IS NOT NULL
        AND m.message_type_id = 2  -- Only include assistant messages
        ORDER BY m.content_vector <-> $1
        LIMIT $3
      )
      SELECT * FROM similar_messages
      WHERE distance < 0.95  -- Allow for more potential matches (less strict threshold)
      ORDER BY distance ASC;
    `;
    
    const result = await client.query(query, [JSON.stringify(embedding), excludeTopicPath, limit * 2]); // Get more results initially to account for filtering
    
    console.log(`Found ${result.rows.length} similar messages after filtering`);
    if (result.rows.length > 0) {
      console.log('First similar message:', {
        id: result.rows[0].id,
        content: result.rows[0].content?.substring(0, 100) + '...',
        distance: result.rows[0].distance,
        topicPathId: result.rows[0].topicPathId,
        topicPath: result.rows[0].topicPath || 'Not found in query result'
      });
      
      // Log all returned topic paths to help debug
      console.log('All topic paths from query:', result.rows.map(r => ({
        topicPathId: r.topicPathId,
        topicPath: r.topicPath
      })));
    }
    
    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      topicPathId: row.topicPathId,
      topicPath: row.topicPath || 'Unknown', // Include the human-readable topic path
      isUser: row.isUser,
      timestamp: row.createdAt,
      score: 1 - row.distance  // Convert distance to similarity score (0-1)
    }));
  } catch (error) {
    console.error('Error in findSimilarMessages:', {
      error: error.message,
      stack: error.stack,
      excludeTopicPath,
      embeddingLength: embedding?.length
    });
    throw error;
  } finally {
    client.release();
  }
}
