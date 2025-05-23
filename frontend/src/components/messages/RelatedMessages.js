import React, { useState, useEffect, useRef } from 'react';
import './RelatedMessages.css';

// Get character limit from environment variable, or use 500 as fallback
const CHARACTER_LIMIT = process.env.REACT_APP_MESSAGE_CHARACTER_LIMIT ? 
  parseInt(process.env.REACT_APP_MESSAGE_CHARACTER_LIMIT, 10) : 500;

/**
 * Displays a list of related messages with clickable topic paths
 * @param {Object} props
 * @param {Array} props.messages - Array of related messages
 * @param {boolean} props.isLoading - Whether the messages are currently loading
 * @param {Function} props.onTopicSelect - Callback when a topic is selected
 * @param {string} props.selectedMessageId - ID of the currently selected message (if any)
 */
const RelatedMessages = ({ messages = [], isLoading, onTopicSelect, selectedMessageId }) => {
  // State to track which messages are expanded
  const [expandedMessages, setExpandedMessages] = useState({});
  
  // Function to toggle message expansion
  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };
  const prevMessagesRef = useRef(messages);

  // Only log when messages actually change
  useEffect(() => {
    // Always log for debugging this issue
    console.log('[DEBUG] RelatedMessages component received props.messages:', messages);
    console.log('[DEBUG] Messages type:', Array.isArray(messages) ? 'Array' : typeof messages);
    console.log('[DEBUG] Messages length:', messages.length);
    if (messages.length > 0) {
      console.log('[DEBUG] First message in RelatedMessages:', messages[0]);
      console.log('[DEBUG] All message keys:', Object.keys(messages[0]));
    }
    
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
            >
              <div className="related-message-header">
                <div 
                  style={{
                    fontSize: '0.8rem',
                    color: '#1976d2',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                  onClick={() => onTopicSelect(msg.topicId, msg.id)}
                  title="Open this topic"
                >
                  Topic: {msg.topicPath?.split('.')?.pop() || 'Unknown'}
                </div>
                {msg.score && (
                  <span className="related-message-score">
                    {Math.round(msg.score * 100)}% match
                  </span>
                )}
              </div>
              <div className="related-message-content">
                {content.length > CHARACTER_LIMIT ? (
                  expandedMessages[msg.id] ? (
                    <>
                      {content}
                      <span 
                        style={{ color: '#1976d2', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
                        onClick={() => toggleMessageExpansion(msg.id)}
                      >
                        Show less
                      </span>
                    </>
                  ) : (
                    <>
                      {content.substring(0, CHARACTER_LIMIT)}
                      <span style={{ color: '#777' }}>...</span>
                      <span 
                        style={{ color: '#1976d2', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
                        onClick={() => toggleMessageExpansion(msg.id)}
                      >
                        Show more
                      </span>
                    </>
                  )
                ) : content}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '8px' }}>
                {msg.timestamp && (
                  <div className="related-message-timestamp">
                    {new Date(msg.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedMessages;
