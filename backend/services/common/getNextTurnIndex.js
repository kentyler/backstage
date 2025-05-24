/**
 * @file services/common/getNextTurnIndex.js
 * @description Utility to get the next available turn index for a topic
 */

/**
 * Gets the next sequential turn index for a topic
 * @param {number} topicId - The ID of the topic
 * @param {Object} pool - Database connection pool
 * @returns {Promise<number>} The next available turn index
 */
export async function getNextTurnIndex(topicId, pool) {
  if (!topicId || isNaN(parseInt(topicId))) {
    throw new Error(`Invalid topic ID: ${topicId}`);
  }

  const numericTopicId = parseInt(topicId, 10);
  
  try {
    // Use COALESCE to handle null cases more elegantly
    const indexQuery = `
      SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index 
      FROM grp_topic_avatar_turns 
      WHERE topic_id = $1
    `;
    const result = await pool.query(indexQuery, [numericTopicId]);
    
    const nextIndex = result.rows[0].next_index;
    console.log(`Next turn index for topic ${numericTopicId}: ${nextIndex}`);
    
    return nextIndex;
  } catch (error) {
    console.error('Error getting next turn index:', error);
    throw error;
  }
}
