import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth/authContext';
import { getTopicPaths, createTopicPath, updateTopicPath, deleteTopicPath } from '../../services/topics/topicsApi';
import CreateTopicForm from './CreateTopicForm';
import TopicList from './TopicList';
import './TopicsColumn.css';

/**
 * Topics Column Component
 * Displays hierarchical topic paths for the selected group
 * Only visible when a group is selected
 */
const TopicsColumn = ({ selectedGroupId, selectedGroupName, onTopicSelect }) => {
  const { isAuthenticated, participantId } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);

  // Load topics when component mounts or selected group changes
  useEffect(() => {
    if (selectedGroupId) {
      loadTopics();
    } else {
      setTopics([]);
    }
  }, [selectedGroupId]);

  const loadTopics = async () => {
    if (!selectedGroupId) return;
    
    console.log('📚 TOPICS: LoadTopics called with selectedGroupId:', selectedGroupId, 'type:', typeof selectedGroupId);
    
    setLoading(true);
    setError(null);
    try {
      console.log('📚 TOPICS: Loading topics for group', selectedGroupId);
      const topicsData = await getTopicPaths(selectedGroupId);
      setTopics(topicsData);
      console.log('📚 TOPICS: Loaded', topicsData.length, 'topics');
    } catch (err) {
      console.error('📚 TOPICS: Failed to load topics:', err);
      setError(err.message || 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (path) => {
    if (!selectedGroupId || !participantId) return;
    
    try {
      console.log('📚 TOPICS: Creating topic', { path, groupId: selectedGroupId });
      const newTopic = await createTopicPath(path, selectedGroupId, participantId);
      console.log('📚 TOPICS: Created topic:', newTopic);
      
      // Reload topics to get updated list
      await loadTopics();
      setShowCreateForm(false);
    } catch (err) {
      console.error('📚 TOPICS: Failed to create topic:', err);
      setError(err.message || 'Failed to create topic');
    }
  };

  const handleUpdateTopic = async (topicId, newPath) => {
    if (!selectedGroupId) return;
    
    try {
      // Find the topic to get its old path
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;
      
      console.log('📚 TOPICS: Updating topic', { id: topicId, oldPath: topic.path, newPath, groupId: selectedGroupId });
      await updateTopicPath(topic.path, newPath, selectedGroupId);
      console.log('📚 TOPICS: Updated topic successfully');
      
      // Reload topics to get updated list
      await loadTopics();
      setEditingTopicId(null);
    } catch (err) {
      console.error('📚 TOPICS: Failed to update topic:', err);
      setError(err.message || 'Failed to update topic');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!selectedGroupId) return;
    
    try {
      // Find the topic to get its path
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;
      
      console.log('📚 TOPICS: Deleting topic', { id: topicId, path: topic.path, groupId: selectedGroupId });
      await deleteTopicPath(topic.path, selectedGroupId);
      console.log('📚 TOPICS: Deleted topic successfully');
      
      // Reload topics to get updated list
      await loadTopics();
    } catch (err) {
      console.error('📚 TOPICS: Failed to delete topic:', err);
      setError(err.message || 'Failed to delete topic');
    }
  };

  const handleStartEdit = (topicId) => {
    setEditingTopicId(topicId);
  };

  const handleCancelEdit = () => {
    setEditingTopicId(null);
  };

  const dismissError = () => {
    setError(null);
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show placeholder if no group selected
  if (!selectedGroupId) {
    return (
      <div className="topics-column">
        <div className="topics-header">
          <h3>📚 Topics</h3>
        </div>
        <div className="topics-placeholder">
          <div className="placeholder-text">
            Select a group to view its topics
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topics-column">
      <div className="topics-header">
        <h3>📚 Topics</h3>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          className="create-topic-toggle"
          title="Create new topic"
        >
          {showCreateForm ? '✕' : '+'}
        </button>
      </div>

      <div className="topics-group-info">
        <small>Group: <strong>{selectedGroupName}</strong></small>
      </div>

      {error && (
        <div className="topics-error">
          <span>{error}</span>
          <button onClick={dismissError} className="error-dismiss">✕</button>
        </div>
      )}

      {showCreateForm && (
        <CreateTopicForm 
          onSubmit={handleCreateTopic}
          onCancel={() => setShowCreateForm(false)}
          loading={loading}
        />
      )}

      <div className="topics-content">
        {loading ? (
          <div className="topics-loading">Loading topics...</div>
        ) : topics.length === 0 ? (
          <div className="topics-empty">
            <div className="empty-icon">📚</div>
            <div className="empty-message">No topics yet</div>
            <div className="empty-subtitle">Create your first topic to get started</div>
          </div>
        ) : (
          <TopicList 
            topics={topics}
            editingTopicId={editingTopicId}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleUpdateTopic}
            onDelete={handleDeleteTopic}
            onTopicSelect={onTopicSelect}
          />
        )}
      </div>

      <div className="topics-status">
        <div className="status-item">
          📥 Group: <strong>{selectedGroupName}</strong>
        </div>
        <div className="status-item">
          📚 Topics count: <strong>{topics.length}</strong>
        </div>
      </div>
    </div>
  );
};

export default TopicsColumn;