// server.js
/**
 * Main entry point: start the Express server.
 * Supports both HTTP and HTTPS based on environment and certificate availability.
 * - Development: Uses mkcert certificates if available, falls back to HTTP
 * - Production: Adapts to platform SSL configuration
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import app from './app.js';
import { initLLMService, getLLMId, getLLMConfig, getDefaultLLMConfig } from './src/services/llmService.js';
import { initEmbeddingService } from './src/services/embeddingService.js';
import { getGrpConAvatarTurnsByConversation } from './src/db/grpConAvatarTurns/index.js';
import { getDefaultSchema, setDefaultSchema } from './src/config/schema.js';

// Load environment variables
dotenv.config();

// Define primary and fallback ports
const PRIMARY_HTTP_PORT = process.env.PORT || 3000;
const PRIMARY_HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const FALLBACK_HTTP_PORT = process.env.FALLBACK_PORT || 3001;
const FALLBACK_HTTPS_PORT = process.env.FALLBACK_HTTPS_PORT || 3444;

// Function to handle port conflicts
const createServerWithFallback = (serverType, primaryPort, fallbackPort, createServerFn) => {
  const server = createServerFn();
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${primaryPort} is already in use. Trying fallback port ${fallbackPort}...`);
      server.listen(fallbackPort);
    } else {
      console.error(`Error starting ${serverType} server:`, err);
    }
  });
  
  server.listen(primaryPort);
  return server;
};
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// __dirname shim for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For requests, the schema will be determined by the middleware based on the subdomain
console.log('Schema for requests will be determined by subdomain');

// LLM and Embedding services will be initialized on-demand when needed
console.log('LLM and Embedding services will be initialized on-demand when needed');

/**
 * Check if SSL certificates exist
 * @returns {Object|null} SSL options if certificates exist, null otherwise
 */
function getSSLOptions() {
  const sslDir = path.join(__dirname, 'ssl');
  const keyPath = path.join(sslDir, 'key.pem');
  const certPath = path.join(sslDir, 'cert.pem');
  
  try {
    // Check if both files exist
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
    }
  } catch (error) {
    console.error('Error reading SSL certificates:', error.message);
  }
  
  return null;
}

/**
 * Detect if the app is running behind a reverse proxy that handles SSL
 * Common in production environments like Heroku, Render, etc.
 */
function isBehindSSLProxy() {
  return process.env.BEHIND_PROXY === 'true' || 
         process.env.DYNO || // Heroku
         process.env.RENDER || // Render
         process.env.RAILWAY_STATIC_URL; // Railway
}

// In production, many platforms handle SSL termination for you
if (isProduction) {
  // If we're in production and likely behind a proxy that handles SSL
  if (isBehindSSLProxy()) {
    console.log('Running in production mode behind SSL-terminating proxy');
    // Just start HTTP server - SSL is handled by the platform
    createServerWithFallback(
      'HTTP', 
      PRIMARY_HTTP_PORT, 
      FALLBACK_HTTP_PORT, 
      () => http.createServer(app)
    ).on('listening', function() {
      const port = this.address().port;
      console.log(`Production server running on port ${port}`);
      console.log('SSL termination is handled by the hosting platform');
    });
  } else {
    // Production but not behind a known proxy - try to use SSL if available
    const sslOptions = getSSLOptions();
    
    if (sslOptions) {
      // Start HTTPS server with provided certificates
      createServerWithFallback(
        'HTTPS', 
        PRIMARY_HTTPS_PORT, 
        FALLBACK_HTTPS_PORT, 
        () => https.createServer(sslOptions, app)
      ).on('listening', function() {
        const port = this.address().port;
        console.log(`Production HTTPS server running on port ${port}`);
      });
    } else {
      console.warn('WARNING: Running in production without SSL certificates');
      // Start HTTP server with warning
      createServerWithFallback(
        'HTTP', 
        PRIMARY_HTTP_PORT, 
        FALLBACK_HTTP_PORT, 
        () => http.createServer(app)
      ).on('listening', function() {
        const port = this.address().port;
        console.log(`Production HTTP server running on port ${port}`);
        console.log('WARNING: Running without HTTPS in production is not recommended');
      });
    }
  }
} else {
// Development mode
  // Check if we're running on localhost and want to skip SSL
  const skipSSLForLocalhost = process.env.SKIP_SSL_FOR_LOCALHOST !== 'false';
  
  if (skipSSLForLocalhost) {
    console.log('Running on localhost: Skipping SSL setup for local development');
    
    // Start HTTP server without redirecting to HTTPS
    createServerWithFallback(
      'HTTP', 
      PRIMARY_HTTP_PORT, 
      FALLBACK_HTTP_PORT, 
      () => http.createServer(app)
    ).on('listening', function() {
      const port = this.address().port;
      console.log(`Development HTTP server running on http://localhost:${port}`);
      console.log('NOTE: Running in HTTP mode for localhost development (SSL skipped)');
      console.log('If you see EADDRINUSE errors, you can manually specify a different port:');
      console.log('PORT=3001 npm run dev');
    });
  }
  // If explicitly configured to use SSL even on localhost
  else if (sslOptions) {
    // Create HTTP server that redirects to HTTPS
    const redirectServer = createServerWithFallback(
      'HTTP Redirect', 
      PRIMARY_HTTP_PORT, 
      FALLBACK_HTTP_PORT, 
      () => http.createServer((req, res) => {
        // Get the actual port the server is running on
        const port = redirectServer.address().port;
        const httpsPort = httpsServer ? httpsServer.address().port : PRIMARY_HTTPS_PORT;
        
        res.writeHead(301, { 
          'Location': `https://localhost:${httpsPort}${req.url}` 
        });
        res.end();
      })
    ).on('listening', function() {
      const port = this.address().port;
      console.log(`Development HTTP server redirecting to HTTPS on port ${port}`);
    });
    
    // Create HTTPS server with mkcert certificates
    const httpsServer = createServerWithFallback(
      'HTTPS', 
      PRIMARY_HTTPS_PORT, 
      FALLBACK_HTTPS_PORT, 
      () => https.createServer(sslOptions, app)
    ).on('listening', function() {
      const port = this.address().port;
      console.log(`Development HTTPS server running on https://localhost:${port}`);
      console.log('Using mkcert-generated certificates for local development');
    });
  } else {
    // No certificates available, fall back to HTTP with warning
    console.warn('WARNING: No SSL certificates found in the ssl directory');
    console.warn('For secure local development, install mkcert and generate certificates');
    console.warn('See: https://github.com/FiloSottile/mkcert');
    
    // Start HTTP server
    createServerWithFallback(
      'HTTP', 
      PRIMARY_HTTP_PORT, 
      FALLBACK_HTTP_PORT, 
      () => http.createServer(app)
    ).on('listening', function() {
      const port = this.address().port;
      console.log(`Development HTTP server running on http://localhost:${port}`);
      console.log('NOTE: Using HTTP for development. For secure development, use mkcert to generate certificates.');
      console.log('If you see EADDRINUSE errors, you can manually specify a different port:');
      console.log('PORT=3001 npm run dev');
    });
  }
}