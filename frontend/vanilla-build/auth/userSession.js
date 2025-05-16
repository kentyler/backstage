// User session management
import { log } from '../utils.js';

/**
 * Get current user's username
 */
export function getCurrentUsername() {
  return localStorage.getItem('username') || 'User';
}

/**
 * Set current user's username
 */
export function setCurrentUsername(username) {
  if (username) {
    localStorage.setItem('username', username);
    log(`Username set to: ${username}`);
  }
}

/**
 * Clear user session data
 */
export function clearUserSession() {
  localStorage.removeItem('username');
  log('User session cleared');
}
