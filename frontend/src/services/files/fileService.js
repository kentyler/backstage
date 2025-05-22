/**
 * @file src/services/files/fileService.js
 * @description Service for handling file uploads and file-related operations
 */

/**
 * Uploads a file to the server
 * @param {FormData} formData - FormData object containing the file to upload
 * @param {Object} options - Additional options for the upload
 * @param {number} [options.topicPathId] - Optional topic path ID to associate with the file
 * @param {number} [options.avatarId] - Optional avatar ID to associate with the file
 * @returns {Promise<Object>} The server response with file details
 */
const uploadFile = async (formData, { topicId, topicPathId, avatarId, turnIndex } = {}) => {
  try {
    // Add any additional metadata to the form data
    if (topicId) {
      formData.append('topicId', topicId);
    } else if (topicPathId) {
      // For backward compatibility
      formData.append('topicId', topicPathId);
    }
    if (avatarId) {
      formData.append('avatarId', avatarId);
    }
    if (turnIndex !== undefined) {
      formData.append('turnIndex', turnIndex);
    }

    const response = await fetch('/api/file-uploads', {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
      body: formData, // Don't set Content-Type header, let the browser set it with the correct boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fileService.uploadFile:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
};

/**
 * Deletes a file from the server
 * @param {number} fileId - The ID of the file to delete
 * @returns {Promise<Object>} The server response
 */
const deleteFile = async (fileId) => {
  try {
    const response = await fetch(`/api/file-uploads/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fileService.deleteFile:', error);
    throw error;
  }
};

const fileService = {
  uploadFile,
  deleteFile,
};

export default fileService;
