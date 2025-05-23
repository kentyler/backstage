import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';

// Get character limit from environment variable, or use 500 as fallback
const CHARACTER_LIMIT = process.env.REACT_APP_MESSAGE_CHARACTER_LIMIT ? 
  parseInt(process.env.REACT_APP_MESSAGE_CHARACTER_LIMIT, 10) : 500;

const MessageItem = ({ 
  message, 
  index,
  selectedMessageId, 
  setSelectedMessageId,
  expandedMessages,
  deletingFileId,
  handleDeleteFile
}) => {
  // Determine message type and author
  const isUser = message.isUser || message.author === 'You' || message.role === 'user' || (message.message_type_id === 1);
  const isSystem = message.isSystem || message.author === 'System';
  const messageClass = isSystem ? 'system-message' : isUser ? 'user-message' : 'ai-message';
  const isError = message.isError;
  
  // Check if this is a file message that can be deleted
  const isFileMessage = message.isFile && isUser && message.fileId;
  
  // Get author name from the appropriate field based on message type
  let authorName = 'Unknown';
  if (isSystem) {
    authorName = 'System';
  } else if (isUser) {
    // Try multiple possible author field names
    authorName = message.participantName || message.author || 'You';
  } else {
    // For AI messages
    authorName = message.llmName || message.author || 'AI Assistant';
  }
  
  // Format timestamp for display
  const timestamp = message.timestamp || message.created_at;
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
  
  // State to track if message is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle message expansion
  const toggleExpansion = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div 
      key={message.id || index} 
      className={`message ${messageClass} ${expandedMessages[message.id] ? 'expanded' : ''} ${isError ? 'error' : ''}`}
      onClick={() => {
        if (message.id && !isSystem && !isError) {
          setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
        }
      }}
    >
      <div className="message-header">
        <span className="message-author">{authorName}</span>
        <span className="message-timestamp">
          {formattedTime}
          {!isSystem && !isError && (
            <span 
              className={`related-messages-link ${selectedMessageId === message.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
              }}
              title={selectedMessageId === message.id ? "Hide related messages" : "Show related messages"}
            >
              {selectedMessageId === message.id ? ' × Hide related' : ' • See related'}
            </span>
          )}
        </span>
      </div>
      <div className="message-content">
        {isFileMessage ? (
          <div className="file-message">
            <div className="file-info">
              <span className="file-name">{message.content || 'Uploaded file'}</span>
              <button 
                className="delete-file-btn"
                style={{ backgroundColor: 'red', color: 'white', borderRadius: '50%' }}
                onClick={(e) => handleDeleteFile(message.fileId, message.turnId, e)}
                disabled={deletingFileId === message.fileId}
                title="Delete this file"
              >
                {deletingFileId === message.fileId ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faTimes} />
                )}
              </button>
            </div>
            {message.fileName && message.fileName !== message.content && (
              <div className="file-description">{message.fileName}</div>
            )}
          </div>
        ) : (
          <>
            {message.content && message.content.length > CHARACTER_LIMIT ? (
              <>
                {isExpanded ? message.content : `${message.content.substring(0, CHARACTER_LIMIT)}...`}
                <span 
                  className="toggle-expand"
                  onClick={toggleExpansion}
                  style={{
                    color: '#1976d2',
                    cursor: 'pointer',
                    marginLeft: '5px',
                    fontWeight: 'bold',
                    display: 'block',
                    marginTop: '5px'
                  }}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </span>
              </>
            ) : message.content}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
