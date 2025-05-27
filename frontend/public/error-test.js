/**
 * Simple script to test error logging functionality
 */

// Frontend error logging
function logFrontendError(error, options) {
  const errorDetails = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    code: error.code || 'UNKNOWN_ERROR',
    context: options.context || 'error-test.js',
    severity: options.severity || 'error',
    source: options.source || 'ui',
    timestamp: new Date().toISOString(),
    browserInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href
    },
    metadata: options.metadata || {}
  };

  // Log to console
  console.error(`[${options.severity || 'ERROR'}] Error in ${options.context}:`, error.message);
  console.error(error.stack);

  // Send to backend
  return fetch('/api/log/error', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(errorDetails)
  })
  .then(response => response.json())
  .then(data => {
    return { 
      success: true,
      errorDetails,
      response: data
    };
  })
  .catch(e => {
    console.error('Failed to send error to backend:', e);
    return { 
      success: false,
      errorDetails,
      error: e.message
    };
  });
}

// Trigger a frontend error
function triggerFrontendError(errorType) {
  // Convert to camelCase for element IDs
  let elementType = errorType.toLowerCase();
  // Handle special case for API_CLIENT
  if (errorType === 'API_CLIENT') {
    elementType = 'apiClient';
  }
  
  const responseElementId = `${elementType}ErrorResponse`;
  const responseElement = document.getElementById(responseElementId);
  responseElement.style.display = 'block';
  responseElement.innerHTML = 'Sending error...';

  try {
    // Create an appropriate error based on the type
    let error;
    let context;
    let source;
    
    switch (errorType) {
      case 'UI':
        error = new Error('UI Interaction Error');
        error.code = 'UI_INTERACTION_FAILED';
        context = 'Button Click Handler';
        source = 'ui';
        break;
      case 'RENDER':
        error = new Error('Component Render Error');
        error.code = 'RENDER_EXCEPTION';
        context = 'ErrorTest.render()';
        source = 'render';
        break;
      case 'API_CLIENT':
        error = new Error('API Client Error');
        error.code = 'API_REQUEST_FAILED';
        context = 'UserService.fetchProfile()';
        source = 'api_client';
        break;
      default:
        error = new Error(`Unknown error type: ${errorType}`);
        context = 'Error Test Page';
        source = 'ui';
    }
    
    // Log the error
    logFrontendError(error, {
      context,
      source,
      severity: 'error',
      metadata: { testTriggered: true, errorType }
    })
    .then(result => {
      responseElement.innerHTML = `
        <strong>Error sent successfully!</strong><br>
        <pre>${JSON.stringify(result, null, 2)}</pre>
      `;
    })
    .catch(e => {
      responseElement.innerHTML = `
        <strong>Failed to send error:</strong><br>
        <pre>${e.message}</pre>
      `;
    });
    
  } catch (e) {
    responseElement.innerHTML = `
      <strong>Exception while testing:</strong><br>
      <pre>${e.message}</pre>
    `;
  }
}

// Trigger a backend error
function triggerBackendError(severity) {
  // Convert to camelCase for element IDs
  let elementType = severity.toLowerCase();
  
  const responseElementId = `${elementType}ErrorResponse`;
  const responseElement = document.getElementById(responseElementId);
  responseElement.style.display = 'block';
  responseElement.innerHTML = 'Triggering backend error...';

  fetch(`/api/log/test/${severity.toLowerCase()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ testData: 'This is test data' })
  })
  .then(response => response.json())
  .then(result => {
    responseElement.innerHTML = `
      <strong>Backend response:</strong><br>
      <pre>${JSON.stringify(result, null, 2)}</pre>
    `;
  })
  .catch(e => {
    responseElement.innerHTML = `
      <strong>Error communicating with backend:</strong><br>
      <pre>${e.message}</pre>
    `;
  });
}

// Test real login endpoint
function testRealLogin(scenario) {
  let responseElementId, email, password;
  
  switch(scenario) {
    case 'success':
      responseElementId = 'loginSuccessResponse';
      email = document.getElementById('successEmail').value;
      password = document.getElementById('successPassword').value;
      break;
    case 'failure':
      responseElementId = 'loginFailureResponse';
      email = document.getElementById('failureEmail').value;
      password = document.getElementById('failurePassword').value;
      break;
    case 'notfound':
      responseElementId = 'loginNotFoundResponse';
      email = document.getElementById('notfoundEmail').value;
      password = document.getElementById('notfoundPassword').value;
      break;
    default:
      console.error('Unknown scenario:', scenario);
      return;
  }

  const responseElement = document.getElementById(responseElementId);
  responseElement.style.display = 'block';
  responseElement.innerHTML = 'Testing real login...';

  // Call the actual login endpoint
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password
    })
  })
  .then(response => {
    return response.json().then(data => {
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    });
  })
  .then(result => {
    responseElement.innerHTML = `
      <strong>Login test result (${scenario}):</strong><br>
      <pre>${JSON.stringify(result, null, 2)}</pre>
    `;
    
    // Auto-refresh logs
    setTimeout(() => viewLogs(), 500);
  })
  .catch(e => {
    responseElement.innerHTML = `
      <strong>Error testing login:</strong><br>
      <pre>${e.message}</pre>
    `;
  });
}

// View recent error logs
function viewLogs() {
  const logOutput = document.getElementById('logOutput');
  logOutput.textContent = 'Fetching logs...';

  fetch('/api/log/recent', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    // Format logs in a more readable way
    if (data.logs && data.logs.length > 0) {
      // Map the event type IDs to readable names
      const eventTypeNames = {
        1: 'login successful',
        2: 'login unsuccessful',
        3: 'login not found'
      };
      
      // Format logs more nicely
      const formattedLogs = data.logs.map(log => ({
        id: log.id,
        timestamp: new Date(log.created_at).toLocaleString(),
        eventType: `${log.event_type_id} (${eventTypeNames[log.event_type_id] || 'unknown'})`,
        participantId: log.participant_id,
        description: log.description,
        details: log.details,
        ip: log.ip_address
      }));
      
      logOutput.textContent = JSON.stringify(formattedLogs, null, 2);
    } else {
      logOutput.textContent = 'No logs found.';
    }
  })
  .catch(e => {
    logOutput.textContent = `Error fetching logs: ${e.message}`;
  });
}
