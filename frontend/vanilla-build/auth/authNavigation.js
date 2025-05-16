// Authentication-related navigation
import { log } from '../utils.js';

/**
 * Handles the special case of first-time login navigation to solve token processing issues.
 * 
 * When a user first logs in, there can be a race condition where the page loads
 * before the browser has fully processed the authentication tokens (cookies/localStorage).
 * This can cause the page to incorrectly think the user isn't authenticated.
 * 
 * This function works by:
 * 1. Detecting the 'firstLogin=true' URL parameter (added during login redirect)
 * 2. Cleaning up the URL to remove the parameter
 * 3. Allowing the main auth flow to trigger a page reload if needed
 * 
 * The reload gives the browser time to properly process auth tokens, preventing
 * the user from seeing the login screen again right after logging in.
 * 
 * @returns {boolean} True if this was a first-time login (URL had firstLogin=true)
 */
export function handleFirstTimeLogin() {
  const firstTimeLogin = new URLSearchParams(window.location.search).get('firstLogin');
  if (firstTimeLogin === 'true') {
    log('First time login detected, cleaning URL...');
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    return true;
  }
  return false;
}

/**
 * Redirect to login page
 */
export function redirectToLogin() {
  const loginPath = '/login.html';
  if (window.location.pathname !== loginPath) {
    log('Redirecting to login page');
    window.location.href = loginPath;
  }
}

/**
 * Redirect to home page
 */
export function redirectToHome() {
  const homePath = '/index.html';
  if (window.location.pathname !== homePath) {
    log('Redirecting to home page');
    window.location.href = homePath;
  }
}
