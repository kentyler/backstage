// src/middleware/csrf.js
import Tokens from 'csrf';

// Create a new instance of the CSRF token generator
const tokens = new Tokens();

// Generate a secret for the user if they don't have one yet
export function generateCsrfSecret(req, res, next) {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }
  next();
}

// Generate a CSRF token based on the secret
export function generateCsrfToken(req, res, next) {
  if (!req.session.csrfSecret) {
    return res.status(500).json({ error: 'CSRF secret not found' });
  }
  
  // Generate a token based on the secret
  req.csrfToken = tokens.create(req.session.csrfSecret);
  next();
}

// Validate the CSRF token from the request
export function validateCsrfToken(req, res, next) {
  // Skip CSRF validation for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const secret = req.session.csrfSecret;
  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!secret || !token) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  if (!tokens.verify(secret, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

// Endpoint to get a new CSRF token
export function csrfTokenHandler(req, res) {
  if (!req.csrfToken) {
    return res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
  
  res.json({ csrfToken: req.csrfToken });
}