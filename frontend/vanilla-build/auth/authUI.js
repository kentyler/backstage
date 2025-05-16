// UI updates based on authentication state
import { log } from '../utils.js';

/**
 * Update UI elements based on authentication state
 */
export function updateAuthUI(isAuthenticated, username) {
  const nav = document.getElementById('main-nav');
  const loginSection = document.getElementById('login-section');
  const content = document.getElementById('content');
  const userInfo = document.getElementById('user-info');

  if (isAuthenticated) {
    log('Updating UI for authenticated user');
    if (nav) nav.style.display = 'block';
    if (loginSection) loginSection.style.display = 'none';
    if (content) content.style.display = 'block';
    if (userInfo) userInfo.textContent = `Welcome, ${username}`;
  } else {
    log('Updating UI for unauthenticated user');
    if (nav) nav.style.display = 'none';
    if (loginSection) loginSection.style.display = 'block';
    if (content) content.style.display = 'none';
  }
}
