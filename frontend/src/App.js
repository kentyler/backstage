import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth components
import { AuthProvider, useAuth } from './services/auth/authContext';
import LoginForm from './components/auth/LoginForm';
import PrivateRoute from './components/auth/PrivateRoute';

// Main app components
import MainLayout from './components/MainLayout';

/**
 * App component
 * Sets up routing and authentication
 */
function App() {
  console.log('App component rendering...');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { checkAuth } = useAuth();
  
  useEffect(() => {
    console.log('Checking auth status...');
    checkAuth();
  }, [checkAuth]);
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          
          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
