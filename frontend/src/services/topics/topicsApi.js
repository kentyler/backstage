/**
 * Topic paths API service
 */

/**
 * Fetch all topic paths sorted by path
 * @returns {Promise<Array>} Sorted array of topic paths
 */
export const fetchTopicPaths = async () => {
  try {
    const response = await fetch('/api/topic-paths', {
      credentials: 'include', // Important for session cookies
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch topic paths');
    }

    const data = await response.json();
    return data.sort((a, b) => a.path.localeCompare(b.path));
  } catch (error) {
    console.error('Error fetching topic paths:', error);
    throw error;
  }
};

/**
 * Create a new topic path
 * @param {string} path - The path to create
 * @returns {Promise<Object>} The created topic path
 */
export async function createTopicPath(path) {
  try {
    const response = await fetch('/api/topic-paths', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create topic path');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating topic path:', error);
    throw error;
  }
}

/**
 * Delete a topic path
 * @param {string} path - The path to delete
 * @returns {Promise<Object>} The deleted topic path
 */
export async function deleteTopicPath(path) {
  try {
    const response = await fetch(`/api/topic-paths/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete topic path');
    }

    return response.json();
  } catch (error) {
    console.error('Error deleting topic path:', error);
    throw error;
  }
}

/**
 * Update a topic path
 * @param {string} oldPath - The old path to update
 * @param {string} newPath - The new path to update to
 * @returns {Promise<Object>} The updated topic path
 */
export async function updateTopicPath(oldPath, newPath) {
  try {
    const response = await fetch(`/api/topic-paths/${encodeURIComponent(oldPath)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPath }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update topic path');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating topic path:', error);
    throw error;
  }
}
