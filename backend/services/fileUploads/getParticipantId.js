/**
 * @file services/fileUploads/getParticipantId.js
 * @description Utility to get the participant ID from a request
 */

/**
 * Gets the participant ID from the request or session
 * @param {Object} req - Express request object
 * @returns {number|null} The participant ID or null if not available
 */
export function getParticipantId(req) {
  let participantId = req.body.participantId || null;
  
  // If participantId is provided in the request, use it
  if (participantId) {
    console.log(`Using participant ID from request: ${participantId}`);
    return participantId;
  } 
  // Otherwise, try to get it from the session
  else if (req.session && req.session.userId) {
    participantId = req.session.userId;
    console.log(`Using participant ID from session: ${participantId}`);
    return participantId;
  } 
  
  console.warn('No participant ID available');
  return null;
}
