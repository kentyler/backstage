import React, { useState, useRef, useEffect } from 'react';
import './MessageArea.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import llmService from '../../services/llmService';
import { getTurnsByTopicId, deleteTurnById } from '../../services/grpTopicAvatarTurns/grpTopicAvatarTurnService';
import { logPromptSubmission, logResponseReceived } from '../../services/events/eventApi';
import RelatedMessages from './RelatedMessages';
import { useAuth } from '../../services/auth/authContext';

// Import extracted components and hooks
import FileUploadManager from './components/FileUploadManager';
import CommentHandler from './components/CommentHandler';
import MessageRenderer from './components/MessageRenderer';
import useScrollManager from './hooks/useScrollManager';

const MessageArea = ({ selectedTopic }) => {
  // Refs
  const textareaRef = useRef(null);
  
  // Authentication
  const { user } = useAuth();
  
  // Scroll management
  const {
    messagesEndRef,
    messageContainerRef,
    preventAutoScroll,
    setPreventAutoScroll,
    scrollToBottom,
    preventAutoScrollTemporarily
  } = useScrollManager();
  
  // Message state
  const [message, setMessage] = useState('');
  const [topicMessages, setTopicMessages] = useState([]);
  
  // UI state
  const [expandedMessages, setExpandedMessages] = useState({});
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  // File state
  const [file, setFile] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);
  
  // Related messages state
  const [relatedMessages, setRelatedMessages] = useState([]);
  const [relatedMessagesError, setRelatedMessagesError] = useState(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loadMessagesError, setLoadMessagesError] = useState(null);
  
  // Comment state
  const [commentAfterIndex, setCommentAfterIndex] = useState(null);
  const [normalPromptSubmitted, setNormalPromptSubmitted] = useState(false);

  // Initialize comment handler
  const commentHandler = CommentHandler({
    topicMessages,
    setTopicMessages,
    setPreventAutoScroll,
    selectedTopic,
    user
  });

  // Load messages when topic changes
  useEffect(() => {
    if (!selectedTopic?.id) {
      setTopicMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setLoadMessagesError(null);

      try {
        console.log('Loading messages for topic:', selectedTopic.id);
        const messages = await getTurnsByTopicId(selectedTopic.id);
        console.log('Loaded messages:', messages);
        
        const sortedMessages = messages.sort((a, b) => (a.turn_index || 0) - (b.turn_index || 0));
        setTopicMessages(sortedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        setLoadMessagesError('Failed to load messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedTopic?.id]);

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Handle textarea changes
  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  };

  // Handle main form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !file) return;
    if (!selectedTopic?.id) return;

    const messageText = message.trim();
    const isComment = messageText.startsWith('comment:');
    
    try {
      if (isComment) {
        // Handle comment submission
        const commentText = messageText.replace(/^comment:\s*/, '');
        if (commentAfterIndex !== null) {
          await commentHandler.handleSubmitComment(commentText, commentAfterIndex);
          setCommentAfterIndex(null);
        }
      } else {
        // Handle normal message submission
        setIsWaitingForResponse(true);
        setNormalPromptSubmitted(true);
        
        // Log prompt submission
        await logPromptSubmission(selectedTopic.id, messageText);
        
        // Submit to LLM service
        const response = await llmService.sendPrompt(messageText, selectedTopic.id, file?.id);
        
        // Log response received
        await logResponseReceived(selectedTopic.id, response);
        
        // Reload messages to get the latest
        const updatedMessages = await getTurnsByTopicId(selectedTopic.id);
        const sortedMessages = updatedMessages.sort((a, b) => (a.turn_index || 0) - (b.turn_index || 0));
        setTopicMessages(sortedMessages);
      }
      
      // Clear form
      setMessage('');
      setFile(null);
      
    } catch (error) {
      console.error('Error submitting:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsWaitingForResponse(false);
      setNormalPromptSubmitted(false);
    }
  };

  // Handle adding comment
  const handleAddComment = (index) => {
    setCommentAfterIndex(index);
    commentHandler.handleAddComment(index, textareaRef, setMessage);
  };

  // Handle showing related messages
  const handleShowRelated = async (messageId) => {
    setSelectedMessageId(messageId);
    setIsLoadingRelated(true);
    setRelatedMessagesError(null);

    try {
      const response = await fetch(`/api/message-search/messages/${messageId}/related?limit=5`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch related messages');
      }

      const related = await response.json();
      setRelatedMessages(related);
    } catch (err) {
      console.error('Error fetching related messages:', err);
      setRelatedMessagesError('Failed to fetch related messages');
      setRelatedMessages([]);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteTurnById(messageId);
      // Reload messages
      const updatedMessages = await getTurnsByTopicId(selectedTopic.id);
      const sortedMessages = updatedMessages.sort((a, b) => (a.turn_index || 0) - (b.turn_index || 0));
      setTopicMessages(sortedMessages);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(`Error deleting message: ${error.message}`);
    }
  };

  // Toggle message expansion
  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Render topic header
  const renderTopicHeader = () => (
    <div className="topic-header">
      <h3>💬 {selectedTopic?.name || selectedTopic?.path || 'No Topic Selected'}</h3>
    </div>
  );

  // Render messages
  const renderMessages = () => {
    if (isLoadingMessages) {
      return (
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Loading messages...</span>
        </div>
      );
    }

    if (loadMessagesError) {
      return (
        <div className="error-state">
          <span>Error: {loadMessagesError}</span>
        </div>
      );
    }

    if (topicMessages.length === 0) {
      return (
        <div className="empty-state">
          <p>No messages yet. Start the conversation!</p>
        </div>
      );
    }

    return topicMessages.map((msg, index) => (
      <MessageRenderer
        key={msg.id}
        message={msg}
        index={index}
        isComment={commentHandler.isComment(msg)}
        expandedMessages={expandedMessages}
        onToggleExpand={toggleMessageExpansion}
        onAddComment={handleAddComment}
        onDeleteMessage={handleDeleteMessage}
        onShowRelated={handleShowRelated}
        deletingFileId={deletingFileId}
        user={user}
      />
    ));
  };

  // Don't render if no topic is selected
  if (!selectedTopic) {
    return (
      <div className="message-area">
        <div className="no-topic-selected">
          <p>Select a topic to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-area">
      {renderTopicHeader()}
      
      <div className="messages-container" ref={messageContainerRef}>
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-form">
        <FileUploadManager
          file={file}
          setFile={setFile}
          deletingFileId={deletingFileId}
          setDeletingFileId={setDeletingFileId}
          onFileUploadComplete={(uploadedFile) => {
            console.log('File upload completed:', uploadedFile);
          }}
        />
        
        <div className="input-section">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            placeholder={commentAfterIndex !== null ? "Add your comment..." : "Type your message..."}
            className="message-input"
            rows={1}
          />
          
          <button 
            type="submit" 
            disabled={(!message.trim() && !file) || isWaitingForResponse}
            className="send-button"
          >
            {isWaitingForResponse ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>

      {relatedMessages.length > 0 && (
        <RelatedMessages
          messages={relatedMessages}
          isLoading={isLoadingRelated}
          error={relatedMessagesError}
          selectedMessageId={selectedMessageId}
          onClose={() => {
            setRelatedMessages([]);
            setSelectedMessageId(null);
          }}
        />
      )}
    </div>
  );
};

export default MessageArea;