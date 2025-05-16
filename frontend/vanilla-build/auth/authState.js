// Authentication state management
import { log } from '../utils.js';

/**
 * Check if user is authenticated based on token presence
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Get the current authentication token
 */
export function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('jwt_token');
}

/**
 * Clear all authentication data
 */
export function clearAuthState() {
  localStorage.removeItem('token');
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('is_authenticated');
}

/**
 * Set authentication token
 */
export function setAuthToken(token) {
  localStorage.setItem('jwt_token', token);
  localStorage.setItem('is_authenticated', 'true');
}
