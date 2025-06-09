import React, { useState } from 'react';
import { useAuth } from '../../services/auth/authContext';
import './auth.css';

/**
 * LogoutButton component
 * Handles user logout and navigation
 */
const LogoutButton = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    console.log('🔐 LOGOUT: Button clicked');
    setLoading(true);
    try {
      const result = await logout();
      console.log('🔐 LOGOUT: Result:', result);
      
      if (result?.success) {
        console.log('🔐 LOGOUT: Successful - auth context will handle UI updates');
      } else {
        console.error('🔐 LOGOUT: Failed:', result?.error);
      }
    } catch (error) {
      console.error('🔐 LOGOUT: Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="logout-button"
    >
      {loading ? '...' : 'Logout'}
    </button>
  );
};

export default LogoutButton;
