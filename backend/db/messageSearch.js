import { pool } from './connection.js';

/**
 * Find similar messages using vector similarity search
 * @param {number[]} embedding - The embedding vector to compare against
 * @param {number} topicId - Current topic ID
 * @param {number} limit - Maximum number of results to return
 * @param {number} [currentMessageId=null] - ID of the current message to exclude
 * @returns {Promise<Array>} - Array of similar messages with their topic paths
 */
export async function findSimilarMessages(embedding, topicId, limit = 10, currentMessageId = null) {
  const client = await pool.connect();
  try {
    console.log('Searching for similar messages with params:', {
      topicId,
      currentMessageId,
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
    console.log('Running vector similarity query with topicId:', topicId, 'and excluding messageId:', currentMessageId);

    const query = `
      WITH similar_messages AS (
        SELECT 
          m.id,
          m.content_text as content,
          m.topic_id as "topicId",
          tp.path::text as "topicPath",
          m.created_at as "createdAt",
          m.message_type_id = 1 as "isUser",
          m.content_vector <-> $1 as distance,
          m.turn_index
        FROM grp_topic_avatar_turns m
        LEFT JOIN topic_paths tp ON m.topic_id = tp.id
        WHERE (m.id != $3::integer OR $3 IS NULL)  -- Exclude only the current message instead of the entire topic
        -- We no longer filter by topic_id, allowing messages from all topics including the current one
        AND m.content_text IS NOT NULL
        AND m.content_text != ''
        AND m.content_vector IS NOT NULL
        AND m.message_type_id = 2  -- Only include assistant messages
        ORDER BY m.content_vector <-> $1
        LIMIT $2::integer
      )
      SELECT * FROM similar_messages
      WHERE distance < 0.95  -- Allow for more potential matches (less strict threshold)
      ORDER BY distance ASC;
    `;
    
    // Use currentMessageId if provided, otherwise use a placeholder value that won't match any message ID
    const messageIdToExclude = currentMessageId || -1;
    
    // Log the exact parameters being sent to the query
    console.log('Query parameters:', {
      embeddingLength: embedding?.length,
      limit: limit * 2,
      messageIdToExclude
    });
    
    // PostgreSQL expects a JSON string for the vector parameter
    const embeddingJson = JSON.stringify(embedding);
    
    // We're not using the topicId parameter in the query anymore
    const result = await client.query(query, [embeddingJson, limit * 2, messageIdToExclude]); // Get more results initially to account for filtering
    
    console.log(`Found ${result.rows.length} similar messages after filtering`);
    if (result.rows.length > 0) {
      console.log('First similar message:', {
        id: result.rows[0].id,
        content: result.rows[0].content?.substring(0, 100) + '...',
        distance: result.rows[0].distance,
        topicId: result.rows[0].topicId,
        topicPath: result.rows[0].topicPath || 'Not found in query result'
      });
      
      // Log all returned topic paths to help debug
      console.log('All topic paths from query:', result.rows.map(r => ({
        topicId: r.topicId,
        topicPath: r.topicPath
      })));
    }
    
    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      topicId: row.topicId,
      topicPath: row.topicPath || 'Unknown', // Include the human-readable topic path
      isUser: row.isUser,
      timestamp: row.createdAt,
      score: 1 - row.distance  // Convert distance to similarity score (0-1)
    }));
  } catch (error) {
    console.error('Error in findSimilarMessages:', {
      error: error.message,
      stack: error.stack,
      topicId,
      currentMessageId,
      embeddingLength: embedding?.length
    });
    
    // Enhance the error with consistent metadata for the route handler
    error.code = error.code || 'MESSAGE_SEARCH_ERROR';
    error.status = error.status || 500;
    error.context = {
      ...error.context,
      topicId,
      currentMessageId,
      operation: 'findSimilarMessages'
    };
    
    throw error;
  } finally {
    client.release();
  }
}
