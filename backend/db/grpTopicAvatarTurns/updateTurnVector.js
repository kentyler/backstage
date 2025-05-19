// src/db/grpTopicAvatarTurns/updateTurnVector.js
import { pool } from '../connection.js';
const { query } = pool;

/**
 * Updates the vector representation of a turn
 * 
 * @param {number} turnId - The ID of the turn to update
 * @param {Array} contentVector - The vector representation of the content
 * @param {Object} client - The database client to use (optional)
 * @returns {Promise<Object>} The updated turn
 */
export async function updateTurnVector(turnId, contentVector, client = null) {
  if (!turnId) {
    throw new Error('Turn ID is required');
  }
  
  if (!contentVector || !Array.isArray(contentVector)) {
    throw new Error('Content vector must be an array');
  }
  
  let useLocalClient = false;
  let localClient = client;
  
  try {
    // If no client provided, get one from the pool
    if (!localClient) {
      useLocalClient = true;
      localClient = await pool.connect();
    }
    
    // Convert vector to JSON string if needed
    const vectorValue = typeof contentVector === 'string' 
      ? contentVector 
      : JSON.stringify(contentVector);
    
    // Update the turn with the new vector
    const result = await localClient.query(
      `UPDATE grp_topic_avatar_turns 
       SET content_vector = $1 
       WHERE id = $2
       RETURNING id, topicpathid, avatar_id, turn_index, content_text, created_at, message_type_id, turn_kind_id`,
      [vectorValue, turnId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating turn vector:', error);
    throw error;
  } finally {
    // Release the client if we created it locally
    if (useLocalClient && localClient) {
      localClient.release();
    }
  }
}
