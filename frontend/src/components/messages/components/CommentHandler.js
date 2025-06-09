import React from 'react';
import grpTopicAvatarTurnService from '../../../services/grpTopicAvatarTurns/grpTopicAvatarTurnService';

/**
 * CommentHandler Component
 * 
 * Handles all comment-related functionality including:
 * - Adding comments between messages
 * - Calculating comment turn indices
 * - Submitting comments to the backend
 */
const CommentHandler = ({
  topicMessages,
  setTopicMessages,
  setPreventAutoScroll,
  selectedTopic,
  user
}) => {

  /**
   * Submit a comment after a specific message
   */
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
      
      // Calculate the comment turn_index
      let commentTurnIndex;
      if (nextMessage) {
        // Insert between current and next message
        commentTurnIndex = currentTurnIndex + (nextTurnIndex - currentTurnIndex) / 2;
        console.log(`Inserting comment between ${currentTurnIndex} and ${nextTurnIndex} at index ${commentTurnIndex}`);
      } else {
        // Add at the end (current + 1)
        commentTurnIndex = currentTurnIndex + 1;
        console.log(`Adding comment at end with index ${commentTurnIndex}`);
      }
      
      // Prepare the comment data
      const commentData = {
        topic_id: selectedTopic.id,
        participant_id: user.participant_id,
        content_text: commentText,
        message_type_id: 3, // Comment type
        turn_kind_id: 1,    // Human turn
        turn_index: commentTurnIndex,
        llm_id: null
      };
      
      console.log('Submitting comment:', commentData);
      
      // Submit the comment
      const response = await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(commentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit comment');
      }
      
      const newComment = await response.json();
      console.log('Comment submitted successfully:', newComment);
      
      // Add the new comment to the message list
      const newCommentMessage = {
        id: newComment.id,
        content_text: commentText,
        message_type_id: 3,
        turn_kind_id: 1,
        turn_index: commentTurnIndex,
        created_at: new Date().toISOString(),
        participant_name: user.name || 'You',
        llm_name: null,
        participant_id: user.participant_id,
        llm_id: null
      };
      
      // Insert the comment in the correct position
      const updatedMessages = [...topicMessages, newCommentMessage]
        .sort((a, b) => (a.turn_index || 0) - (b.turn_index || 0));
      
      setTopicMessages(updatedMessages);
      
      console.log('Comment added to messages at turn_index:', commentTurnIndex);
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert(`Error submitting comment: ${error.message}`);
    } finally {
      // Always reset the auto-scroll prevention after a delay
      setTimeout(() => {
        setPreventAutoScroll(false);
      }, 1000);
    }
  };

  /**
   * Add a comment after a specific message
   */
  const handleAddComment = (index, textareaRef, setMessage) => {
    // Set the input field to start with 'comment: '
    setMessage('comment: ');
    
    // Focus the input field
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * Check if a message is a comment
   */
  const isComment = (message) => {
    return message.message_type_id === 3;
  };

  /**
   * Get the parent message for a comment
   */
  const getCommentParent = (comment) => {
    if (!isComment(comment)) return null;
    
    // Find the message with the highest turn_index that's still less than this comment
    const sortedMessages = [...topicMessages]
      .filter(msg => msg.turn_index < comment.turn_index && msg.message_type_id !== 3)
      .sort((a, b) => b.turn_index - a.turn_index);
    
    return sortedMessages[0] || null;
  };

  return {
    handleSubmitComment,
    handleAddComment,
    isComment,
    getCommentParent
  };
};

export default CommentHandler;