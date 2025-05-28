/**
 * @file services/fileUploads/createFileTurn.js
 * @description Creates a turn record for a file upload
 */

import { createGrpTopicAvatarTurn } from '../../db/grpTopicAvatarTurns/index.js';
import { MESSAGE_TYPE, TURN_KIND } from '../../db/grpTopicAvatarTurns/createGrpTopicAvatarTurn.js';

/**
 * Creates a turn record for a file upload
 * @param {number} topicId - The topic ID
 * @param {number} avatarId - The avatar ID
 * @param {number} turnIndex - The turn index
 * @param {Object} fileUpload - The file upload record
 * @param {number|null} participantId - The participant ID
 * @param {Object} pool - Database connection pool
 * @returns {Promise<Object>} The created turn and status
 */
export async function createFileTurn(topicId, avatarId, turnIndex, fileUpload, participantId, pool) {
  // Create message content describing the file upload
  const contentText = `File uploaded: ${fileUpload.filename} (ID: ${fileUpload.id})`;
  
  console.log('About to create turn record with content:', contentText);
  
  let turnCreated = false;
  let turnId = null;
  let turnData = null;
  
  try {
    // Create a turn record
    const turn = await createGrpTopicAvatarTurn(
      topicId,
      avatarId,
      turnIndex,
      contentText,
      null, // No vector for this message
      TURN_KIND.FILE, // 6 - File upload turn kind
      MESSAGE_TYPE.USER, // 1 - User message type
      null, // No template topic
      pool,
      null, // No LLM ID for file uploads
      participantId // Pass the participant ID
    );
    
    console.log(`Created turn with participantId: ${participantId}`);
    
    if (turn && turn.id) {
      console.log(`Created turn record for file upload: ${turn.id} in topic ${topicId}`);
      turnCreated = true;
      turnId = turn.id;
      
      // Create turn info object
      turnData = {
        id: turn.id,
        topicId: topicId,
        turnIndex
      };
    }
  } catch (error) {
    console.error('CRITICAL ERROR in createGrpTopicAvatarTurn:', error);
    console.error('Error stack:', error.stack);
    // Continue even if turn creation fails
  }
  
  // Return the turn creation status and data
  return {
    turnCreated,
    turnId,
    turnData
  };
}
