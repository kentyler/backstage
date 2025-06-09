import React, { useState, useEffect } from 'react';

/**
 * Group Item Component
 * Displays a single group with edit/delete options
 */
const GroupItem = ({ 
  group, 
  isEditing, 
  onStartEdit, 
  onCancelEdit, 
  onSaveEdit, 
  onDelete, 
  currentParticipantId 
}) => {
  const [editName, setEditName] = useState(group.name);
  const [loading, setLoading] = useState(false);

  // Reset edit name when editing changes
  useEffect(() => {
    if (isEditing) {
      setEditName(group.name);
    }
  }, [isEditing, group.name]);

  const handleSave = async () => {
    if (!editName.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSaveEdit(group.id, editName.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    onDelete(group.id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="group-item">
      <div className="group-main">
        {isEditing ? (
          <div className="group-edit">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="group-edit-input"
              disabled={loading}
              autoFocus
              maxLength={255}
            />
            <div className="group-edit-actions">
              <button 
                onClick={handleSave}
                disabled={loading || !editName.trim()}
                className="save-button"
              >
                {loading ? '...' : '✓'}
              </button>
              <button 
                onClick={onCancelEdit}
                disabled={loading}
                className="cancel-button"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="group-display">
            <div className="group-info">
              <div className="group-name">{group.name}</div>
              <div className="group-meta">
                <span className="group-id">ID: {group.id}</span>
                <span className="group-created">Created: {formatDate(group.created_at)}</span>
              </div>
            </div>
            <div className="group-actions">
              <button 
                onClick={() => onStartEdit(group.id)}
                className="edit-button"
                title="Edit group name"
              >
                ✏️
              </button>
              <button 
                onClick={handleDelete}
                className="delete-button"
                title="Delete group"
              >
                🗑️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupItem;