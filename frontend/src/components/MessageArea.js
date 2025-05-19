import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MessageArea.css';
import llmService from '../services/llmService';

const MessageArea = ({ selectedTopic }) => {
  // Load messages when a topic is selected
  const loadMessages = useCallback(async () => {
    if (!selectedTopic?.id) {
      setTopicMessages([]);
      setRelatedMessages([]);
      return;
    }

    try {
      console.log('Loading messages for topic:', selectedTopic.id);
      const messages = await llmService.getMessagesByTopicPath(selectedTopic.id);
      
      // Transform the API response to match the component's message format
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.createdAt,
        author: msg.isUser ? 'You' : 'Assistant'
      }));

      console.log('Loaded messages:', formattedMessages);
      setTopicMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Optionally show an error message to the user
    }
  }, [selectedTopic]);

  // Load messages when the selected topic changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);
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
      // Add user message to UI immediately for better UX
      const userMessage = {
        id: `temp-${Date.now()}`,
        content: message,
        timestamp: new Date().toISOString(),
        author: 'You'
      };
      
      // Clear input field immediately
      setMessage('');
      
      // Add user message to the UI
      setTopicMessages(prev => [...prev, userMessage]);

      // Submit to LLM with the selected topic path
      console.log('Calling submitPrompt with:', {
        message,
        topicPathId: topicId,
        avatarId: 1
      });
      
      // Show loading state
      const loadingMessage = {
        id: `loading-${Date.now()}`,
        content: 'Thinking...',
        timestamp: new Date().toISOString(),
        author: 'Assistant',
        isLoading: true
      };
      
      setTopicMessages(prev => [...prev, loadingMessage]);
      
      try {
        // Submit the prompt and get the response
        const response = await llmService.submitPrompt(message, {
          topicPathId: topicId,
          avatarId: 1
        });
        
        // Process relevant messages if they exist in the response
        if (response.relevantMessages && response.relevantMessages.length > 0) {
          console.log(`Processing ${response.relevantMessages.length} relevant messages from response`);
          
          // Format the relevant messages for display
          const formattedRelevantMessages = response.relevantMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            author: 'Assistant',
            topicPath: msg.topicPathId, // Store the topic path ID
            score: msg.score // Keep the relevance score
          }));
          
          // Update the related messages state
          setRelatedMessages(formattedRelevantMessages);
        } else {
          console.log('No relevant messages found in response');
          setRelatedMessages([]);
        }
        
        // Refresh messages to get the latest from the server
        await loadMessages();
        
      } catch (error) {
        console.error('Error in LLM submission:', error);
        // Remove loading message and show error
        setTopicMessages(prev => [
          ...prev.filter(m => m.id !== loadingMessage.id),
          {
            id: `error-${Date.now()}`,
            content: `Error: ${error.message || 'Failed to get response'}`,
            timestamp: new Date().toISOString(),
            author: 'System',
            isError: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Show error message in the UI
      setTopicMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: `Error: ${error.message || 'Failed to send message'}`,
          timestamp: new Date().toISOString(),
          author: 'System',
          isError: true
        }
      ]);
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

  const renderMessage = (message) => {
    const messageClasses = [
      'message-item',
      message.isLoading ? 'message-loading' : '',
      message.isError ? 'message-error' : ''
    ].filter(Boolean).join(' ');

    return (
      <div key={message.id} className={messageClasses}>
        <div className="message-header">
          <span className="message-author">{message.author}</span>
          <span className="message-timestamp">
            {new Date(message.timestamp).toLocaleString()}
          </span>
        </div>
        <div className="message-content">
          {message.isLoading ? (
            <div className="loading-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          ) : message.content}
        </div>
        {message.topicPath && (
          <div className="message-footer">
            <span className="message-topic-path">Topic: {message.topicPath}</span>
            {message.score && (
              <span className="message-relevance-score">
                Relevance: {Math.round(message.score * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

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
