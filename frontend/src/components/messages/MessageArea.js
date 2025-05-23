import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MessageArea.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import llmService from '../../services/llmService';
import topicService from '../../services/topics/topicService';
import fileService from '../../services/files';
import grpTopicAvatarTurnService from '../../services/grpTopicAvatarTurns/grpTopicAvatarTurnService';
import RelatedMessages from './RelatedMessages';
import { useAuth } from '../../services/auth/authContext';

// Import extracted components
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import MessageItem from './components/MessageItem';

const MessageArea = ({ selectedTopic }) => {
  // Refs
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Authentication
  const { user } = useAuth();
  
  // Message state
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [topicMessages, setTopicMessages] = useState([]);
  
  // UI state
  const [expandedMessages, setExpandedMessages] = useState({});
  const [deletingFileId, setDeletingFileId] = useState(null);
  
  // Related messages state
  const [relatedMessages, setRelatedMessages] = useState([]);
  const [relatedMessagesError, setRelatedMessagesError] = useState(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load messages when topic changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedTopic?.id) {
        setTopicMessages([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const messages = await grpTopicAvatarTurnService.getTurnsByTopicId(selectedTopic.id);
        setTopicMessages(messages);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
        setTopicMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedTopic?.id]);
  
  // Load related messages when a message is selected
  useEffect(() => {
    const fetchRelatedMessages = async (messageId) => {
      if (!messageId) {
        setRelatedMessages([]);
        return;
      }
      
      setIsLoadingRelated(true);
      setRelatedMessagesError(null);
      
      try {
        console.log('[DEBUG] Fetching related messages for messageId:', messageId);
        // Fetch related messages from the grpTopicAvatarTurnService
        const result = await grpTopicAvatarTurnService.getRelatedMessages(messageId);
        console.log('[DEBUG] Related messages API result:', result);
        console.log('[DEBUG] Related messages array type:', Array.isArray(result) ? 'Array' : typeof result);
        console.log('[DEBUG] Related messages length:', result ? result.length : 0);
        if (result && result.length > 0) {
          console.log('[DEBUG] First related message:', result[0]);
        }
        setRelatedMessages(result || []);
        console.log('[DEBUG] State updated with related messages');
      } catch (error) {
        console.error('Error loading related messages:', error);
        setRelatedMessagesError('Failed to load related messages');
        setRelatedMessages([]);
      } finally {
        setIsLoadingRelated(false);
      }
    };
    
    fetchRelatedMessages(selectedMessageId);
    
  }, [selectedMessageId]);

  // Auto-resize textarea based on content
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`;
    }
  }, []);

  // Handle textarea changes
  const handleTextareaChange = useCallback((e) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  }, [autoResizeTextarea]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (force || messageContainerRef.current?.scrollTop > messageContainerRef.current?.scrollHeight - 600)) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async () => {
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadedFile = await fileService.uploadFile(formData);
      
      // Add file message
      setTopicMessages(prev => [...prev, {
        id: `file-${Date.now()}`,
        content: uploadedFile.filename,
        timestamp: new Date().toISOString(),
        author: user?.username || 'You',
        isFile: true,
        fileId: uploadedFile.id,
      }]);
      
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }, [file, user]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !file) return;
    
    try {
      // Handle text message
      if (message.trim()) {
        // Create a temporary message to display immediately
        const tempMessage = {
          id: `temp-${Date.now()}`,
          content: message,
          timestamp: new Date().toISOString(),
          author: user?.username || 'You',
          isUser: true
        };
        
        // Add the message to the UI
        setTopicMessages(prev => [...prev, tempMessage]);
        
        // Send the message to the server
        try {
          console.log('Sending message to server for topic:', selectedTopic?.id);
          
          // Make an API call to save the message
          if (selectedTopic?.id) {
            // Use the grpTopicAvatarTurnService to submit the message
            const result = await grpTopicAvatarTurnService.submitPrompt(message, {
              topicPathId: selectedTopic.id,
              avatarId: 1, // Default avatar ID 
              participantId: user?.id
            });
            
            console.log('Message sent successfully:', result);
            
            // If the server returns the saved message, replace the temporary one
            if (result?.id) {
              // Update the message with author information
              const updatedMessage = {
                ...result,
                author: user?.username || 'You' // Ensure username is set correctly
              };
              
              // Replace the temporary message with the updated one
              setTopicMessages(prev => 
                prev.map(msg => msg.id === tempMessage.id ? updatedMessage : msg)
              );
              
              // If there are relevant messages in the response, update the related messages state
              if (result.relevantMessages && result.relevantMessages.length > 0) {
                console.log('Found relevant messages in response:', result.relevantMessages);
                
                // Transform the messages to the format expected by RelatedMessages component
                const transformedMessages = result.relevantMessages.map((msg, index) => ({
                  id: `related-${index}-${Date.now()}`,
                  content: msg.snippet || '',
                  topicId: msg.topicId || 0,
                  topicPath: msg.topicPath || 'Unknown',
                  score: msg.score || 0
                }));
                
                // Set the related messages
                setRelatedMessages(transformedMessages);
                
                // Set the selected message ID to show the related messages panel
                setSelectedMessageId(result.id);
              }
            }
          } else {
            console.error('Cannot send message: No topic selected');
          }
        } catch (apiError) {
          console.error('Error sending message to server:', apiError);
          // Show error message to user
          setTopicMessages(prev => [...prev, {
            id: `error-${Date.now()}`,
            content: `Failed to send message: ${apiError.message || 'Unknown error'}`,
            timestamp: new Date().toISOString(),
            author: 'System',
            isSystem: true,
            isError: true
          }]);
        }
        
        // Clear the input field
        setMessage('');
      }
      
      // Handle file upload if present
      if (file) {
        await handleFileUpload();
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Scroll to bottom after a short delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(true), 100);
      
    } catch (error) {
      console.error('Error:', error);
    }
  }, [message, file, user, handleFileUpload, scrollToBottom]);

  // Handle file change
  const handleFileChange = useCallback(async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log('File selected:', { 
        name: selectedFile.name, 
        size: selectedFile.size, 
        type: selectedFile.type 
      });
      
      setFile(selectedFile);
      
      // Create a FormData object with just the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Prepare options object with topic information
      const options = {};
      if (selectedTopic?.id) {
        options.topicId = selectedTopic.id;
        console.log('Uploading file with topicId:', selectedTopic.id);
      } else {
        console.warn('No topic ID available for file upload');
      }
      
      // Add participant ID if available
      if (user?.id) {
        options.participantId = user.id;
        console.log('Adding participant ID to upload:', user.id);
      }
      
      // Show upload in progress message
      const uploadingMessageId = `uploading-${Date.now()}`;
      setTopicMessages(prev => [...prev, {
        id: uploadingMessageId,
        content: `Uploading ${selectedFile.name}...`,
        timestamp: new Date().toISOString(),
        author: 'System',
        isSystem: true
      }]);
      
      try {
        console.log('Starting file upload with options:', options);
        const uploadedFile = await fileService.uploadFile(formData, options);
        console.log('Upload successful:', uploadedFile);
        
        // Remove the uploading message
        setTopicMessages(prev => prev.filter(msg => msg.id !== uploadingMessageId));
        
        // Add file message to UI
        setTopicMessages(prev => [...prev, {
          id: `file-${Date.now()}`,
          content: uploadedFile.filename || selectedFile.name,
          timestamp: new Date().toISOString(),
          author: user?.username || 'You',
          isFile: true,
          fileId: uploadedFile.id,
          turnId: uploadedFile.turnId
        }]);
        
        // Clear file input
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Scroll to bottom after a short delay
        setTimeout(() => scrollToBottom(true), 100);
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Remove the uploading message
        setTopicMessages(prev => prev.filter(msg => msg.id !== uploadingMessageId));
        
        // Show detailed error message
        setTopicMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          content: `Failed to upload file: ${error.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date().toISOString(),
          author: 'System',
          isError: true
        }]);
      }
    }
  }, [selectedTopic, user, scrollToBottom]);

  // Handle file deletion
  const handleDeleteFile = async (fileId, turnId, event) => {
    event.stopPropagation(); // Prevent triggering any parent click handlers
    
    if (!fileId || !window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }
    
    setDeletingFileId(fileId);
    
    try {
      // Call the API to delete the file
      await fileService.deleteFile(fileId);
      
      // Update the UI to remove the deleted file
      setTopicMessages(prev => 
        prev.filter(msg => !(msg.fileId === fileId || msg.turnId === turnId))
      );
      
      // Show a success message
      setTopicMessages(prev => [...prev, {
        id: `deleted-${Date.now()}`,
        content: 'File deleted successfully',
        timestamp: new Date().toISOString(),
        author: 'System',
        isSystem: true
      }]);
      
    } catch (error) {
      console.error('Error deleting file:', error);
      
      // Show an error message
      setTopicMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        content: `Failed to delete file: ${error.message}`,
        timestamp: new Date().toISOString(),
        author: 'System',
        isError: true
      }]);
    } finally {
      setDeletingFileId(null);
    }
  };

  // Render a message
  const renderMessage = (msg, index) => {
    // Determine message type and author
    const isUser = msg.isUser || msg.author === 'You' || msg.role === 'user' || (msg.message_type_id === 1);
    const isSystem = msg.isSystem || msg.author === 'System';
    const messageClass = isSystem ? 'system-message' : isUser ? 'user-message' : 'ai-message';
    const isError = msg.isError;
    
    // Check if this is a file message that can be deleted
    const isFileMessage = msg.isFile && isUser && msg.fileId;
    
    // Get author name from the appropriate field based on message type
    let authorName = 'Unknown';
    if (isSystem) {
      authorName = 'System';
    } else if (isUser) {
      // Try multiple possible author field names
      authorName = msg.participantName || msg.author || user?.username || 'You';
    } else {
      // For AI messages
      authorName = msg.llmName || msg.author || 'AI Assistant';
    }
    
    // Format timestamp for display
    const timestamp = msg.timestamp || msg.created_at;
    const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
    
    return (
      <div 
        key={msg.id || index} 
        className={`message ${messageClass} ${expandedMessages[msg.id] ? 'expanded' : ''} ${isError ? 'error' : ''}`}
        onClick={() => {
          if (msg.id && !isSystem && !isError) {
            setSelectedMessageId(msg.id === selectedMessageId ? null : msg.id);
          }
        }}
      >
        <div className="message-header">
          <span className="message-author">{authorName}</span>
          <span className="message-timestamp">
            {formattedTime}
            {!isSystem && !isError && (
              <span 
                className={`related-messages-link ${selectedMessageId === msg.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id);
                }}
                title={selectedMessageId === msg.id ? "Hide related messages" : "Show related messages"}
              >
                {selectedMessageId === msg.id ? ' × Hide related' : ' • See related'}
              </span>
            )}
          </span>
        </div>
        <div className="message-content">
          {isFileMessage ? (
            <div className="file-message">
              <div className="file-info">
                <span className="file-name">{msg.content || 'Uploaded file'}</span>
                <button 
                  className="delete-file-btn"
                  style={{ backgroundColor: 'red', color: 'white', borderRadius: '50%' }}
                  onClick={(e) => handleDeleteFile(msg.fileId, msg.turnId, e)}
                  disabled={deletingFileId === msg.fileId}
                  title="Delete this file"
                >
                  {deletingFileId === msg.fileId ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faTimes} />
                  )}
                </button>
              </div>
              {msg.fileName && msg.fileName !== msg.content && (
                <div className="file-description">{msg.fileName}</div>
              )}
            </div>
          ) : (
            msg.content
          )}
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
        ) : (
          <div className="selected-topic">
            <i className="fas fa-folder"></i> {selectedTopic.name}
          </div>
        )}
      </div>

      {/* Messages container */}
      <div className="messages-container">
        {/* Topic messages */}
        <MessageList 
          topicMessages={topicMessages}
          messageContainerRef={messageContainerRef}
          messagesEndRef={messagesEndRef}
          selectedMessageId={selectedMessageId}
          setSelectedMessageId={setSelectedMessageId}
          expandedMessages={expandedMessages}
          deletingFileId={deletingFileId}
          handleDeleteFile={handleDeleteFile}
        />

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
      <MessageInput
        message={message}
        setMessage={setMessage}
        handleSubmit={handleSubmit}
        handleFileChange={handleFileChange}
        textareaRef={textareaRef}
        fileInputRef={fileInputRef}
        autoResizeTextarea={autoResizeTextarea}
      />
    </div>
  );
};

export default MessageArea;