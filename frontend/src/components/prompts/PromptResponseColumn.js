import React, { useState, useRef } from 'react';
import { useAuth } from '../../services/auth/authContext';
import grpTopicAvatarTurnService from '../../services/grpTopicAvatarTurns/grpTopicAvatarTurnService';
import { logPromptSubmission, logResponseReceived } from '../../services/events/eventApi';
import './PromptResponseColumn.css';

/**
 * Prompt Response Column Component
 * Simple layout with prompt input at top and responses displayed below
 */
const PromptResponseColumn = ({ selectedTopicId, selectedTopicName }) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim() || !selectedTopicId) return;
    
    // Clear previous response when starting new submission
    setCurrentResponse(null);
    setCurrentPrompt(prompt);
    
    setIsSubmitting(true);
    
    try {
      console.log('📝 PROMPT: Submitting prompt for topic:', selectedTopicId);
      
      // Log the prompt submission event
      try {
        await logPromptSubmission(prompt, selectedTopicId);
      } catch (error) {
        console.error('Failed to log prompt submission:', error);
      }
      
      // Submit the prompt using the existing service
      const result = await grpTopicAvatarTurnService.submitPrompt(prompt, {
        topicPathId: selectedTopicId,
        avatarId: 1, // Default avatar ID
        participantId: user?.id
      });
      
      console.log('📝 PROMPT: Response received:', result);
      
      // Log the response received event
      try {
        if (result?.content) {
          await logResponseReceived(result.content, selectedTopicId);
        }
      } catch (error) {
        console.error('Failed to log response received:', error);
      }
      
      // Set the response
      if (result?.content) {
        setCurrentResponse({
          content: result.content,
          timestamp: new Date().toISOString(),
          id: result.id
        });
      }
      
      // Clear the input
      setPrompt('');
      removeFile();
      
    } catch (error) {
      console.error('📝 PROMPT: Error submitting prompt:', error);
      // Could show error state here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Don't render if no topic is selected
  if (!selectedTopicId) {
    return (
      <div className="prompt-response-column">
        <div className="prompt-response-header">
          <h3>💬 Prompt & Response</h3>
        </div>
        <div className="prompt-response-placeholder">
          <div className="placeholder-text">
            Select a topic to start prompting
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prompt-response-column">
      <div className="prompt-response-header">
        <h3>💬 Prompt & Response</h3>
        <div className="topic-info">
          <small>Topic: <strong>{selectedTopicName}</strong></small>
        </div>
      </div>

      {/* Prompt Input Area */}
      <div className="prompt-input-area">
        <form onSubmit={handleSubmit} className="prompt-form">
          <div className="input-row">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your prompt here..."
              className="prompt-textarea"
              disabled={isSubmitting}
              rows={3}
            />
            <div className="input-buttons">
              <button
                type="button"
                onClick={handleFileSelect}
                className="paperclip-button"
                disabled={isSubmitting}
                title="Attach file"
              >
                📎
              </button>
              <button
                type="submit"
                className="send-button"
                disabled={isSubmitting || !prompt.trim()}
              >
                {isSubmitting ? '⏳' : '➤'}
              </button>
            </div>
          </div>
          
          {/* File attachment display */}
          {file && (
            <div className="file-attachment">
              <span className="file-name">📄 {file.name}</span>
              <button
                type="button"
                onClick={removeFile}
                className="remove-file-button"
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
          )}
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".txt,.doc,.docx,.pdf,.md"
        />
      </div>

      {/* Response Area */}
      <div className="response-area">
        {isSubmitting && (
          <div className="sending-indicator">
            <div className="sending-animation">
              <div className="spinner"></div>
              <span>Sending prompt...</span>
            </div>
          </div>
        )}

        {currentPrompt && currentResponse && !isSubmitting && (
          <div className="conversation-display">
            <div className="prompt-display">
              <div className="message-label">Your Prompt:</div>
              <div className="message-content prompt-content">
                {currentPrompt}
              </div>
            </div>
            
            <div className="response-display">
              <div className="message-label">Response:</div>
              <div className="message-content response-content">
                {currentResponse.content}
              </div>
              <div className="response-timestamp">
                {new Date(currentResponse.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="prompt-response-status">
        <div className="status-item">
          📥 Topic: <strong>{selectedTopicName}</strong>
        </div>
        <div className="status-item">
          💬 Status: <strong>{isSubmitting ? 'Sending...' : 'Ready'}</strong>
        </div>
      </div>
    </div>
  );
};

export default PromptResponseColumn;