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
    setLoading(true);
    try {
      const result = await logout();
      if (result.success) {
        navigate('/login');
      } else {
        console.error('Logout failed:', result.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-controls">
      <span className="user-name">{user?.name || 'User'}</span>
      <button 
        onClick={handleLogout}
        disabled={loading}
        className={`logout-button ${loading ? 'loading' : ''}`}
      >
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
};

export default LogoutButton;
