import React, { createContext, useContext, useState, useCallback } from 'react';
import { loginUser, logoutUser, checkAuthStatus } from './authApi';
import { initializeLLMService } from '../llmService';

// Default client schema ID - this should be configured based on your application's needs
const DEFAULT_CLIENT_SCHEMA_ID = 1;

const AuthContext = createContext(null);

/**
 * Provider component for authentication state
 * Manages auth state and provides login/logout functions
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      const data = await checkAuthStatus();
      setIsAuthenticated(data.authenticated);
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize LLM service
  const initializeLLM = useCallback(async (userId) => {
    try {
      console.log('Initializing LLM service...');
      const llmConfig = await initializeLLMService(userId, DEFAULT_CLIENT_SCHEMA_ID);
      console.log('LLM service initialized with config:', llmConfig);
      return llmConfig;
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
      return null;
    }
  }, []);

  // Handle login
  const login = useCallback(async (email, password) => {
    try {
      const data = await loginUser(email, password);
      setIsAuthenticated(true);
      setUser(data.user);
      
      // Only initialize LLM after successful login
      if (data.user) {
        await initializeLLM(data.user.id);
      }
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  }, [checkAuth]);

  // Handle logout
  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setIsAuthenticated(false);
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
