/**
 * Search service for finding similar messages
 */

/**
 * Find messages similar to the given text
 * @param {string} text - The text to find similar messages for
 * @param {string} excludeTopicPath - Topic path to exclude from results
 * @returns {Promise<Array>} - Array of similar messages
 */
export async function findSimilarMessages(text, excludeTopicPath) {
  try {
    const response = await fetch('/api/search/similar-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        excludeTopicPath
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to find similar messages');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error in findSimilarMessages:', error);
    throw error;
  }
}
