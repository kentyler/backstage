/**
 * @file services/fileUploads/getNextTurnIndex.js
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
    // Query to find the highest turn_index for this topic
    const indexQuery = `
      SELECT MAX(turn_index) as max_index 
      FROM participant_topic_turns 
      WHERE topic_id = $1
    `;
    const indexResult = await pool.query(indexQuery, [numericTopicId]);
    
    let turnIndex = 1; // Default to 1 if no turns exist
    
    if (indexResult.rows[0] && indexResult.rows[0].max_index !== null) {
      const currentMax = parseFloat(indexResult.rows[0].max_index);
      // Increment by 1 from the current max index
      turnIndex = currentMax + 1;
      console.log(`Using next sequential index: ${turnIndex} (current max: ${currentMax})`);
    } else {
      console.log(`No existing turns found, starting at index: ${turnIndex}`);
    }
    
    return turnIndex;
  } catch (error) {
    console.error('Error getting next turn index:', error);
    throw error;
  }
}
