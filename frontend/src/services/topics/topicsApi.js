/**
 * Topic paths API service
 */

/**
 * Fetch all topic paths sorted by path
 * @returns {Promise<Array>} Sorted array of topic paths
 */
// Ensure we're targeting the backend server (port 5000) not the frontend server (port 3000)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchTopicPaths = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/topics`, {
      credentials: 'include', // Important for session cookies
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch topic paths');
    }

    const data = await response.json();
    // Sort by index instead of alphabetically to maintain the order topics were added
    return data.sort((a, b) => a.index - b.index);
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
    const response = await fetch(`${API_BASE_URL}/api/topics`, {
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
    const response = await fetch(`${API_BASE_URL}/api/topics/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      // Only try to parse as JSON if there's a response body
      const errorText = await response.text();
      let errorData;
      try {
        errorData = errorText ? JSON.parse(errorText) : {};
      } catch (e) {
        errorData = { error: errorText || 'Unknown error' };
      }
      throw new Error(errorData.error || 'Failed to delete topic path');
    }

    // For 204 No Content, return null instead of trying to parse JSON
    if (response.status === 204) {
      return null;
    }
    
    // For other success statuses, try to parse JSON
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
    const response = await fetch(`${API_BASE_URL}/api/topics/${encodeURIComponent(oldPath)}`, {
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

/**
 * Set the current topic preference for the logged-in participant
 * @param {number} topicId - The numeric ID of the selected topic
 * @returns {Promise<Object>} The created preference
 */
export async function setCurrentTopicPreference(topicId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/preferences/topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topicId }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set topic preference');
    }

    return response.json();
  } catch (error) {
    console.error('Error setting topic preference:', error);
    throw error;
  }
}

/**
 * Get the current (most recent) topic preference for the logged-in participant
 * @returns {Promise<Object|null>} The current topic preference or null if none exists
 */
export async function getCurrentTopicPreference() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/preferences/current-topic`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get current topic preference');
    }

    const data = await response.json();
    return data.currentTopic || null;
  } catch (error) {
    console.error('Error getting current topic preference:', error);
    throw error;
  }
}
