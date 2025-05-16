// Main authentication module - exports from specialized modules

// Re-export core authentication functions
export { isAuthenticated, getAuthToken } from './auth/authState.js';
export { getCurrentUsername } from './auth/userSession.js';
export { redirectToLogin, redirectToHome } from './auth/authNavigation.js';

// Re-export orchestration functions
export { 
  updateAuthenticationState as updateUIForAuthState,
  initializeAuth as checkAuthStatus 
} from './auth/authOrchestrator.js';

// Re-export form handlers
export { 
  handleLoginSubmission as handleLogin,
  handleLogoutAction as handleLogout 
} from './auth/authForms.js';
