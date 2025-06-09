import React, { useState, useEffect } from 'react';

/**
 * Topic Item Component
 * Displays a single topic with edit/delete options
 */
const TopicItem = ({ 
  topic, 
  name, 
  fullPath, 
  hasChildren, 
  isEditing, 
  onStartEdit, 
  onCancelEdit, 
  onSaveEdit, 
  onDelete,
  onTopicSelect,
  depth = 0
}) => {
  const [editPath, setEditPath] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset edit path when editing changes
  useEffect(() => {
    if (isEditing && topic) {
      setEditPath(topic.path);
    }
  }, [isEditing, topic]);

  const handleSave = async () => {
    if (!editPath.trim() || !topic) {
      return;
    }

    setLoading(true);
    try {
      await onSaveEdit(topic.id, editPath.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (topic) {
      onDelete(topic.id);
    }
  };

  const handleTopicSelect = () => {
    if (topic && onTopicSelect) {
      onTopicSelect(topic.id, topic.path);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const formatCreatedDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // For path segments that don't have a topic (intermediate paths), show as read-only
  if (!topic) {
    return (
      <div className="topic-item intermediate">
        <div className="topic-display">
          <div className="topic-info">
            <div className="topic-name">{name}</div>
            <div className="topic-meta">
              <span className="topic-path">Path: {fullPath}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-item">
      <div className="topic-main">
        {isEditing ? (
          <div className="topic-edit">
            <input
              type="text"
              value={editPath}
              onChange={(e) => setEditPath(e.target.value)}
              onKeyPress={handleKeyPress}
              className="topic-edit-input"
              disabled={loading}
              autoFocus
              maxLength={255}
            />
            <div className="topic-edit-actions">
              <button 
                onClick={handleSave}
                disabled={loading || !editPath.trim()}
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
          <div className="topic-display">
            <div className="topic-info">
              <div className="topic-name">
                {hasChildren ? '📁' : '📄'} {name}
              </div>
              <div className="topic-meta">
                <span className="topic-id">ID: {topic.id}</span>
                <span className="topic-path">Path: {topic.path}</span>
                {topic.created_on && (
                  <span className="topic-created">Created: {formatCreatedDate(topic.created_on)}</span>
                )}
                {topic.created_by && (
                  <span className="topic-created-by">By: {topic.created_by}</span>
                )}
              </div>
            </div>
            <div className="topic-actions">
              <button 
                onClick={handleTopicSelect}
                className="select-button"
                title="Select topic for prompting"
              >
                💬
              </button>
              <button 
                onClick={() => onStartEdit(topic.id)}
                className="edit-button"
                title="Edit topic path"
              >
                ✏️
              </button>
              <button 
                onClick={handleDelete}
                className="delete-button"
                title="Delete topic"
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

export default TopicItem;