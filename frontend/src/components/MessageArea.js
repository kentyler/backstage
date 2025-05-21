import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MessageArea.css';
import llmService from '../services/llmService';
import topicService from '../services/topicService';
import RelatedMessages from './RelatedMessages';

const MessageArea = ({ selectedTopic }) => {
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [topicMessages, setTopicMessages] = useState([]);
  const [relatedMessages, setRelatedMessages] = useState([]);
  
  // State to track which messages are expanded
  const [expandedMessages, setExpandedMessages] = useState({});

  // Create a container ref for the message container
  const messageContainerRef = useRef(null);

  // Robust scrolling method with multiple fallbacks
  const scrollToBottom = (force = false) => {
    console.log('Attempting to scroll to bottom');
    
    // Try multiple methods to ensure scrolling works
    const scrollMethods = [
      // Method 1: Use the ref directly
      () => {
        if (messageContainerRef.current) {
          const container = messageContainerRef.current;
          container.scrollTop = container.scrollHeight;
          console.log(`Method 1: Direct ref scrolling, height=${container.scrollHeight}`);
        }
      },
      
      // Method 2: Use querySelector
      () => {
        const container = document.querySelector('.messages-list');
        if (container) {
          container.scrollTop = container.scrollHeight;
          console.log(`Method 2: querySelector scrolling, height=${container.scrollHeight}`);
        }
      },
      
      // Method 3: Use scrollIntoView on the end ref
      () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
          console.log('Method 3: scrollIntoView on end ref');
        }
      },
      
      // Method 4: Scroll the parent container
      () => {
        const container = document.querySelector('.messages-column');
        if (container) {
          container.scrollTop = container.scrollHeight;
          console.log(`Method 4: Parent container scrolling, height=${container.scrollHeight}`);
        }
      }
    ];
    
    // Try all methods immediately
    scrollMethods.forEach(method => method());
    
    // Then try again with delays to ensure it works after rendering
    [100, 300, 500, 1000].forEach(delay => {
      setTimeout(() => {
        console.log(`Retry scrolling after ${delay}ms`);
        scrollMethods.forEach(method => method());
      }, delay);
    });
  };
  
  // Load messages when a topic is selected
  const loadMessages = useCallback(async () => {
    if (!selectedTopic || !selectedTopic.id) {
      setTopicMessages([]);
      setRelatedMessages([]);
      return;
    }

    try {
      // selectedTopic now contains both id and name
      console.log('Loading messages for topic ID:', selectedTopic.id, 'Name:', selectedTopic.name);
      const messages = await topicService.getMessagesByTopicId(selectedTopic.id);
      
      // Log raw messages from API to check their structure
      console.log('Raw messages from API:', messages);
      
      // Transform the API response to match the component's message format
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.createdAt,
        author: msg.isUser ? 'You' : 'Assistant',
        // Preserve the turn_index field from the backend
        turn_index: msg.turn_index
      }));

      console.log('Loaded messages:', formattedMessages);
      setTopicMessages(formattedMessages);
      
      // Explicitly scroll to bottom after messages are loaded
      // Use immediate scrolling for better reliability
      setTimeout(() => {
        scrollToBottom(true);
      }, 200);
      
      // Add a second scroll attempt with a longer delay
      setTimeout(() => {
        scrollToBottom(true);
      }, 500);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Optionally show an error message to the user
    }
  }, [selectedTopic?.id]);

  // Load messages when the selected topic changes
  useEffect(() => {
    console.log('Selected topic changed, loading messages for:', selectedTopic?.id, selectedTopic?.name);
    loadMessages();
  }, [selectedTopic?.id]);
  
  // Function to toggle message expansion
  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Effect for initial component mount and when selected topic changes
  useEffect(() => {
    console.log('Component mounted or topic changed, scrolling to bottom');
    // Initial scroll
    scrollToBottom(true);
    
    // Multiple delayed scrolls to ensure it works
    [100, 300, 500, 1000, 2000].forEach(delay => {
      setTimeout(() => {
        scrollToBottom(true);
      }, delay);
    });
  }, [selectedTopic?.id]); // Run when the component mounts or when the selected topic changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    console.log('Selected topic in handleSubmit:', selectedTopic);
    
    if (!selectedTopic || !selectedTopic.id) {
      console.error('No valid topic selected');
      alert('Please select a topic before sending a message');
      return;
    }
    
    // Get the numeric ID from the selectedTopic object
    const numericId = selectedTopic.id;
    
    console.log('Using numeric ID:', numericId, 'Name:', selectedTopic.name);

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
      
      // Scroll to bottom after adding user message
      scrollToBottom();
      
      // Submit to LLM with the selected topic path
      console.log('Calling submitPrompt with:', {
        message,
        topicPathId: numericId,
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
      
      // Scroll to bottom immediately after adding loading message
      setTimeout(() => scrollToBottom(true), 50);
      
      try {
        // Submit the prompt and get the response
        const response = await llmService.submitPrompt(message, {
          topicPathId: numericId, // Use numeric ID for database operations
          avatarId: 1,
          // We don't have a message ID yet since we're creating a new message
          // The backend will handle excluding the current message once it's created
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
            topicId: msg.topicId, // Use the numeric ID for topic selection
            topicPath: msg.topicPath || 'Unknown', // Use human-readable path for display
            score: msg.score // Keep the relevance score
          }));
          
          // Update the related messages state
          setRelatedMessages(formattedRelevantMessages);
        } else {
          console.log('No relevant messages found in response');
          setRelatedMessages([]);
        }
        
        // Add detailed logging to debug response handling
        console.log('Response from server:', response);
        console.log('Response ID:', response.id);
        console.log('Response content:', response.content);
        console.log('Response timestamp:', response.timestamp);
        
        // Replace loading message with actual response
        setTopicMessages(prev => {
          // Filter out the loading message
          const filteredMessages = prev.filter(msg => !msg.isLoading);
          
          // Log the current messages before adding the new one
          console.log('Current messages before adding response:', filteredMessages);
          
          // Create the assistant message object
          const assistantMessage = {
            id: response.id || `resp-${Date.now()}`,
            content: response.content,
            timestamp: response.timestamp || new Date().toISOString(),
            author: 'Assistant'
          };
          
          console.log('Adding assistant message to UI:', assistantMessage);
          
          // Add the actual response
          return [...filteredMessages, assistantMessage];
        });
        
        // Auto-expand the latest assistant response
        if (response.id) {
          setExpandedMessages(prev => ({
            ...prev,
            [response.id]: true
          }));
        }
        
        // Scroll to bottom immediately after receiving response
        scrollToBottom(true);
        
        // Also scroll after a short delay to ensure rendering is complete
        setTimeout(() => scrollToBottom(true), 100);
        
      } catch (error) {
        console.error('Error submitting prompt:', error);
        
        // Remove loading message and show error
        setTopicMessages(prev => {
          // Filter out the loading message
          const filteredMessages = prev.filter(msg => !msg.isLoading);
          
          // Add error message
          return [...filteredMessages, {
            id: `error-${Date.now()}`,
            content: 'Sorry, there was an error processing your request. Please try again.',
            timestamp: new Date().toISOString(),
            author: 'Assistant',
            isError: true
          }];
        });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      uploadFile(selectedFile);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    
    if (!selectedTopic || !selectedTopic.id) {
      console.error('No valid topic selected');
      alert('Please select a topic before uploading a file');
      return;
    }
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicPathId', selectedTopic.id);
    
    try {
      // Show uploading message
      const uploadingMessage = {
        id: `uploading-${Date.now()}`,
        content: `Uploading ${file.name}...`,
        timestamp: new Date().toISOString(),
        author: 'You',
        isUploading: true
      };
      
      setTopicMessages(prev => [...prev, uploadingMessage]);
      
      // Scroll to bottom after adding uploading message
      scrollToBottom();
      
      // Upload the file
      const response = await llmService.uploadFile(formData);
      
      // Replace uploading message with success message
      setTopicMessages(prev => {
        // Filter out the uploading message
        const filteredMessages = prev.filter(msg => !msg.isUploading);
        
        // Add success message
        return [...filteredMessages, {
          id: `file-${Date.now()}`,
          content: `File uploaded: ${file.name}`,
          timestamp: new Date().toISOString(),
          author: 'You',
          isFile: true
        }];
      });
      
      // Add assistant response if available
      if (response && response.content) {
        setTopicMessages(prev => [...prev, {
          id: response.id || `resp-${Date.now()}`,
          content: response.content,
          timestamp: response.timestamp || new Date().toISOString(),
          author: 'Assistant'
        }]);
        
        // Auto-expand the latest assistant response
        if (response.id) {
          setExpandedMessages(prev => ({
            ...prev,
            [response.id]: true
          }));
        }
      }
      
      // Scroll to bottom after receiving response
      scrollToBottom();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Replace uploading message with error message
      setTopicMessages(prev => {
        // Filter out the uploading message
        const filteredMessages = prev.filter(msg => !msg.isUploading);
        
        // Add error message
        return [...filteredMessages, {
          id: `error-${Date.now()}`,
          content: `Error uploading file: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          author: 'System',
          isError: true
        }];
      });
    }
  };

  const renderTopicBreadcrumb = () => {
    if (!selectedTopic || !selectedTopic.id) return null;
    return <div className="topic-breadcrumb">{selectedTopic.name}</div>;
  };
  
  const renderMessage = (message) => {
    // Check if the message is a loading or error message
    if (message.isLoading) {
      return (
        <div key={message.id} className={`message ${message.author.toLowerCase()}`}>
          <div className="message-content loading">
            <div className="loading-indicator">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            {message.content}
          </div>
        </div>
      );
    }
    
    if (message.isError) {
      return (
        <div key={message.id} className="message error">
          <div className="message-content">
            <i className="fas fa-exclamation-circle"></i> {message.content}
          </div>
        </div>
      );
    }
    
    // Check if the message is expanded or should be truncated
    const isExpanded = expandedMessages[message.id];
    const isAssistant = message.author === 'Assistant';
    const content = message.content || '';
    
    // Only truncate assistant messages that are longer than 500 characters
    const shouldTruncate = isAssistant && content.length > 500 && !isExpanded;
    
    // Get the display content based on truncation with inline Show more/less text
    let displayContent;
    if (isAssistant && content.length > 500) {
      if (isExpanded) {
        displayContent = (
          <>
            {content}
            <span 
              style={{ color: '#1976d2', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
              onClick={() => toggleMessageExpansion(message.id)}
            >
              Show less
            </span>
          </>
        );
      } else {
        displayContent = (
          <>
            {content.substring(0, 500)}
            <span style={{ color: '#777' }}>...</span>
            <span 
              style={{ color: '#1976d2', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
              onClick={() => toggleMessageExpansion(message.id)}
            >
              Show more
            </span>
          </>
        );
      }
    } else {
      displayContent = content;
    }
    
    return (
      <div key={message.id} className={`message ${message.author.toLowerCase()}`}>
        <div className="message-header">
          <span className="message-author">{message.author}</span>
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="message-content">
          {displayContent}
        </div>
      </div>
    );
  };

  return (
    <div className="message-area">
      <div className="topic-header">
        {!selectedTopic || !selectedTopic.id ? (
          <div className="no-topic-selected">
            <i className="fas fa-info-circle"></i> Please select a topic from the sidebar
          </div>
        ) : null}
      </div>

      {/* Messages container */}
      <div className="messages-container">
        {/* Topic messages */}
        <div className="messages-column">
          <div className="messages-header">
            {selectedTopic && selectedTopic.id ? selectedTopic.name : 'Messages in this topic'}
          </div>
          <div className="messages-list" ref={messageContainerRef}>
            {topicMessages.map(renderMessage)}
            <div ref={messagesEndRef} style={{ height: '1px', clear: 'both' }} />
          </div>
        </div>

        {/* Related messages */}
        <div className="messages-column">
          <RelatedMessages 
            messages={relatedMessages} 
            isLoading={false} 
            onTopicSelect={(topicId, messageId) => {
              // Handle topic selection from related messages
              console.log('Selected topic from related messages:', topicId, 'messageId:', messageId);
              
              // Find the topic name from the related messages
              const selectedMessage = relatedMessages.find(msg => msg.topicId === topicId);
              const topicName = selectedMessage?.topicPath?.split('.')?.pop() || 'Unknown';
              
              // Update the selected topic via the window object
              if (typeof window.setSelectedTopic === 'function') {
                window.setSelectedTopic({
                  id: topicId,
                  name: topicName
                });
              }
            }} 
            selectedMessageId={null}
          />
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