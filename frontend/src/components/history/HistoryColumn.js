import React, { useState, useEffect, useCallback } from 'react';
import './HistoryColumn.css';
import grpTopicAvatarTurnService from '../../services/grpTopicAvatarTurns/grpTopicAvatarTurnService';
import { useAuth } from '../../services/auth/authContext';

const HistoryColumn = ({ selectedTopicId, selectedTopicName, onTopicSelect, onShowRelated }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentingMessageId, setCommentingMessageId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Define loadTopicHistory before using it in useEffect
  const loadTopicHistory = useCallback(async () => {
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
  }, [selectedTopicId]);

  // Load messages when topic changes
  useEffect(() => {
    loadTopicHistory();
  }, [loadTopicHistory]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getMessageTypeDisplay = (message) => {
    // Determine message type based on various fields
    if (message.isFile || message.fileId) return 'File Upload';
    if (message.turn_kind_id === 3 || message.isComment) return 'Comment';
    // For regular user and LLM messages, don't show a type label
    return '';
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
    if (onShowRelated) {
      onShowRelated(messageId);
    }
  };

  const handleAddComment = (messageId) => {
    console.log('📜 HISTORY: Add comment clicked for message:', messageId);
    if (commentingMessageId === messageId) {
      // Cancel commenting if clicking the same message
      setCommentingMessageId(null);
      setCommentText('');
    } else {
      // Start commenting on this message
      setCommentingMessageId(messageId);
      setCommentText('');
    }
  };
  
  const handleSubmitComment = async (parentMessage) => {
    if (!commentText.trim()) return;
    
    try {
      // Calculate turn_index for the comment (between this message and the next)
      const messageIndex = messages.findIndex(m => m.id === parentMessage.id);
      const currentTurnIndex = parseFloat(parentMessage.turnIndex || parentMessage.turn_index);
      let commentTurnIndex;
      
      if (messageIndex < messages.length - 1) {
        // Get the next message's turn index
        const nextMessage = messages[messageIndex + 1];
        const nextTurnIndex = parseFloat(nextMessage.turnIndex || nextMessage.turn_index);
        // Place comment halfway between current and next message
        commentTurnIndex = currentTurnIndex + (nextTurnIndex - currentTurnIndex) / 2;
      } else {
        // This is the last message, add 0.5 to its index
        commentTurnIndex = currentTurnIndex + 0.5;
      }
      
      console.log('📜 HISTORY: Submitting comment with turn_index:', commentTurnIndex);
      
      // Call API to create comment
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: commentText,
          topicPathId: selectedTopicId,
          avatarId: user?.id || 1, // Use user's avatar ID or default
          turn_index: commentTurnIndex,
          referenceMessageId: parentMessage.id,
          turn_kind_id: 3 // Comment type
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create comment');
      }
      
      // Clear comment state
      setCommentingMessageId(null);
      setCommentText('');
      
      // Reload messages to show the new comment
      await loadTopicHistory();
    } catch (err) {
      console.error('📜 HISTORY: Error creating comment:', err);
      setError('Failed to create comment');
    }
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
                
                {/* Comment input section */}
                {commentingMessageId === message.id && (
                  <div className="comment-input-section">
                    <textarea
                      className="comment-input"
                      placeholder="Type your comment here..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      autoFocus
                      rows={3}
                    />
                    <div className="comment-actions">
                      <button 
                        className="comment-submit-btn"
                        onClick={() => handleSubmitComment(message)}
                        disabled={!commentText.trim()}
                      >
                        📝 Add Comment
                      </button>
                      <button 
                        className="comment-cancel-btn"
                        onClick={() => {
                          setCommentingMessageId(null);
                          setCommentText('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryColumn;