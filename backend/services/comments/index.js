/**
 * @file services/comments/index.js
 * @description Utilities for handling comment messages
 */

import { getNextTurnIndex } from '../common/getNextTurnIndex.js';

/**
 * Determines if a message is a comment based on its content
 * @param {string} content - The message content
 * @returns {Object} Object containing isComment flag and cleaned content
 */
export function isComment(content) {
  if (!content) return { isComment: false, cleanContent: content };
  
  // Check if the first line starts with 'comment' or 'Comment'
  const firstLine = content.split('\n')[0].trim();
  const isComment = firstLine === 'comment' || firstLine === 'Comment';
  
  // If it's a comment, remove the 'comment' marker from the first line
  const cleanContent = isComment 
    ? content.replace(/^(comment|Comment)\s*\n?/, '').trim()
    : content;
    
  return {
    isComment,
    cleanContent
  };
}

/**
 * Stores a comment in the database
 * @param {number} topicId - The topic ID
 * @param {number} avatarId - The avatar ID
 * @param {string} content - The comment content (without the 'comment' marker)
 * @param {number|null} participantId - The participant ID
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object>} The created comment with its ID
 */
export async function storeComment(topicId, avatarId, content, participantId, pool) {
  if (!topicId) throw new Error('topicId is required');
  if (!avatarId) throw new Error('avatarId is required');
  if (!content) throw new Error('content is required');
  if (!pool) throw new Error('pool is required');
  
  const numericTopicId = parseInt(topicId, 10);
  if (isNaN(numericTopicId)) {
    throw new Error(`Invalid topic ID: ${topicId}`);
  }
  
  try {
    // Get the next turn index
    const turnIndex = await getNextTurnIndex(numericTopicId, pool);
    
    // Constants for comment records
    const turnKindId = 3; // Comment
    const messageTypeId = 1; // User message
    
    // Insert the comment
    const commentResult = await pool.query(
      'INSERT INTO grp_topic_avatar_turns (topic_id, avatar_id, turn_index, content_text, message_type_id, turn_kind_id, participant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [numericTopicId, avatarId, turnIndex, content, messageTypeId, turnKindId, participantId]
    );
    
    const commentId = commentResult.rows[0].id;
    console.log('Comment stored with ID:', commentId);
    
    // Return comment data structure expected by frontend
    return {
      id: commentId,
      content: content,
      isComment: true,
      comment_type: 'user_comment', // Special field for identifying comments
      turn_kind_id: turnKindId, // Make sure this is explicitly set
      style: 'comment', // Special field for styling
      success: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error storing comment:', error);
    throw error;
  }
}

/**
 * Processes a message, detects if it's a comment, and stores it if it is
 * @param {string} message - The raw message content
 * @param {number} topicId - The topic ID
 * @param {number} avatarId - The avatar ID
 * @param {number|null} participantId - The participant ID
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object|null>} The created comment or null if not a comment
 */
export async function processComment(message, topicId, avatarId, participantId, pool) {
  // First check if the message is a comment
  const { isComment: isCommentMessage, cleanContent } = isComment(message);
  
  // If it's not a comment, return null to indicate normal message processing
  if (!isCommentMessage) {
    return null;
  }
  
  // Store the comment and return its data
  return await storeComment(topicId, avatarId, cleanContent, participantId, pool);
}
