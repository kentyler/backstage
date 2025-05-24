import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MessageInput = ({ 
  message, 
  setMessage,
  handleSubmit,
  handleFileChange,
  textareaRef,
  fileInputRef,
  autoResizeTextarea,
  isWaitingForResponse = false
}) => {
  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        {isWaitingForResponse && (
          <div className="waiting-indicator">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>Processing your message...</span>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className={`message-input ${isWaitingForResponse ? 'disabled' : ''}`}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            autoResizeTextarea();
          }}
          disabled={isWaitingForResponse}
          onKeyDown={(e) => {
            // Handle Enter to send (but allow Shift+Enter for newlines)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              
              // If the message is exactly 'Comment' or 'comment', don't submit yet
              const trimmedMessage = message.trim();
              if (trimmedMessage === 'Comment' || trimmedMessage === 'comment') {
                // Insert a newline instead
                setMessage(message + '\n');
              } else {
                // Otherwise, submit the message as usual
                handleSubmit(e);
              }
            }
          }}
          onPaste={autoResizeTextarea}
          onCut={autoResizeTextarea}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for newline)"
          rows="1"
          style={{
            minHeight: '40px',
            maxHeight: '400px',
            overflowY: 'auto',
            resize: 'none',
            transition: 'none' // Prevents animation glitches
          }}
        />
        <div className="message-actions">
          <button 
            type="submit" 
            className={`send-button ${isWaitingForResponse ? 'disabled' : ''}`}
            disabled={isWaitingForResponse}
          >
            {isWaitingForResponse ? 'Waiting...' : 'Send'}
          </button>
          <label className="upload-button">
            <input
              type="file"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <FontAwesomeIcon 
              icon={faPaperclip} 
              style={{ 
                fontSize: '1.2em',
                color: '#666',
                cursor: 'pointer',
                transform: 'rotate(-45deg)' // Optional: Rotate to match the emoji style
              }} 
              title="Attach file"
            />
          </label>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
