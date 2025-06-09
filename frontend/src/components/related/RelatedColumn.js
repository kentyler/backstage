import React from 'react';
import './RelatedColumn.css';

const RelatedColumn = ({ 
  relatedMessages = [], 
  isLoading = false, 
  error = null, 
  selectedMessageId = null,
  onTopicSelect = null
}) => {
  const truncateContent = (content, maxLength = 150) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatScore = (score) => {
    if (typeof score === 'number') {
      return (score * 100).toFixed(1) + '%';
    }
    return 'N/A';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleTopicClick = (topicId, topicPath) => {
    if (onTopicSelect && topicId && topicPath) {
      console.log('🔗 RELATED: Topic selected:', { topicId, topicPath });
      onTopicSelect(topicId, topicPath);
    }
  };

  if (!selectedMessageId) {
    return (
      <div className="related-column">
        <div className="column-header">
          <h3>🔗 Related Messages</h3>
        </div>
        <div className="column-placeholder">
          <div className="column-indicator">
            <div className="dot">🔗</div>
            <p>Click "Show related" on any message to find similar content</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="related-column">
      <div className="column-header">
        <h3>🔗 Related Messages</h3>
        <div className="related-info">
          <span className="selected-message">Message #{selectedMessageId}</span>
          {relatedMessages.length > 0 && (
            <span className="related-count">({relatedMessages.length} related)</span>
          )}
        </div>
      </div>

      <div className="related-content">
        {error && (
          <div className="related-error">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="related-loading">
            Loading related messages...
          </div>
        )}

        {!isLoading && !error && relatedMessages.length === 0 && (
          <div className="related-empty">
            No related messages found for this message.
          </div>
        )}

        {!isLoading && !error && relatedMessages.length > 0 && (
          <div className="related-messages-list">
            {relatedMessages.map((message, index) => (
              <div key={message.id || index} className="related-message-item">
                {message.score && (
                  <div className="related-message-score">
                    Match: {formatScore(message.score)}
                  </div>
                )}
                
                <div className="related-message-preview">
                  {truncateContent(message.content)}
                </div>
                
                <div className="related-message-meta">
                  <span 
                    className="related-topic"
                    onClick={() => handleTopicClick(message.topicId, message.topicPath)}
                    style={{ cursor: message.topicId ? 'pointer' : 'default' }}
                    title={message.topicId ? 'Click to switch to this topic' : 'Topic info not available'}
                  >
                    📚 {message.topicPath || 'Unknown Topic'}
                  </span>
                  
                  <span className="related-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedColumn;