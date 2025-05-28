import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

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
  handleDeleteFile,
  onAddComment,
  activeCommentIndex,
  setActiveCommentIndex,
  handleSubmitComment
}) => {
  // Determine message type and author
  const isUser = message.isUser || message.author === 'You' || message.role === 'user' || (message.message_type_id === 1);
  const isSystem = message.isSystem || message.author === 'System';
  const isComment = message.turn_kind_id === 3; // Using snake_case as returned by the backend
  
 /**
  *  console.log('Message turn kind check:', { 
    id: message.id, 
    turn_kind_id: message.turn_kind_id, 
    isComment 
  });  */
  
  // Set message class based on type - comments override user message type
  let messageClass;
  if (isComment) {
    messageClass = 'comment-message'; // Only use comment-message class for comments
  } else if (isSystem) {
    messageClass = 'system-message';
  } else if (isUser) {
    messageClass = 'user-message';
  } else {
    messageClass = 'ai-message';
  }
  
  const isError = message.isError;
  
  // Check if this is a file message that can be deleted
  const isFileMessage = message.isFile && isUser && message.fileId;
  
  // Get author name from the appropriate field based on message type
  let authorName = 'Unknown';
  if (isSystem) {
    authorName = 'System';
  } else if (isUser || isComment) {
    // Use the same author name format for both regular user messages and comments
    // (comments will be distinguished by their yellow background)
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
  
  // Create inline style for comments with very bright colors for debugging
  const commentStyle = isComment ? {
    backgroundColor: 'yellow',
    borderLeft: '3px solid orange',
    border: '2px solid orange'
  } : {};
  /**
   * 
   
  console.log('Message type info:', {
    id: message.id,
    turnKindId: message.turn_kind_id,
    isComment: isComment,
    content: message.content?.substring(0, 30)
  });
 
  // For debugging
  console.log('Rendering message:', {
    id: message.id,
    turnKindId: message.turn_kind_id,
    isComment,
    messageClass
  });
   */
  // Direct styling object for comments
  const directCommentStyle = isComment ? {
    backgroundColor: '#fffff0 !important',
    background: '#fffff0 !important',
    borderLeft: '4px solid #ffd700 !important',
    borderRadius: '4px !important',
    padding: '10px !important'
  } : {};
  
  // Regular message rendering
  return (
    <div 
      key={message.id || index} 
      className={`message ${messageClass} ${expandedMessages[message.id] ? 'expanded' : ''} ${isError ? 'error' : ''}`}
      onClick={() => {
        if (message.id && !isSystem && !isError) {
          setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
        }
      }}
      style={directCommentStyle}
    >
      <div className="message-header">
        <span className="message-author">{authorName}</span>
        <span className="message-timestamp">
          {formattedTime}
          {!isSystem && !isError && (
            <>
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
              <span 
                className="related-messages-link"
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle the comment input for this message
                  if (setActiveCommentIndex) {
                    // Check if this message is already the active comment target
                    const isActive = activeCommentIndex && 
                      typeof activeCommentIndex === 'object' && 
                      activeCommentIndex.index === index;
                    
                    // Toggle the comment input
                    setActiveCommentIndex(isActive ? null : index);
                  }
                }}
                title="Add a comment about this message"
              >
                • Add comment
              </span>
            </>
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
      
      {/* Comment input area - shown only when this message is the active comment target */}
      {(activeCommentIndex === index || 
        (typeof activeCommentIndex === 'object' && activeCommentIndex?.index === index)) && (
        <CommentInput 
          messageId={message.id} 
          index={index} 
          onSubmit={handleSubmitComment} 
          onCancel={() => setActiveCommentIndex(null)}
        />
      )}
    </div>
  );
};

// Comment input component that appears below a message
const CommentInput = ({ messageId, index, onSubmit, onCancel }) => {
  const [comment, setComment] = useState('');
  const commentInputRef = useRef(null);
  
  // Focus the input when it appears
  useEffect(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment, index);
      setComment('');
    }
  };
  
  return (
    <div className="comment-input-container" onClick={(e) => e.stopPropagation()}>
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          ref={commentInputRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add your comment here..."
          className="comment-textarea"
          rows={2}
        />
        <div className="comment-actions">
          <button type="button" onClick={onCancel} className="cancel-comment-btn">
            Cancel
          </button>
          <button type="submit" className="send-button" disabled={!comment.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageItem;
