/**
 * Conversations module - Handles conversation-related functionality
 */

import { log, showDebug } from './utils.js';
import { getApiBaseUrl } from './api.js';

/**
 * Fetch conversations for a specific group
 * @param {number} groupId - The group ID
 * @returns {Promise<Array>} - Array of conversations
 */
export async function fetchConversations(groupId) {
  try {
    log(`Fetching conversations for group ${groupId}...`);
    
    // Use the correct endpoint format without getApiBaseUrl since we're running locally
    const response = await fetch(`/api/grpCons/by-group/${groupId}?typeId=1`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations. Status: ${response.status}`);
    }
    
    const conversations = await response.json();
    log(`Loaded ${conversations.length} conversations for group ${groupId}`);
    
    return conversations;
  } catch (error) {
    log(`Error fetching conversations: ${error.message}`, 'error');
    console.error('Conversation loading error:', error);
    return [];
  }
}

/**
 * Create a new conversation
 * @param {number} groupId - The group ID
 * @param {string} name - Conversation name
 * @param {string} description - Conversation description
 * @returns {Promise<Object>} - The created conversation
 */
export async function createConversation(groupId, name, description) {
  try {
    log(`Creating new conversation in group ${groupId}...`);
    
    const response = await fetch(`/api/grpCons`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        groupId,
        name,
        description,
        typeId: 1 // Regular conversation type
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create conversation. Status: ${response.status}`);
    }
    
    const conversation = await response.json();
    log(`Conversation created: ${conversation.name} (ID: ${conversation.id})`);
    
    return conversation;
  } catch (error) {
    log(`Error creating conversation: ${error.message}`, 'error');
    console.error('Conversation creation error:', error);
    throw error;
  }
}

/**
 * Display conversations in the conversations list
 * @param {Array} conversations - Array of conversation objects
 * @param {Function} onSelect - Callback function when a conversation is selected
 */
export function displayConversations(conversations, onSelect) {
  const conversationsList = document.getElementById('conversations-list');
  
  // Clear existing conversations
  conversationsList.innerHTML = '';
  
  if (conversations.length === 0) {
    const noConversationsMsg = document.createElement('div');
    noConversationsMsg.className = 'conversation-item';
    noConversationsMsg.textContent = 'No conversations yet';
    conversationsList.appendChild(noConversationsMsg);
    return;
  }
  
  // Add conversations to the list
  conversations.forEach(conversation => {
    const conversationItem = document.createElement('div');
    conversationItem.className = 'conversation-item';
    conversationItem.textContent = conversation.name;
    conversationItem.dataset.conversationId = conversation.id;
    
    // Add click event to handle conversation selection
    conversationItem.addEventListener('click', () => {
      // Update visual selection
      document.querySelectorAll('#conversations-list .conversation-item').forEach(item => {
        item.classList.remove('selected');
      });
      conversationItem.classList.add('selected');
      
      // Call the onSelect callback
      if (typeof onSelect === 'function') {
        onSelect(conversation);
      }
    });
    
    conversationsList.appendChild(conversationItem);
  });
}

/**
 * Handle new conversation button click
 * @param {number} groupId - The current group ID
 * @param {Function} onConversationCreated - Callback after conversation is created
 */
export function setupNewConversationButton(groupId, onConversationCreated) {
  const newConversationBtn = document.getElementById('new-conversation-btn');
  
  if (!newConversationBtn) return;
  
  newConversationBtn.addEventListener('click', async () => {
    const conversationName = prompt('Enter conversation name:');
    if (!conversationName) return;
    
    const conversationDescription = prompt('Enter conversation description (optional):');
    
    try {
      const newConversation = await createConversation(groupId, conversationName, conversationDescription || '');
      
      if (typeof onConversationCreated === 'function') {
        onConversationCreated(newConversation);
      }
    } catch (error) {
      alert(`Failed to create conversation: ${error.message}`);
    }
  });
}
