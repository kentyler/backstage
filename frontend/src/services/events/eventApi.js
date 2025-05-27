/**
 * API functions for logging events from the frontend
 */
import { API_BASE_URL } from '../../config';

/**
 * Log a user event to the server
 * 
 * @param {Object} eventData - Event data to log
 * @param {number} eventData.eventType - Event type ID
 * @param {string} eventData.description - Description of the event
 * @param {Object} eventData.details - Additional details about the event
 * @returns {Promise} - Promise that resolves when the event is logged
 */
export const logUserEvent = async (eventData) => {
  try {
    console.log('Logging user event:', eventData);
    
    const response = await fetch(`${API_BASE_URL}/api/events/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include', // Important for sending session cookies
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      // Don't throw error for event logging failures to avoid disrupting the UI
      console.error('Failed to log event:', await response.text());
      return { success: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log a prompt submission event
 * 
 * @param {string} promptContent - The content of the prompt
 * @param {number} topicId - The ID of the topic the prompt is associated with
 * @returns {Promise} - Promise that resolves when the event is logged
 */
export const logPromptSubmission = async (promptContent, topicId) => {
  try {
    const promptSummary = promptContent.length > 50 
      ? promptContent.substring(0, 50) + '...' 
      : promptContent;
    
    console.log(`Logging prompt submission for topic ${topicId}: ${promptSummary}`);
    
    return await logUserEvent({
      eventType: 7, // Event type ID for prompt submission (as seen in the database)
      description: `Prompt submitted for topic ID: ${topicId}`,
      details: {
        promptContent: promptSummary,
        topicId: topicId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error logging prompt submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log a response received event
 * 
 * @param {string} responseContent - The content of the response
 * @param {number} topicId - The ID of the topic the response is associated with
 * @returns {Promise} - Promise that resolves when the event is logged
 */
export const logResponseReceived = async (responseContent, topicId) => {
  try {
    const responseSummary = responseContent.length > 50 
      ? responseContent.substring(0, 50) + '...' 
      : responseContent;
    
    console.log(`Logging response received for topic ${topicId}: ${responseSummary}`);
    
    return await logUserEvent({
      eventType: 8, // Event type ID for response received (as seen in the database)
      description: `Response received for topic ID: ${topicId}`,
      details: {
        responseContent: responseSummary,
        topicId: topicId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error logging response received:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log a related topics click event
 * 
 * @param {number} topicId - The ID of the current topic
 * @param {Array} relatedTopics - The related topics being viewed
 * @returns {Promise} - Promise that resolves when the event is logged
 */
export const logRelatedTopicsClick = async (topicId, relatedTopics) => {
  try {
    console.log(`Logging related topics click for topic ${topicId}`);
    
    return await logUserEvent({
      eventType: 10, // Event type ID for related topics (as seen in the database)
      description: `User viewed related topics for topic ID: ${topicId}`,
      details: {
        topicId: topicId,
        relatedTopicsCount: relatedTopics?.length || 0,
        relatedTopicIds: relatedTopics?.map(topic => topic.topicId) || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error logging related topics click:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log a topic selection event
 * 
 * @param {number} topicId - The ID of the selected topic
 * @param {string} topicName - The name of the selected topic
 * @param {string} topicPath - The full path of the selected topic
 * @returns {Promise} - Promise that resolves when the event is logged
 */
export const logTopicSelection = async (topicId, topicName, topicPath) => {
  return logUserEvent({
    eventType: 4, // TOPIC_SELECTION event type
    description: `Selected topic: ${topicPath} (ID: ${topicId})`,
    details: {
      topicId,
      topicName,
      topicPath,
      timestamp: new Date().toISOString()
    }
  });
};
