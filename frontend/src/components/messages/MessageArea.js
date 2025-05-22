import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MessageArea.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import llmService from '../../services/llmService';
import topicService from '../../services/topics/topicService';
import RelatedMessages from './RelatedMessages';
import { useAuth } from '../../services/auth/authContext';

const MessageArea = ({ selectedTopic }) => {
  // Refs
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Authentication
  const { user } = useAuth();
  
  // Message state
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [topicMessages, setTopicMessages] = useState([]);
  
  // UI state
  const [expandedMessages, setExpandedMessages] = useState({});
  
  // Related messages state
  const [relatedMessages, setRelatedMessages] = useState([]);
  const [relatedMessagesError, setRelatedMessagesError] = useState(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);


  
  // Auto-resize textarea based on content
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      // Reset height to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight with a max of 400px
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`;
    }
  }, []);
  
  // Handle textarea changes
  const handleTextareaChange = useCallback((e) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  }, [autoResizeTextarea]);

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
      
      // Add very detailed logging to trace what's happening with participant names
      console.log('========= API RESPONSE MESSAGES =========');
      console.log(JSON.stringify(messages, null, 2));
      console.log('=======================================');
      
      // Transform the API response to match the component's message format
      const formattedMessages = messages.map((msg, idx) => {
        // Log each individual message in detail
        console.log(`MESSAGE ${idx} DETAILS:`, {
          id: msg.id,
          isUser: msg.isUser,
          participantId: msg.participantId,
          participantName: msg.participantName,
          llmId: msg.llmId,
          llmName: msg.llmName,
          contentPreview: msg.content?.substring(0, 30)
        });
        
        // Get display name directly from the database fields
        // NO FALLBACKS - rely on database values only
        let displayHeader;
        
        if (msg.isUser) {
          // For user messages, use the exact participant_name from the database
          displayHeader = msg.participantName;
          console.log(`User message ${idx} using displayHeader:`, displayHeader);
        } else {
          // For assistant messages, use the exact llm_name from the database
          displayHeader = msg.llmName;
          console.log(`Assistant message ${idx} using displayHeader:`, displayHeader);
        }
        
        return {
          id: msg.id,
          content: msg.content,
          timestamp: msg.createdAt,
          author: msg.isUser ? 'You' : 'Assistant', // Keep this as 'You' for styling purposes
          displayHeader: displayHeader, // Use the participant or LLM name as the display header
          // Preserve the turn_index field from the backend
          turn_index: msg.turn_index,
          // Store the original participant and LLM IDs and names
          participantId: msg.participantId,
          participantName: msg.participantName,
          llmId: msg.llmId,
          llmName: msg.llmName
        };
      });

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
      // Get the user's name to display in the message header
      // Prioritize the name field, then username, then email
      const userName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';
      const userEmail = user?.email || null;
      const userUsername = user?.username || null;
      
      // Log the complete user object to see what's available
      console.log('Complete user object:', JSON.stringify(user, null, 2));
      
      // Use the most appropriate name for the participant
      const participantName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';
      console.log('Using participant name:', participantName);
      console.log('User display info:', { 
        name: user?.name, 
        username: user?.username, 
        email: user?.email,
        derivedName: participantName 
      });
      
      // No need to prepend the identifier to the content anymore
      const formattedContent = message;
      
      // Add user message to UI immediately for better UX
      // Make sure this matches the format of messages loaded from the database
      const userMessage = {
        id: `temp-${Date.now()}`,
        content: formattedContent,
        timestamp: new Date().toISOString(),
        author: 'You', // Keep this as 'You' for styling purposes
        participantId: user?.id || null,
        participantName: participantName, // Use exact participantName from above
        isUser: true // Explicitly mark as user message
      };
      
      // Log the message we're about to display
      console.log('Temporary user message being displayed:', userMessage);
      
      // Clear input field immediately
      setMessage('');
      
      // Add user message to the UI
      setTopicMessages(prev => [...prev, userMessage]);
      
      // Scroll to bottom after adding user message
      scrollToBottom();
      
      // Submit to LLM with the selected topic path
      // Ensure we pass the explicit user participant ID to the LLM service
      console.log('Calling submitPrompt with:', {
        message,
        topicPathId: numericId,
        avatarId: 1,
        participantId: user?.id // Pass the exact participant ID from user object
      });
      
      // Get the exact LLM name and ID from the service
      let llmDisplayName = null;
      let llmId = null;
      
      try {
        // Only proceed if the service is available
        if (llmService && typeof llmService.getCurrentLLMConfig === 'function') {
          const currentLLM = await llmService.getCurrentLLMConfig();
          // Get the exact values without fallbacks
          llmDisplayName = currentLLM?.name;
          llmId = currentLLM?.id;
          console.log('Using exact LLM values from config:', { llmDisplayName, llmId });
        } else {
          console.log('LLM service or getCurrentLLMConfig not available');
        }
      } catch (error) {
        console.warn('Error getting LLM config:', error);
      }
      
      // Create a loading message matching the database fields exactly
      const loadingMessage = {
        id: `loading-${Date.now()}`,
        content: 'Thinking...',
        timestamp: new Date().toISOString(),
        author: llmDisplayName || 'Assistant',
        isLoading: true,
        participantId: null,
        llmId: llmId,
        llmName: llmDisplayName // Exact value from LLM config
      };
      
      setTopicMessages(prev => [...prev, loadingMessage]);
      
      // Scroll to bottom immediately after adding loading message
      setTimeout(() => scrollToBottom(true), 50);
      
      try {
        // Submit the prompt and get the response
        const response = await llmService.submitPrompt(message, {
          topicPathId: numericId,
          avatarId: 1,
          participantId: user?.id // Explicitly pass the participant ID
        });
        
        // Process relevant messages if they exist in the response
        if (response.relevantMessages && response.relevantMessages.length > 0) {
          console.log(`Processing ${response.relevantMessages.length} relevant messages from response`);
          
          // Format the relevant messages for display
          const formattedRelevantMessages = response.relevantMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            author: llmDisplayName || 'Assistant',
            topicId: msg.topicId, // Use the numeric ID for topic selection
            topicPath: msg.topicPath || 'Unknown', // Use human-readable path for display
            score: msg.score, // Keep the relevance score
            llmName: llmDisplayName // Include LLM name for consistency
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
          
          // Create the assistant message object with the LLM's display name
          const assistantMessage = {
            id: response.id || `resp-${Date.now()}`,
            content: response.content,
            timestamp: response.timestamp || new Date().toISOString(),
            author: llmDisplayName || 'Assistant',
            llmId: llmId,
            llmName: llmDisplayName
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
            displayHeader: 'System',
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
          displayHeader: 'System',
          isError: true
        }];
      });
    }
  };

  const renderTopicBreadcrumb = () => {
    if (!selectedTopic || !selectedTopic.id) return null;
    return <div className="topic-breadcrumb">{selectedTopic.name}</div>;
  };
  


  const handleShowRelatedMessages = async (messageId) => {
    // If clicking the same message, toggle the related messages off
    if (selectedMessageId === messageId) {
      setSelectedMessageId(null);
      setRelatedMessages([]);
      setRelatedMessagesError(null);
      return;
    }

    setSelectedMessageId(messageId);
    setIsLoadingRelated(true);
    setRelatedMessagesError(null);
    
    try {
      const response = await fetch(`/api/llm/messages/${messageId}/related?limit=5`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        setRelatedMessagesError('No related messages found.');
        setRelatedMessages([]);
      } else {
        setRelatedMessages(data);
      }
    } catch (error) {
      console.error('Error fetching related messages:', error);
      setRelatedMessagesError('Failed to load related messages. Please try again.');
      setRelatedMessages([]);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const renderMessage = (message) => {
    const isSelected = selectedMessageId === message.id;
    
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
    
    // Use the stored display header if available, otherwise use the author field
    const displayAuthor = message.displayHeader || message.author;
    
    // Debug logging for message display
    console.log('Message display info:', {
      id: message.id,
      displayHeader: message.displayHeader,
      author: message.author,
      displayAuthor,
      participantName: message.participantName,
      llmName: message.llmName,
      isUser: message.isUser,
      isTemporary: message.id?.toString().startsWith('temp-'),
      isLoading: message.isLoading
    });
    
    // Use the raw database fields directly without ANY processing
    // For user messages, use participantName from database
    // For assistant messages, use llmName from database
    const headerContent = message.isUser ? message.participantName : message.llmName;
    
    // Log what we're displaying to help debug
    console.log('Raw display data:', {
      messageId: message.id,
      isUser: message.isUser,
      participantName: message.participantName,
      llmName: message.llmName,
      headerContent
    });
    
    return (
      <div 
        key={message.id} 
        className={`message ${message.author.toLowerCase()} ${isSelected ? 'selected-message' : ''}`}
        onClick={() => isSelected && handleShowRelatedMessages(message.id)}
      >
        <div className="message-header">
          <span className="message-author">{headerContent}</span>
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
            {!message.isLoading && !message.isError && (
              <span 
                className={`related-messages-link ${isSelected ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the message click handler from firing
                  handleShowRelatedMessages(message.id);
                }}
                title={isSelected ? "Hide related messages" : "Show related messages"}
              >
                {isSelected ? ' × Hide related' : ' • See related'}
              </span>
            )}
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
          {selectedMessageId && (
            <RelatedMessages 
              messages={relatedMessages} 
              isLoading={isLoadingRelated} 
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
              selectedMessageId={selectedMessageId}
            />
          )}
          {relatedMessagesError && (
            <div className="related-messages-error">
              {relatedMessagesError}
            </div>
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="message-input-container">
        <form onSubmit={handleSubmit} className="message-input-form">
          <textarea
            ref={textareaRef}
            className="message-input"
            value={message}
            onChange={handleTextareaChange}
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageArea;