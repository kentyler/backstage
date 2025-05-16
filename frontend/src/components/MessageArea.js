import React, { useState } from 'react';
import './MessageArea.css';

const MessageArea = ({ selectedTopic }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  // Example messages for demonstration
  const topicMessages = [
    {
      id: 1,
      content: "This is a message in the current topic path",
      timestamp: "2025-05-16T10:00:00Z",
      author: "User1"
    }
  ];

  const relatedMessages = [
    {
      id: 2,
      content: "This is a semantically related message from another topic",
      timestamp: "2025-05-16T09:00:00Z",
      author: "User2",
      topic: "other.topic.path"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Handle message submission
    console.log('Submitting:', message, file);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const renderTopicBreadcrumb = () => {
    if (!selectedTopic) return null;
    
    const parts = selectedTopic.split('.');
    return (
      <div className="topic-breadcrumb">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="topic-breadcrumb-separator">›</span>}
            <span className="topic-breadcrumb-part">{part}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderMessage = (message) => (
    <div key={message.id} className="message-item">
      <div className="message-header">
        <span>{message.author}</span>
        <span>{new Date(message.timestamp).toLocaleString()}</span>
      </div>
      <div className="message-content">{message.content}</div>
      <div className="message-footer">
        {message.topic && <span>From: {message.topic}</span>}
      </div>
    </div>
  );

  return (
    <div className="message-area">
      {/* Topic breadcrumb */}
      {renderTopicBreadcrumb()}

      {/* Messages container */}
      <div className="messages-container">
        {/* Topic messages */}
        <div className="messages-column">
          <div className="messages-header">
            Messages in this topic
          </div>
          <div className="messages-list">
            {topicMessages.map(renderMessage)}
          </div>
        </div>

        {/* Related messages */}
        <div className="messages-column">
          <div className="messages-header">
            Related messages
          </div>
          <div className="messages-list">
            {relatedMessages.map(renderMessage)}
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="message-input-container">
        <form onSubmit={handleSubmit} className="message-input-form">
          <textarea
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <div className="message-actions">
            <button type="submit" className="send-button">
              Send
            </button>
            <label className="upload-button">
              <input
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              📎
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageArea;
