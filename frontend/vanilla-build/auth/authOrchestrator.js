// Orchestrates authentication state changes
import { log } from '../utils.js';
import { isAuthenticated, getAuthToken } from './authState.js';
import { getCurrentUsername } from './userSession.js';
import { updateAuthUI } from './authUI.js';
import { handleFirstTimeLogin } from './authNavigation.js';
import { checkAuthStatus } from './authApi.js';

/**
 * Update UI and handle first-time login cases
 */
export function updateAuthenticationState() {
  const authenticated = isAuthenticated();
  const username = getCurrentUsername();
  
  updateAuthUI(authenticated, username);
  
  if (authenticated && handleFirstTimeLogin()) {
    window.location.reload();
  }
}

/**
 * Initialize authentication state
 * Checks token validity and updates UI accordingly
 */
export async function initializeAuth() {
  if (!isAuthenticated()) {
    log('No authentication token found');
    updateAuthenticationState();
    return false;
  }

  try {
    const token = getAuthToken();
    const authData = await checkAuthStatus(token);
    
    if (authData.authenticated) {
      log('Authentication valid');
      updateAuthenticationState();
      return true;
    }
  } catch (error) {
    log('Auth initialization error:', error);
  }

  return false;
}
