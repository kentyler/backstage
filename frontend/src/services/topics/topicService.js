/**
 * @file src/services/topicService.js
 * @description Service for managing topic-related operations
 */

// Use relative URL to work in all environments
const API_BASE_URL = '';

/**
 * Fetches conversation messages for a topic using its numeric ID
 * @param {number} topicId - The numeric ID of the topic
 * @returns {Promise<Array>} Array of conversation messages
 */
export async function getMessagesByTopicId(topicId) {
  if (!topicId) {
    throw new Error('topicId is required');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/topic-paths/id/${encodeURIComponent(topicId)}`, {
      credentials: 'include' // Important for session cookies
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch topic history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching messages by topic ID:', error);
    throw error;
  }
}

// Legacy getMessagesByTopicPath function has been removed as part of migration to numeric IDs

export default {
  getMessagesByTopicId
};
