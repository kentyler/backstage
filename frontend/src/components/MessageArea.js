import React, { useState, useRef, useEffect } from 'react';
import './MessageArea.css';
import llmService from '../services/llmService';

const MessageArea = ({ selectedTopic }) => {
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  const [topicMessages, setTopicMessages] = useState([
    {
      id: 1,
      content: "This is a message in the current topic path",
      timestamp: "2025-05-16T10:00:00Z",
      author: "User1"
    }
  ]);

  const [relatedMessages, setRelatedMessages] = useState([
    {
      id: 2,
      content: "This is a semantically related message from another topic",
      timestamp: "2025-05-16T09:00:00Z",
      author: "User2",
      topic: "other.topic.path"
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [topicMessages]); // Scroll when messages change

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      // Add user message to UI
      const userMessage = {
        id: Date.now(),
        content: message,
        timestamp: new Date().toISOString(),
        author: 'You'
      };
      setMessage('');

      // Add message to list
      const updatedMessages = [...topicMessages, userMessage];
      setTopicMessages(updatedMessages);

      // Submit to LLM
      const response = await llmService.submitPrompt(message);

      // Add LLM response to UI
      const llmMessage = {
        id: Date.now() + 1,
        content: response.text,
        timestamp: new Date().toISOString(),
        author: 'Assistant'
      };
      setTopicMessages([...updatedMessages, llmMessage]);
    } catch (error) {
      console.error('Error submitting prompt:', error);
      // TODO: Show error in UI
    }
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
            <div>
              {topicMessages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Related messages */}
        <div className="messages-column">
          <div className="messages-header">
            Related messages
          </div>
          <div className="messages-list">
            <div>
              {relatedMessages.map(renderMessage)}
            </div>
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageArea;
