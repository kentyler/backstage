import React, { useState } from 'react';

/**
 * Create Group Form Component
 * Handles creating new groups with validation
 */
const CreateGroupForm = ({ onCreateGroup, onCancel }) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateGroup(groupName.trim());
      setGroupName('');
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="groupName">Group Name</label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            disabled={loading}
            className="group-name-input"
            maxLength={255}
          />
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !groupName.trim()}
            className="create-button"
          >
            {loading ? 'Creating...' : 'Create Group'}
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
    </div>
  );
};

export default CreateGroupForm;