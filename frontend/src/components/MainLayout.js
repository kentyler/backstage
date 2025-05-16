import React from 'react';
import { useAuth } from '../services/auth/authContext';
import LogoutButton from './auth/LogoutButton';
import './MainLayout.css';

const MainLayout = () => {
  const { user } = useAuth();

  return (
    <div className="main-layout">
      <header className="app-header">
        <h1>Back-Stage</h1>
        <div className="user-controls">
          <span>Welcome, {user?.email}</span>
          <LogoutButton />
        </div>
      </header>
      
      <main className="app-content">
        <h2>Welcome to Back-Stage</h2>
        <p>Your authenticated dashboard will be shown here.</p>
      </main>
    </div>
  );
};

export default MainLayout;
