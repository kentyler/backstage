import React, { useState } from 'react';
import { useAuth } from '../../services/auth/authContext';
import { useNavigate } from 'react-router-dom';
import './auth.css';

/**
 * LogoutButton component
 * Handles user logout and navigation
 */
const LogoutButton = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    console.log('LOGOUT BUTTON CLICKED!');
    setLoading(true);
    try {
      console.log('Calling logout function...');
      // Add a direct fetch call as a fallback
      try {
        const directResponse = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        console.log('Direct logout response:', directResponse);
      } catch (directError) {
        console.error('Direct logout error:', directError);
      }
      
      // Call the normal logout function too
      const result = await logout();
      console.log('Logout result:', result);
      
      if (result?.success) {
        console.log('Logout successful, navigating to login page');
        navigate('/login');
      } else {
        console.error('Logout failed:', result?.error);
        // Force navigate to login page anyway as a fallback
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigate to login page anyway
      navigate('/login');
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
