import React, { useState, useRef, useEffect } from 'react';
import './MessageArea.css';
import llmService from '../services/llmService';

const MessageArea = ({ selectedTopic }) => {
  // Log the selected topic for debugging and reset messages when topic changes
  useEffect(() => {
    console.log('Selected Topic:', selectedTopic);
    if (selectedTopic && selectedTopic.id) {
      // Clear messages when topic changes
      setTopicMessages([]);
      setRelatedMessages([]);
    }
  }, [selectedTopic]);
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
    
    console.log('Selected topic in handleSubmit:', selectedTopic);
    
    if (!selectedTopic || !selectedTopic.id) {
      console.error('No valid topic selected');
      alert('Please select a topic before sending a message');
      return;
    }
    
    const topicId = selectedTopic.id;
    console.log('Using topic ID:', topicId, 'Type:', typeof topicId, 'Path:', selectedTopic.path);
    
    if (!topicId) {
      console.error('Topic ID is falsy:', topicId);
      alert('Invalid topic ID. Please try again.');
      return;
    }

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

      // Submit to LLM with the selected topic path
      console.log('Calling submitPrompt with:', {
        message,
        topicPathId: topicId,
        avatarId: 1,
        clientSchemaId: 1
      });
      
      const response = await llmService.submitPrompt(message, {
        topicPathId: topicId,
        avatarId: 1, // TODO: Get the actual avatar ID from user context
        clientSchemaId: 1 // TODO: Get the actual client schema ID from app context
      });
      
      console.log('Received response:', response);

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
    if (!selectedTopic || !selectedTopic.path) return null;
    
    const parts = selectedTopic.path.split('.');
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
      <div className="topic-header">
        {selectedTopic && selectedTopic.id ? (
          <div className="selected-topic">
            {renderTopicBreadcrumb()}
          </div>
        ) : (
          <div className="no-topic-selected">
            <i className="fas fa-info-circle"></i> Please select a topic from the sidebar
          </div>
        )}
      </div>
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
