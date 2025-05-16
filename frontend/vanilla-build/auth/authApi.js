// API communication for authentication
import { log } from '../utils.js';
import { getApiBaseUrl, fetchCsrfToken } from '../api.js';

/**
 * Send login request to the server
 * @param {string} email User's email
 * @param {string} password User's password
 * @returns {Promise<Object>} Response data and status
 */
export async function loginUser(email, password) {
  const response = await fetch(`${getApiBaseUrl()}/api/participants/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });

  const data = await response.json();
  return { 
    ok: response.ok, 
    data,
    status: response.status
  };
}

/**
 * Send logout request to the server
 * @returns {Promise<Object>} Response status
 */
export async function logoutUser() {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${getApiBaseUrl()}/api/participants/logout`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      'Accept': 'application/json'
    },
    credentials: 'include'
  });

  return { 
    ok: response.ok, 
    status: response.status,
    statusText: response.statusText 
  };
}

/**
 * Check authentication status with the server
 * @param {string} token Authentication token
 * @returns {Promise<Object>} Auth status and user data
 */
export async function checkAuthStatus(token) {
  const headers = {
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const response = await fetch(`${getApiBaseUrl()}/api/participants/status`, {
    method: 'GET',
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Auth check failed');
  }

  return response.json();
}
