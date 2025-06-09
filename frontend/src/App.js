import React, { useEffect } from 'react';
import './App.css';

// Auth components
import { AuthProvider, useAuth } from './services/auth/authContext';
import AuthColumn from './components/auth/AuthColumn';
import GroupsColumn from './components/groups/GroupsColumn';

/**
 * Simple 2-column App - Auth + Groups
 * Clean layout focusing on core functionality
 */
function App() {
  console.log('📱 APP: Rendering...');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { checkAuth, isAuthenticated } = useAuth();
  
  useEffect(() => {
    console.log('📱 APP: Checking auth status on mount...');
    checkAuth();
  }, [checkAuth]);
  
  return (
    <div className="app-container">
      <div className="two-column-layout">
        
        {/* Column 1: Authentication */}
        <div className="column auth-column-wrapper">
          <AuthColumn />
        </div>
        
        {/* Column 2: Groups - Only visible when authenticated */}
        {isAuthenticated && (
          <div className="column groups-column-wrapper">
            <GroupsColumn />
          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;