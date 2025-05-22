import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';

const MessageInput = ({ 
  message, 
  setMessage,
  handleSubmit,
  handleFileChange,
  textareaRef,
  fileInputRef,
  autoResizeTextarea
}) => {
  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            autoResizeTextarea();
          }}
          onKeyDown={(e) => {
            // Handle Enter to send (but allow Shift+Enter for newlines)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
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
          <button type="submit" className="send-button">
            Send
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
