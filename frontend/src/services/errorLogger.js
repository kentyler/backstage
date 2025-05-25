/**
 * Frontend error logging service
 * @module services/errorLogger
 */

import React from 'react';

/**
 * Error severity levels
 * @enum {string}
 */
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Error sources
 * @enum {string}
 */
export const ERROR_SOURCE = {
  UI: 'ui',
  API_CLIENT: 'api_client',
  RENDER: 'render',
  EVENT_HANDLER: 'event_handler'
};

/**
 * Log an error in the frontend
 * @param {Error} error - The error object
 * @param {Object} options - Error logging options
 * @param {string} options.context - Where the error occurred (e.g., "UserProfile component")
 * @param {string} [options.severity=ERROR_SEVERITY.ERROR] - Error severity level
 * @param {string} [options.source=ERROR_SOURCE.UI] - Error source
 * @param {Object} [options.metadata={}] - Additional error metadata
 * @param {boolean} [options.reportToBackend=true] - Whether to report to backend
 * @returns {Object} Error details object
 */
export function logError(error, options) {
  const {
    context,
    severity = ERROR_SEVERITY.ERROR,
    source = ERROR_SOURCE.UI,
    metadata = {},
    reportToBackend = true
  } = options;

  const errorDetails = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    code: error.code || 'UNKNOWN_ERROR',
    context,
    severity,
    source,
    timestamp: new Date().toISOString(),
    componentType: 'frontend',
    browserInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    },
    ...metadata
  };

  // Log to console
  console.error(`[${severity.toUpperCase()}] Error in ${context}:`, error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // Report to backend for logging if requested
  if (reportToBackend) {
    reportErrorToBackend(errorDetails).catch(e => {
      // Fallback if reporting fails
      console.error('Failed to report error to backend:', e);
    });
  }

  return errorDetails;
}

/**
 * Send error details to backend for logging
 * @param {Object} errorDetails - Error details to send
 * @returns {Promise<Response>} Fetch response
 * @private
 */
async function reportErrorToBackend(errorDetails) {
  try {
    const response = await fetch('/api/log/error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(errorDetails)
    });
    
    if (!response.ok) {
      throw new Error(`Error reporting failed: ${response.status}`);
    }
    
    return response;
  } catch (e) {
    // Silent fail - we don't want error reporting to cause more errors
    console.error('Failed to send error to backend:', e);
    return null;
  }
}

/**
 * React error boundary component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, {
      context: `React Component: ${this.props.componentName || 'Unknown'}`,
      source: ERROR_SOURCE.RENDER,
      metadata: { reactErrorInfo: errorInfo }
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error in this component.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre>{this.state.error?.toString()}</pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
