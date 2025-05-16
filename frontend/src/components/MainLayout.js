import React from 'react';
import AppHeader from './AppHeader';
import './MainLayout.css';

/**
 * MainLayout component
 * Main layout container for the authenticated application
 */
const MainLayout = () => {
  return (
    <div className="main-layout">
      <AppHeader />
      
      <main className="app-content">
        <h2>Welcome</h2>
        <p>Your authenticated dashboard will be shown here.</p>
      </main>
    </div>
  );
};

export default MainLayout;
