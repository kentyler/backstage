import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../services/files';

/**
 * FileUploadManager Component
 * 
 * Handles all file upload operations including:
 * - File selection and validation
 * - Upload progress and status
 * - File deletion
 * - Error handling
 */
const FileUploadManager = ({ 
  file, 
  setFile, 
  deletingFileId, 
  setDeletingFileId,
  onFileUploadComplete 
}) => {
  const fileInputRef = useRef(null);

  /**
   * Handle file selection from input
   */
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    console.log('File selected:', selectedFile.name, selectedFile.size);

    // Create file upload object with initial status
    const fileUpload = {
      id: `temp-${Date.now()}`,
      filename: selectedFile.name,
      file_size: selectedFile.size,
      status: 'uploading',
      upload_progress: 0,
      actualFile: selectedFile
    };

    setFile(fileUpload);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Starting file upload...');
      
      // Upload the file
      const response = await fetch('/api/file-uploads/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'File upload failed');
      }

      const uploadedFile = await response.json();
      console.log('File uploaded successfully:', uploadedFile);

      // Update file state with server response
      const completeFileUpload = {
        ...uploadedFile,
        status: 'uploaded',
        upload_progress: 100
      };

      setFile(completeFileUpload);
      
      // Notify parent component
      if (onFileUploadComplete) {
        onFileUploadComplete(completeFileUpload);
      }

    } catch (error) {
      console.error('File upload error:', error);
      
      // Update file state with error
      setFile(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message
      } : null);
    }
  };

  /**
   * Delete an uploaded file
   */
  const handleDeleteFile = async (fileId) => {
    console.log('Deleting file:', fileId);
    setDeletingFileId(fileId);

    try {
      const response = await fetch(`/api/file-uploads/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      console.log('File deleted successfully');
      
      // Clear the file from state if it matches the deleted file
      setFile(prev => prev && prev.id === fileId ? null : prev);

    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Error deleting file: ${error.message}`);
    } finally {
      setDeletingFileId(null);
    }
  };

  /**
   * Clear selected file
   */
  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Render file upload section
   */
  const renderFileUpload = () => {
    if (!file) {
      return (
        <div className="file-upload-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".txt,.pdf,.csv,.json,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="file-upload-btn"
          >
            📎 Attach File
          </button>
        </div>
      );
    }

    return (
      <div className="file-preview">
        <div className="file-info">
          <span className="file-name">{file.filename}</span>
          <span className="file-size">
            ({(file.file_size / 1024).toFixed(1)} KB)
          </span>
        </div>
        
        <div className="file-status">
          {file.status === 'uploading' && (
            <div className="upload-progress">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Uploading...</span>
            </div>
          )}
          
          {file.status === 'uploaded' && (
            <div className="upload-success">
              <span className="success-icon">✓</span>
              <span>Uploaded</span>
            </div>
          )}
          
          {file.status === 'error' && (
            <div className="upload-error">
              <span className="error-icon">✗</span>
              <span>Error: {file.error}</span>
            </div>
          )}
        </div>

        <div className="file-actions">
          {file.status === 'uploaded' && (
            <button
              type="button"
              onClick={() => handleDeleteFile(file.id)}
              disabled={deletingFileId === file.id}
              className="delete-file-btn"
            >
              {deletingFileId === file.id ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faTimes} />
              )}
            </button>
          )}
          
          {file.status !== 'uploading' && (
            <button
              type="button"
              onClick={clearFile}
              className="clear-file-btn"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  };

  return renderFileUpload();
};

export default FileUploadManager;