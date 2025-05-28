/**
 * Authentication API service
 * Handles all authentication-related API calls
 */

// Use relative URL to work in all environments
const API_BASE_URL = '';



/**
 * Send login request to the server and initialize LLM service
 * @param {string} email User's email
 * @param {string} password User's password
 * @returns {Promise<Object>} Response data including token and user info
 */
export const loginUser = async (email, password) => {
  console.log('Attempting login with:', { email });
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  console.log('Login response:', data);
  
  return {
    success: true,
    user: { 
      id: data.user.id,
      email: email,
      username: data.user.username || email,  // Use the name from backend, fallback to email
      name: data.user.username || email.split('@')[0]  // Add a name field for display
    }
  };
};

/**
 * Send logout request to the server
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  console.log('Attempting to log out user');
  try {
    console.log('Making logout request to:', `${API_BASE_URL}/api/auth/logout`);
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Logout response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Logout failed with status:', response.status, errorText);
      throw new Error(`Logout failed: ${response.status} ${errorText}`);
    }

    console.log('Logout successful, clearing local storage token');
    // Clear fallback token
    localStorage.removeItem('auth_token');
    return { success: true };
  } catch (error) {
    console.error('Logout request error:', error);
    throw error;
  }
};

/**
 * Check current authentication status
 * @returns {Promise<Object>} User authentication status and data
 */
export const checkAuthStatus = async () => {
  try {
    console.log('Checking auth status...');
    const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      console.log('Auth status check failed:', response.status);
      return { authenticated: false };
    }

    const data = await response.json();
    console.log('Auth status response:', data);
    
    return {
      authenticated: data.authenticated,
      user: data.user
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false };
  }
};
