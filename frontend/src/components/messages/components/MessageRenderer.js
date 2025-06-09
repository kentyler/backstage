import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * MessageRenderer Component
 * 
 * Pure rendering component for individual messages.
 * Handles display of different message types including:
 * - Text messages
 * - File messages  
 * - Comments
 * - LLM responses
 */
const MessageRenderer = ({
  message,
  index,
  isComment,
  expandedMessages,
  onToggleExpand,
  onAddComment,
  onDeleteMessage,
  onShowRelated,
  deletingFileId,
  user
}) => {

  /**
   * Determine message type display label
   */
  const getMessageTypeDisplay = (messageTypeId) => {
    switch (messageTypeId) {
      case 1: return ''; // Human - no label
      case 2: return ''; // LLM - no label  
      case 3: return 'Comment';
      case 4: return 'File';
      default: return '';
    }
  };

  /**
   * Get sender name for the message
   */
  const getSenderName = () => {
    if (message.participant_name && message.llm_name) {
      return `${message.participant_name} → ${message.llm_name}`;
    } else if (message.participant_name) {
      return message.participant_name;
    } else if (message.llm_name) {
      return message.llm_name;
    }
    return 'Unknown';
  };

  /**
   * Check if message should be expandable
   */
  const shouldShowExpandToggle = () => {
    return message.content_text && message.content_text.length > 200;
  };

  /**
   * Get display content with expansion handling
   */
  const getDisplayContent = () => {
    if (!message.content_text) return '';
    
    const isExpanded = expandedMessages[message.id];
    const shouldTruncate = shouldShowExpandToggle() && !isExpanded;
    
    if (shouldTruncate) {
      return message.content_text.substring(0, 200) + '...';
    }
    
    return message.content_text;
  };

  /**
   * Check if user can delete this message
   */
  const canDeleteMessage = () => {
    return user && message.participant_id === user.participant_id;
  };

  /**
   * Render message header with sender and type info
   */
  const renderMessageHeader = () => (
    <div className="message-header">
      <span className="message-sender">{getSenderName()}</span>
      {getMessageTypeDisplay(message.message_type_id) && (
        <span className="message-type">
          {getMessageTypeDisplay(message.message_type_id)}
        </span>
      )}
      <span className="message-time">
        {new Date(message.created_at).toLocaleTimeString()}
      </span>
      {message.turn_index !== undefined && (
        <span className="turn-index">#{message.turn_index}</span>
      )}
    </div>
  );

  /**
   * Render message content
   */
  const renderMessageContent = () => (
    <div className="message-content">
      <div className="message-text">
        {getDisplayContent()}
      </div>
      
      {shouldShowExpandToggle() && (
        <button
          onClick={() => onToggleExpand(message.id)}
          className="expand-toggle"
        >
          {expandedMessages[message.id] ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );

  /**
   * Render message actions
   */
  const renderMessageActions = () => (
    <div className="message-actions">
      {!isComment && (
        <button
          onClick={() => onAddComment(index)}
          className="action-btn comment-btn"
        >
          💬 Comment
        </button>
      )}
      
      <button
        onClick={() => onShowRelated(message.id)}
        className="action-btn related-btn"
      >
        🔗 Show related
      </button>
      
      {canDeleteMessage() && (
        <button
          onClick={() => onDeleteMessage(message.id)}
          disabled={deletingFileId === message.id}
          className="action-btn delete-btn"
        >
          <FontAwesomeIcon icon={faTimes} />
          Delete
        </button>
      )}
    </div>
  );

  /**
   * Get CSS classes for the message
   */
  const getMessageClasses = () => {
    const classes = ['message-item'];
    
    if (isComment) {
      classes.push('comment-message');
    }
    
    if (message.message_type_id === 2) { // LLM message
      classes.push('llm-message');
    }
    
    if (message.message_type_id === 4) { // File message
      classes.push('file-message');
    }
    
    return classes.join(' ');
  };

  return (
    <div className={getMessageClasses()}>
      {renderMessageHeader()}
      {renderMessageContent()}
      {renderMessageActions()}
    </div>
  );
};

export default MessageRenderer;