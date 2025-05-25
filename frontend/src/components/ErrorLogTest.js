import React, { useState } from 'react';
import { logError, ERROR_SEVERITY, ERROR_SOURCE } from '../services/errorLogger';

const ErrorLogTest = () => {
  const [frontendResponse, setFrontendResponse] = useState(null);
  const [backendResponse, setBackendResponse] = useState(null);
  
  const triggerFrontendError = (source) => {
    try {
      // Create a test error
      const error = new Error(`Test ${source} error`);
      error.code = `TEST_${source.toUpperCase()}_ERROR`;
      
      // Deliberately throw the error
      throw error;
    } catch (error) {
      // Log the error
      const result = logError(error, {
        context: `ErrorLogTest.${source}Test`,
        source: ERROR_SOURCE[source],
        severity: ERROR_SEVERITY.ERROR,
        metadata: { testTriggered: true }
      });
      
      // Update state
      setFrontendResponse(result);
    }
  };
  
  const triggerBackendError = async (severity) => {
    try {
      const response = await fetch(`/api/log/test/${severity.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      setBackendResponse(result);
    } catch (error) {
      setBackendResponse({
        error: true,
        message: error.message
      });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Error Logging Test</h1>
      <p>This page allows you to test the error logging system.</p>
      
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
        <h2>Frontend Error Tests</h2>
        <div>
          <button 
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
            onClick={() => triggerFrontendError('UI')}
          >
            Trigger UI Error
          </button>
          
          <button 
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
            onClick={() => triggerFrontendError('API_CLIENT')}
          >
            Trigger API Client Error
          </button>
          
          <button 
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
            onClick={() => triggerFrontendError('RENDER')}
          >
            Trigger Render Error
          </button>
        </div>
        
        {frontendResponse && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h3>Frontend Error Response:</h3>
            <pre style={{ overflow: 'auto' }}>
              {JSON.stringify(frontendResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px' }}>
        <h2>Backend Error Tests</h2>
        <div>
          <button 
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
            onClick={() => triggerBackendError('ERROR')}
          >
            Trigger Basic Error
          </button>
          
          <button 
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
            onClick={() => triggerBackendError('WARNING')}
          >
            Trigger Warning
          </button>
          
          <button 
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
            onClick={() => triggerBackendError('CRITICAL')}
          >
            Trigger Critical Error
          </button>
        </div>
        
        {backendResponse && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h3>Backend Error Response:</h3>
            <pre style={{ overflow: 'auto' }}>
              {JSON.stringify(backendResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorLogTest;
