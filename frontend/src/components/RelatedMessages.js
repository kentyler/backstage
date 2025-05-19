import React, { useEffect, useRef } from 'react';
import './RelatedMessages.css';

/**
 * Displays a list of related messages with clickable topic paths
 * @param {Object} props
 * @param {Array} props.messages - Array of related messages
 * @param {boolean} props.isLoading - Whether the messages are currently loading
 * @param {Function} props.onTopicSelect - Callback when a topic is selected
 * @param {string} props.selectedMessageId - ID of the currently selected message (if any)
 */
const RelatedMessages = ({ messages = [], isLoading, onTopicSelect, selectedMessageId }) => {
  const prevMessagesRef = useRef(messages);

  // Only log when messages actually change
  useEffect(() => {
    const messagesChanged = 
      messages.length !== prevMessagesRef.current.length ||
      messages.some((msg, i) => msg.id !== prevMessagesRef.current[i]?.id);
      
    if (messagesChanged) {
      console.log('RelatedMessages updated with messages:', messages.length);
      prevMessagesRef.current = messages;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="related-messages">
        <div className="related-messages-header">
          <h3>Related Messages</h3>
        </div>
        <div className="related-messages-loading">
          <div className="loading-spinner"></div>
          <span>Searching for related messages...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="related-messages">
        <div className="related-messages-header">
          <h3>Related Messages</h3>
        </div>
        <div className="related-messages-empty">
          <p>No related messages found.</p>
          <p className="hint">Try rephrasing your question or check back later.</p>
        </div>
      </div>
    );
  }

  // Clean up message content by removing any existing prefixes
  const formatContent = (content) => {
    if (!content) return '';
    // Remove any existing prefixes like "<You>:" or "<Assistant>:"
    return content.replace(/^<[^>]+>:\s*/, '').trim();
  };

  // Format the score as a percentage
  const formatScore = (score) => {
    if (score === undefined || score === null) return null;
    return Math.round(score * 100);
  };

  return (
    <div className="related-messages">
      <div className="related-messages-header">
        <h3>Related Messages</h3>
        <div className="related-messages-count">{messages.length} found</div>
      </div>
      
      <div className="related-messages-list">
        {messages.map((msg) => {
          const content = formatContent(msg.content);
          const isSelected = selectedMessageId === msg.id;
          
          return (
            <div 
              key={msg.id} 
              className={`related-message ${isSelected ? 'selected' : ''}`}
              onClick={() => onTopicSelect(msg.topicPathId, msg.id)}
            >
              <div className="related-message-header">
                <span className="related-message-topic">
                  Conversation: {msg.topicPathId || 'N/A'}
                </span>
                {msg.score && (
                  <span className="related-message-score">
                    {Math.round(msg.score * 100)}% match
                  </span>
                )}
              </div>
              <div className="related-message-content">
                {content.length > 200 ? `${content.substring(0, 200)}...` : content}
              </div>
              {msg.timestamp && (
                <div className="related-message-timestamp">
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedMessages;
