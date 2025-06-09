import React, { useState } from 'react';

/**
 * Create Topic Form Component
 * Handles creation of new topic paths with validation
 */
const CreateTopicForm = ({ onSubmit, onCancel, loading = false }) => {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate path
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      setError('Topic path is required');
      return;
    }

    // Basic validation for topic path format
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmedPath)) {
      setError('Topic path can only contain letters, numbers, dots, hyphens, and underscores');
      return;
    }

    // Clear any previous errors
    setError('');
    
    // Call the parent submit handler
    onSubmit(trimmedPath);
  };

  const handlePathChange = (e) => {
    setPath(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-topic-form">
      <div className="form-group">
        <label htmlFor="topic-path">Topic Path:</label>
        <input
          id="topic-path"
          type="text"
          value={path}
          onChange={handlePathChange}
          onKeyDown={handleKeyPress}
          placeholder="e.g., Bible-Study.Chapter-1"
          className="topic-path-input"
          disabled={loading}
          autoFocus
          maxLength={255}
        />
        <div className="path-help">
          Use dots to create hierarchy: "Parent.Child.Grandchild"
        </div>
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div className="form-actions">
        <button 
          type="submit" 
          disabled={loading || !path.trim()}
          className="create-button"
        >
          {loading ? 'Creating...' : 'Create Topic'}
        </button>
        <button 
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateTopicForm;