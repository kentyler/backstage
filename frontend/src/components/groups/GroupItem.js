import React, { useState, useEffect } from 'react';

/**
 * Group Item Component
 * Displays a single group with edit/delete options and selection
 */
const GroupItem = ({ 
  group, 
  isEditing, 
  isSelected,
  onSelect,
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

  const handleSelect = () => {
    console.log('🏢 GROUP ITEM: handleSelect called with group:', group);
    if (onSelect) {
      console.log('🏢 GROUP ITEM: Calling onSelect with:', { 
        id: group.id, 
        idType: typeof group.id,
        name: group.name, 
        nameType: typeof group.name 
      });
      onSelect(group.id, group.name);
    }
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
    <div className={`group-item ${isSelected ? 'selected' : ''}`}>
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
          <div className="group-display" onClick={handleSelect} style={{ cursor: 'pointer' }}>
            <div className="group-info">
              <div className="group-name">
                {isSelected ? '📂' : '📁'} {group.name}
                {isSelected && <span className="selected-indicator"> ✓</span>}
              </div>
              <div className="group-meta">
                <span className="group-id">{group.id}</span>
                <span className="group-created">Created: {formatDate(group.created_at)}</span>
              </div>
            </div>
            <div className="group-actions">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(group.id);
                }}
                className="edit-button"
                title="Edit group name"
              >
                ✏️
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
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