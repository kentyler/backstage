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
import grpTopicAvatarTurnService, { getTurnsByTopicId, deleteTurnById } from '../../services/grpTopicAvatarTurns/grpTopicAvatarTurnService';
import { logPromptSubmission, logResponseReceived, logRelatedTopicsClick } from '../../services/events/eventApi';
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
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false); // Track when waiting for LLM response
  
  // Related messages state
  const [relatedMessages, setRelatedMessages] = useState([]);
  const [relatedMessagesError, setRelatedMessagesError] = useState(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loadMessagesError, setLoadMessagesError] = useState(null);
  
  // Comment state
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const commentInputRef = useRef(null);
  const [commentAfterIndex, setCommentAfterIndex] = useState(null);
  
  // Handler for adding a comment after a specific message
  const handleAddComment = (index) => {
    // Set the comment position index
    setCommentAfterIndex(index);
    
    // Set the input field to start with 'comment: '
    setMessage('comment: ');
    
    // Focus the input field
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Define a flag to control when auto-scrolling happens
  const [preventAutoScroll, setPreventAutoScroll] = useState(false);
  
  // Handler for submitting a comment from the inline comment form
  const handleSubmitComment = async (commentText, index) => {
    console.log('Submitting comment for message at index:', index);
    
    if (!commentText.trim()) return;
    
    try {
      // Set the flag to prevent auto-scrolling during comment submission
      setPreventAutoScroll(true);
      
      // Get the current message that we're commenting on
      const currentMessage = topicMessages[index];
      if (!currentMessage) {
        console.error('Cannot find message at index:', index);
        return;
      }
      
      // Get the message's turn_index (this must exist since we're displaying it)
      const currentTurnIndex = currentMessage.turn_index !== undefined ? currentMessage.turn_index : index;
      
      // Find the next message by sorting all messages by turn_index
      const sortedMessages = [...topicMessages]
        .filter(msg => msg.turn_index !== undefined)
        .sort((a, b) => a.turn_index - b.turn_index);
      
      // Find the next message that comes after the current one
      let nextMessage = null;
      let nextTurnIndex = null;
      
      for (let i = 0; i < sortedMessages.length; i++) {
        if (sortedMessages[i].turn_index > currentTurnIndex) {
          nextMessage = sortedMessages[i];
          nextTurnIndex = nextMessage.turn_index;
          break;
        }
      }
      
      // Calculate the comment's turn_index
      let commentTurnIndex;
      if (nextMessage) {
        // Place comment halfway between current message and next message
        commentTurnIndex = currentTurnIndex + (nextMessage.turn_index - currentTurnIndex) / 2;
      } else {
        // If no next message, add a small increment
        commentTurnIndex = currentTurnIndex + 0.1;
      }
      
      console.log('Comment positioning calculation:', {
        currentMessage: currentMessage.id,
        currentTurnIndex,
        nextMessage: nextMessage?.id,
        nextTurnIndex: nextMessage?.turn_index,
        commentTurnIndex
      });
      
      console.log('Comment positioning details:', {
        currentMessage: currentMessage.id,
        currentIndex: index,
        currentTurnIndex,
        nextMessage: nextMessage?.id,
        nextTurnIndex,
        commentTurnIndex,
        allMessages: sortedMessages.map(m => ({ id: m.id, turn_index: m.turn_index }))
      });
      
      // Create a temporary comment message to display immediately
      const tempComment = {
        id: `temp-comment-${Date.now()}`,
        content: commentText,
        timestamp: new Date().toISOString(),
        author: user?.username || 'You',
        isUser: true,
        turn_kind_id: 3, // Comment type
        turn_index: commentTurnIndex // Add turn_index for proper positioning
      };
      
      // Calculate the current scroll position to maintain it after adding the comment
      const messageContainer = messageContainerRef.current;
      const scrollPositionBefore = messageContainer ? messageContainer.scrollTop : 0;
      
      // SIMPLIFIED APPROACH: Just insert the comment right after the message at index
      setTopicMessages(prev => {
        const newMessages = [...prev];
        
        // Insert the comment right after the message at the specified index
        newMessages.splice(index + 1, 0, tempComment);
        
        console.log('Inserted comment at position', index + 1);
        
        return newMessages;
      });
      
      // Close the comment input
      setActiveCommentIndex(null);
      
      // Only proceed with API call if we have a topic
      if (selectedTopic?.id) {
        // Use the dedicated comment API - this won't trigger an LLM response
        const result = await grpTopicAvatarTurnService.submitComment(commentText, {
          topicPathId: selectedTopic.id,
          participantId: user?.id,
          turn_index: commentTurnIndex, // Include the calculated fractional turn index
          referenceMessageId: currentMessage.id || null // Include the ID of the message being commented on
        });
        
        console.log('Comment submitted successfully:', result);
      }
      
      // Restore scroll position after a short delay to ensure DOM has updated
      setTimeout(() => {
        if (messageContainer) {
          messageContainer.scrollTop = scrollPositionBefore;
        }
        // Reset the prevention flag after the comment is fully processed
        setPreventAutoScroll(false);
      }, 150);
    } catch (error) {
      console.error('Error submitting comment:', error);
      setPreventAutoScroll(false); // Reset the flag on error
      // Could show an error message to the user here
    }
  };
  
  // Load messages when topic changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedTopic?.id) {
        //console.log('DEBUG - No topic selected, clearing messages');
        setTopicMessages([]);
        return;
      }
      
      //console.log('DEBUG - Loading messages for topic ID:', selectedTopic.id);
      setIsLoadingMessages(true);
      setLoadMessagesError(null);
      
      try {
        //console.log('DEBUG - Calling grpTopicAvatarTurnService.getTurnsByTopicId with:', selectedTopic.id);
        const messages = await grpTopicAvatarTurnService.getTurnsByTopicId(selectedTopic.id);
        
        //console.log(`DEBUG - Received ${messages?.length || 0} messages from API`);
        if (messages && messages.length > 0) {
          messages.forEach((msg, idx) => {
            console.log(`DEBUG - Message ${idx}:`, {
              id: msg.id,
              content: msg.content?.substring(0, 30) + (msg.content?.length > 30 ? '...' : ''),
              isUser: msg.isUser,
              turn_kind_id: msg.turn_kind_id,
              isComment: msg.turn_kind_id === 3
            });
          });
        } else {
          //console.log('DEBUG - No messages received or empty array');
        }
        
        setTopicMessages(messages);
      } catch (err) {
        console.error('Error loading messages:', err);
        setLoadMessagesError('Failed to load messages');
        setTopicMessages([]);
      } finally {
        setIsLoadingMessages(false);
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
        // console.log('[DEBUG] Fetching related messages for messageId:', messageId);
        // Fetch related messages from the grpTopicAvatarTurnService
        const result = await grpTopicAvatarTurnService.getRelatedMessages(messageId);
        // console.log('[DEBUG] Related messages API result:', result);
        //console.log('[DEBUG] Related messages array type:', Array.isArray(result) ? 'Array' : typeof result);
        //console.log('[DEBUG] Related messages length:', result ? result.length : 0);
        if (result && result.length > 0) {
          //console.log('[DEBUG] First related message:', result[0]);
          
          // Log the related topics click event
          if (selectedTopic?.id) {
            logRelatedTopicsClick(selectedTopic.id, result)
              .then(logResult => {
                if (!logResult?.success) {
                  console.log('Note: Related topics click event logging completed silently');
                }
              })
              .catch(error => {
                // Just log the error, don't disrupt the UI
                console.error('Failed to log related topics click:', error);
              });
          }
        }
        setRelatedMessages(result || []);
        //console.log('[DEBUG] State updated with related messages');
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
  
  // Auto-scroll only when a new topic is selected
  useEffect(() => {
    if (selectedTopic?.id) {
      // Use a small delay to ensure messages are loaded and rendered
      setTimeout(() => scrollToBottom(true), 300);
    }
  }, [selectedTopic?.id, scrollToBottom]);
  
  // Track when a normal prompt (not a comment) is submitted to trigger scrolling
  const [normalPromptSubmitted, setNormalPromptSubmitted] = useState(false);
  
  // Auto-scroll when LLM responses arrive after a normal prompt submission
  useEffect(() => {
    if (topicMessages.length === 0) return;
    
    const lastMessage = topicMessages[topicMessages.length - 1];
    
    // Only auto-scroll for LLM responses (!isUser) after a normal prompt was submitted
    if (normalPromptSubmitted && !lastMessage.isUser && !lastMessage.isFile) {
      // Use a small delay to ensure rendering is complete
      setTimeout(() => {
        scrollToBottom(true);
        // Reset the flag after scrolling
        setNormalPromptSubmitted(false);
      }, 100);
    }
  }, [topicMessages, normalPromptSubmitted, scrollToBottom]);

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
        // Check if this is a comment message
        const isCommentMessage = message.trim().startsWith('comment') || message.trim().startsWith('Comment');
        
        // Create a temporary message to display immediately
        const tempMessage = {
          id: `temp-${Date.now()}`,
          content: message,
          timestamp: new Date().toISOString(),
          author: user?.username || 'You',
          isUser: true,
          // If it's a comment, set the turn_kind_id to 3
          turn_kind_id: isCommentMessage ? 3 : 1
        };
        
        // Add the message to the UI at the correct position
        if (isCommentMessage && commentAfterIndex !== null) {
          // For comments, insert after the specified message index
          setTopicMessages(prev => {
            const newMessages = [...prev];
            // Insert the comment after the specified index
            newMessages.splice(commentAfterIndex + 1, 0, tempMessage);
            return newMessages;
          });
          // Reset the comment index after inserting
          setCommentAfterIndex(null);
        } else {
          // For regular messages, add to the end
          setTopicMessages(prev => [...prev, tempMessage]);
        }
        
        // Set waiting state for regular messages (not comments)
        if (!isCommentMessage) {
          setIsWaitingForResponse(true);
          // Set flag to indicate a normal prompt was submitted (for auto-scrolling)
          setNormalPromptSubmitted(true);
        }
        
        // Send the message to the server
        try {
          console.log('Sending message to server for topic:', selectedTopic?.id);
          
          // Log the prompt submission event
          if (selectedTopic?.id && !isCommentMessage) {
            logPromptSubmission(message, selectedTopic.id)
              .then(result => {
                if (!result?.success) {
                  console.log('Note: Prompt submission event logging completed silently');
                }
              })
              .catch(error => {
                // Just log the error, don't disrupt the UI
                console.error('Failed to log prompt submission:', error);
              });
          }
          
          // Make an API call to save the message
          if (selectedTopic?.id) {
            // Use the grpTopicAvatarTurnService to submit the message
            const result = await grpTopicAvatarTurnService.submitPrompt(message, {
              topicPathId: selectedTopic.id,
              participantId: user?.id
            });
            
           /* console.log('Message sent successfully:', result);
            //console.log('DEBUG - Response details:', {
              id: result?.id,
              content: result?.content?.substring(0, 30),
              turn_kind_id: result?.turn_kind_id,
              isComment: result?.isComment || result?.turn_kind_id === 3,
              isUserMessage: result?.isUser || false,
              llmResponseIncluded: !!result?.llmResponse,
              llmResponseId: result?.llmResponseId
            }); */
            
            // If the server returns the saved message, replace the temporary one
            if (result?.id) {
              // Update the message with author information
              const updatedMessage = {
                ...result,
                author: user?.username || 'You' // Ensure username is set correctly
              };
              
             /*
              console.log('DEBUG - Replacing temp message with:', {
                id: updatedMessage.id,
                tempId: tempMessage.id,
                content: updatedMessage.content?.substring(0, 30),
                turn_kind_id: updatedMessage.turn_kind_id
              }); */
              
              // With comments, we want to replace the temporary message
              // With LLM responses, we want to keep both user message and LLM response
              if (result.turn_kind_id === 3) { // Comment message - replace temp message
                //console.log('DEBUG - This is a comment message, replacing temp message');
                setTopicMessages(prev => 
                  prev.map(msg => msg.id === tempMessage.id ? updatedMessage : msg)
                );
              } else { 
                // This is a regular message + LLM response flow
               // console.log('DEBUG - This is a regular message + LLM response');
                
                // Simply add the AI response as a new message rather than replacing anything
                setTopicMessages(prev => [
                  ...prev,  // Keep all existing messages, including the temp user message
                  {
                    id: result.id,
                    content: result.content,
                    timestamp: result.timestamp || new Date().toISOString(),
                    author: 'Assistant',
                    isUser: false,
                    turn_kind_id: result.turn_kind_id,
                    relevantMessages: result.relevantMessages
                  }
                ]);
                
                // Log the response received event
                if (result.content && selectedTopic?.id) {
                  logResponseReceived(result.content, selectedTopic.id)
                    .then(logResult => {
                      if (!logResult?.success) {
                        console.log('Note: Response received event logging completed silently');
                      }
                    })
                    .catch(error => {
                      // Just log the error, don't disrupt the UI
                      console.error('Failed to log response received:', error);
                    });
                }
              }
              
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
              
              // Reset waiting state once response is received
              setIsWaitingForResponse(false);
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
      } else {
        // Reset waiting state if no message was sent
        setIsWaitingForResponse(false);
      }
      
      // Handle file upload if present
      if (file) {
        await handleFileUpload();
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // We're no longer auto-scrolling here - it's now handled by the useEffect hooks
      // that specifically watch for new topic selection and normal prompt submission
      
    } catch (error) {
      console.error('Error:', error);
      // Reset waiting state on error
      setIsWaitingForResponse(false);
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
          onAddComment={handleAddComment}
          activeCommentIndex={activeCommentIndex}
          setActiveCommentIndex={setActiveCommentIndex}
          handleSubmitComment={handleSubmitComment}
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
        isWaitingForResponse={isWaitingForResponse}
      />
    </div>
  );
};

export default MessageArea;