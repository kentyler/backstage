/**
 * Topics API Service
 * Handles all API calls related to topic paths
 */

const API_BASE = '/api/topic-paths';

/**
 * Get all topic paths for a specific group
 * @param {number} groupId - The group ID to get topics for
 * @returns {Promise<Array>} Array of topic path objects
 */
export const getTopicPaths = async (groupId) => {
  console.log('📚 TOPICS API: Fetching topics for group', groupId);
  
  const response = await fetch(`${API_BASE}?group_id=${groupId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('📚 TOPICS API: Get topics failed:', errorData);
    throw new Error(`Failed to fetch topics: ${response.status}`);
  }

  const data = await response.json();
  console.log('📚 TOPICS API: Raw response data:', data);
  console.log('📚 TOPICS API: data.topics:', data.topics);
  console.log('📚 TOPICS API: Final return value:', data.topics || data);
  return data.topics || data;
};

/**
 * Create a new topic path
 * @param {string} path - The topic path to create
 * @param {number} groupId - The group ID the topic belongs to
 * @param {number} participantId - The participant creating the topic
 * @returns {Promise<Object>} Created topic path object
 */
export const createTopicPath = async (path, groupId, participantId) => {
  console.log('📚 TOPICS API: Creating topic', { path, groupId, participantId });
  
  const response = await fetch(API_BASE, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      group_id: groupId,
      participant_id: participantId
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('📚 TOPICS API: Create topic failed:', errorData);
    throw new Error(`Failed to create topic: ${response.status}`);
  }

  const data = await response.json();
  console.log('📚 TOPICS API: Created topic:', data);
  return data.topic || data;
};

/**
 * Update an existing topic path
 * @param {string} oldPath - The current path to update
 * @param {string} newPath - The new path
 * @param {number} groupId - The group ID the topic belongs to
 * @returns {Promise<Object>} Updated topic path object
 */
export const updateTopicPath = async (oldPath, newPath, groupId) => {
  console.log('📚 TOPICS API: Updating topic', { oldPath, newPath, groupId });
  
  const response = await fetch(API_BASE, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      old_path: oldPath,
      new_path: newPath,
      group_id: groupId
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('📚 TOPICS API: Update topic failed:', errorData);
    throw new Error(`Failed to update topic: ${response.status}`);
  }

  const data = await response.json();
  console.log('📚 TOPICS API: Updated topic:', data);
  return data;
};

/**
 * Delete a topic path and its descendants
 * @param {string} path - The topic path to delete
 * @param {number} groupId - The group ID the topic belongs to
 * @returns {Promise<Object>} Deletion result
 */
export const deleteTopicPath = async (path, groupId) => {
  console.log('📚 TOPICS API: Deleting topic', { path, groupId });
  
  const response = await fetch(API_BASE, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      group_id: groupId
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('📚 TOPICS API: Delete topic failed:', errorData);
    throw new Error(`Failed to delete topic: ${response.status}`);
  }

  const data = await response.json();
  console.log('📚 TOPICS API: Deleted topic:', data);
  return data;
};