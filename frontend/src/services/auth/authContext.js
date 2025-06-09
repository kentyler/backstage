import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginUser, logoutUser, checkAuthStatus } from './authApi';

const AuthContext = createContext(null);

/**
 * Clean Auth Provider - only handles authentication
 * Provides participant_id and client_id to other areas
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Console logging for auth state changes
  useEffect(() => {
    console.log('🔐 AUTH STATE:', {
      isAuthenticated,
      participantId,
      clientId,
      user: user ? { id: user.id, email: user.email } : null
    });
  }, [isAuthenticated, participantId, clientId, user]);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    console.log('🔐 AUTH: Checking authentication status...');
    try {
      const data = await checkAuthStatus();
      
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setParticipantId(data.user.id);
        setClientId(data.user.client_id || 1); // Extract client_id from user data
        console.log('🔐 AUTH: Authentication verified', {
          participantId: data.user.id,
          clientId: data.user.client_id || 1
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setParticipantId(null);
        setClientId(null);
        console.log('🔐 AUTH: Not authenticated');
      }
    } catch (error) {
      console.error('🔐 AUTH: Check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setParticipantId(null);
      setClientId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle login - ONLY authentication, nothing else
  const login = useCallback(async (email, password) => {
    console.log('🔐 AUTH: Attempting login for:', email);
    try {
      const data = await loginUser(email, password);
      
      if (data.success && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setParticipantId(data.user.id);
        setClientId(data.user.client_id || 1);
        
        console.log('🔐 AUTH: Login successful!', {
          participantId: data.user.id,
          clientId: data.user.client_id || 1,
          email: data.user.email
        });
        
        return { success: true };
      } else {
        console.log('🔐 AUTH: Login failed - invalid response');
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      console.error('🔐 AUTH: Login error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Handle logout
  const logout = useCallback(async () => {
    console.log('🔐 AUTH: Attempting logout...');
    try {
      await logoutUser();
      setIsAuthenticated(false);
      setUser(null);
      setParticipantId(null);
      setClientId(null);
      console.log('🔐 AUTH: Logout successful');
      return { success: true };
    } catch (error) {
      console.error('🔐 AUTH: Logout error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const value = {
    // Auth state
    isAuthenticated,
    loading,
    user,
    
    // Key IDs for other areas
    participantId,
    clientId,
    
    // Auth actions
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
