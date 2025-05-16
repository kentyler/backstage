import React from 'react';
import { useAuth } from '../services/auth/authContext';
import LogoutButton from './auth/LogoutButton';
import AppTitle from './AppTitle';
import './AppHeader.css';

/**
 * AppHeader component
 * Handles the main application header, including branding and user controls
 */
const AppHeader = () => {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="branding">
          <AppTitle />
        </div>
        
        <div className="user-controls">
          {user && (
            <>
              <span className="welcome-message">
                Welcome, {user.email}
              </span>
              <LogoutButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
