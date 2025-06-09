/**
 * @file services/groups/groupsApi.js
 * @description API service functions for groups domain
 */

/**
 * Get all groups for the current client
 * @returns {Promise<Array>} Array of group objects
 */
export const getGroups = async () => {
  console.log('🏢 GROUPS API: Fetching groups');
  
  try {
    const response = await fetch('/api/groups', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success) {
      console.log('🏢 GROUPS API: Groups fetched successfully', { count: data.groups.length });
      return data.groups;
    } else {
      throw new Error(data.message || 'Failed to fetch groups');
    }
  } catch (error) {
    console.error('🏢 GROUPS API: Error fetching groups:', error);
    throw error;
  }
};

/**
 * Create a new group
 * @param {string} name - The name of the group
 * @returns {Promise<Object>} Created group object
 */
export const createGroup = async (name) => {
  console.log('🏢 GROUPS API: Creating group', { name });
  
  try {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('🏢 GROUPS API: Group created successfully', data.group);
      return data.group;
    } else {
      throw new Error(data.message || 'Failed to create group');
    }
  } catch (error) {
    console.error('🏢 GROUPS API: Error creating group:', error);
    throw error;
  }
};

/**
 * Update a group
 * @param {number} groupId - The ID of the group to update
 * @param {string} name - The new name for the group
 * @returns {Promise<Object>} Updated group object
 */
export const updateGroup = async (groupId, name) => {
  console.log('🏢 GROUPS API: Updating group', { groupId, name });
  
  try {
    const response = await fetch(`/api/groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('🏢 GROUPS API: Group updated successfully', data.group);
      return data.group;
    } else {
      throw new Error(data.message || 'Failed to update group');
    }
  } catch (error) {
    console.error('🏢 GROUPS API: Error updating group:', error);
    throw error;
  }
};

/**
 * Delete a group
 * @param {number} groupId - The ID of the group to delete
 * @returns {Promise<boolean>} True if successful
 */
export const deleteGroup = async (groupId) => {
  console.log('🏢 GROUPS API: Deleting group', { groupId });
  
  try {
    const response = await fetch(`/api/groups/${groupId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.status === 204) {
      console.log('🏢 GROUPS API: Group deleted successfully');
      return true;
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete group');
    }
  } catch (error) {
    console.error('🏢 GROUPS API: Error deleting group:', error);
    throw error;
  }
};

/**
 * Get participants in a group
 * @param {number} groupId - The ID of the group
 * @returns {Promise<Array>} Array of participant objects
 */
export const getGroupParticipants = async (groupId) => {
  console.log('🏢 GROUPS API: Fetching group participants', { groupId });
  
  try {
    const response = await fetch(`/api/groups/${groupId}/participants`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success) {
      console.log('🏢 GROUPS API: Group participants fetched successfully', { 
        groupId, 
        count: data.participants.length 
      });
      return data.participants;
    } else {
      throw new Error(data.message || 'Failed to fetch group participants');
    }
  } catch (error) {
    console.error('🏢 GROUPS API: Error fetching group participants:', error);
    throw error;
  }
};

/**
 * Add a participant to a group
 * @param {number} groupId - The ID of the group
 * @param {number} participantId - The ID of the participant to add
 * @param {number} [roleId=1] - The role ID for the participant
 * @returns {Promise<Object>} Membership record
 */
export const addParticipantToGroup = async (groupId, participantId, roleId = 1) => {
  console.log('🏢 GROUPS API: Adding participant to group', { groupId, participantId, roleId });
  
  try {
    const response = await fetch(`/api/groups/${groupId}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        participant_id: participantId, 
        participant_role_id: roleId 
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('🏢 GROUPS API: Participant added to group successfully', data.membership);
      return data.membership;
    } else {
      throw new Error(data.message || 'Failed to add participant to group');
    }
  } catch (error) {
    console.error('🏢 GROUPS API: Error adding participant to group:', error);
    throw error;
  }
};

/**
 * Remove a participant from a group
 * @param {number} groupId - The ID of the group
 * @param {number} participantId - The ID of the participant to remove
 * @returns {Promise<boolean>} True if successful
 */
export const removeParticipantFromGroup = async (groupId, participantId) => {
  console.log('🏢 GROUPS API: Removing participant from group', { groupId, participantId });
  
  try {
    const response = await fetch(`/api/groups/${groupId}/participants/${participantId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success) {
      console.log('🏢 GROUPS API: Participant removed from group successfully');
      return true;
    } else {
      throw new Error(data.message || 'Failed to remove participant from group');
    }
  } catch (error) {
    console.error('🏢 GROUPS API: Error removing participant from group:', error);
    throw error;
  }
};