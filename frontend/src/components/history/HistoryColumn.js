import React, { useState, useEffect } from 'react';
import './HistoryColumn.css';
import grpTopicAvatarTurnService from '../../services/grpTopicAvatarTurns/grpTopicAvatarTurnService';
import { useAuth } from '../../services/auth/authContext';

const HistoryColumn = ({ selectedTopicId, selectedTopicName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load messages when topic changes
  useEffect(() => {
    const loadTopicHistory = async () => {
      if (!selectedTopicId) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('📜 HISTORY: Loading messages for topic ID:', selectedTopicId);
        const topicMessages = await grpTopicAvatarTurnService.getTurnsByTopicId(selectedTopicId);
        
        // Sort messages by timestamp in descending order (most recent first)
        const sortedMessages = (topicMessages || []).sort((a, b) => {
          const dateA = new Date(a.timestamp || a.created_at);
          const dateB = new Date(b.timestamp || b.created_at);
          return dateB - dateA; // Descending order
        });
        
        console.log(`📜 HISTORY: Loaded ${sortedMessages.length} messages`);
        setMessages(sortedMessages);
      } catch (err) {
        console.error('📜 HISTORY: Error loading topic history:', err);
        setError('Failed to load topic history');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTopicHistory();
  }, [selectedTopicId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getMessageTypeDisplay = (message) => {
    // Determine message type based on various fields
    if (message.isFile || message.fileId) return 'File Upload';
    if (message.turn_kind_id === 3 || message.isComment) return 'Comment';
    if (message.isUser || message.message_type_id === 1) return 'Prompt';
    return 'Response';
  };

  const getMessageTypeClass = (message) => {
    if (message.isFile || message.fileId) return 'file-message';
    if (message.turn_kind_id === 3 || message.isComment) return 'comment-message';
    if (message.isUser || message.message_type_id === 1) return 'user-message';
    return 'ai-message';
  };

  const getAuthorName = (message) => {
    if (message.isSystem) return 'System';
    if (message.isUser || message.message_type_id === 1) {
      return message.participantName || message.author || user?.username || 'You';
    }
    return message.llmName || message.author || 'AI Assistant';
  };

  const handleShowRelated = (messageId) => {
    console.log('📜 HISTORY: Show related clicked for message:', messageId);
    // TODO: Implement related messages functionality
    // This will requery the related messages column
  };

  const handleAddComment = (messageId) => {
    console.log('📜 HISTORY: Add comment clicked for message:', messageId);
    // TODO: Implement comment functionality
    // This will open a text area to add a comment
  };

  const truncateContent = (content, maxLength = 200) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!selectedTopicId) {
    return (
      <div className="history-column">
        <div className="column-header">
          <h3>📜 History</h3>
        </div>
        <div className="column-placeholder">
          <div className="column-indicator">
            <div className="dot">📜</div>
            <p>Select a topic to view its history</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-column">
      <div className="column-header">
        <h3>📜 History</h3>
        <div className="topic-info">
          <span className="topic-name">{selectedTopicName}</span>
          <span className="message-count">({messages.length} items)</span>
        </div>
      </div>

      <div className="history-content">
        {isLoading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading topic history...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No messages in this topic yet</p>
          </div>
        )}

        {!isLoading && !error && messages.length > 0 && (
          <div className="messages-list">
            {messages.map((message, index) => (
              <div key={message.id || index} className={`history-message ${getMessageTypeClass(message)}`}>
                <div className="message-header">
                  <div className="message-meta">
                    <span className="message-type">{getMessageTypeDisplay(message)}</span>
                    <span className="message-author">{getAuthorName(message)}</span>
                  </div>
                  <div className="message-timestamp">
                    {formatTimestamp(message.timestamp || message.created_at)}
                  </div>
                </div>

                <div className="message-content">
                  {message.isFile || message.fileId ? (
                    <div className="file-content">
                      <span className="file-icon">📎</span>
                      <span className="file-name">{message.content || 'Uploaded file'}</span>
                    </div>
                  ) : (
                    <div className="text-content">
                      {truncateContent(message.content)}
                      {message.content && message.content.length > 200 && (
                        <button className="expand-btn">Show more</button>
                      )}
                    </div>
                  )}
                </div>

                <div className="message-actions">
                  <button 
                    className="action-btn show-related-btn"
                    onClick={() => handleShowRelated(message.id)}
                    disabled={!message.id}
                  >
                    🔗 Show related
                  </button>
                  <button 
                    className="action-btn comment-btn"
                    onClick={() => handleAddComment(message.id)}
                    disabled={!message.id}
                  >
                    💬 Comment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryColumn;