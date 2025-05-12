// src/routes/direct-auth.js
/**
 * Direct authentication route that bypasses session and CSRF
 * This provides a reliable fallback when the main auth system has issues
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import { getParticipantById } from '../db/participants/index.js';
import { getAvailableLLMs } from '../services/llmService.js';

const router = express.Router();

// The JWT secret should be the same as used in auth.js
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * GET /api/direct-auth
 * A simplified authentication endpoint that only needs the JWT token
 * This bypasses the session system completely
 */
router.get('/', async (req, res) => {
  try {
    console.log('[Direct Auth] Received direct auth request');
    
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Direct Auth] No Bearer token found in request');
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'No token provided in Authorization header'
      });
    }
    
    // Extract the token
    const token = authHeader.slice(7);
    console.log(`[Direct Auth] Found token in header (length: ${token.length})`);
    
    // Check if JWT_SECRET is available
    if (!JWT_SECRET) {
      console.error('[Direct Auth] JWT_SECRET environment variable is missing');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'JWT secret not configured'
      });
    }
    
    // Verify the token directly
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log(`[Direct Auth] Successfully verified token for user ${decoded.participantId}`);
    } catch (jwtError) {
      console.error('[Direct Auth] Token verification failed:', jwtError.message);
      return res.status(401).json({
        error: 'Invalid token',
        message: jwtError.message
      });
    }
    
    // Get participant ID from the decoded token
    const { participantId, clientSchema } = decoded;
    
    // Create a simple pool for the specific client schema
    const simpleClientPool = {
      query: async (text, params) => {
        // This is a workaround to add schema prefix to queries
        if (clientSchema && text && !text.includes('SET search_path')) {
          // Make sure schema exists in the text
          if (!text.includes(clientSchema)) {
            // Add schema name to the table references
            const modifiedText = text.replace(
              /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
              `FROM ${clientSchema}.$1`
            ).replace(
              /JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
              `JOIN ${clientSchema}.$1`
            ).replace(
              /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
              `UPDATE ${clientSchema}.$1`
            ).replace(
              /INSERT INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
              `INSERT INTO ${clientSchema}.$1`
            );
            
            // Execute the query with the schema prefix
            try {
              const result = await global.pool.query(modifiedText, params);
              return result;
            } catch (error) {
              console.error(`[Direct Auth] Error executing schema query: ${error.message}`);
              // Try without schema modification as fallback
              return await global.pool.query(text, params);
            }
          }
        }
        
        // If no schema handling needed or schema already in query, just execute normally
        return await global.pool.query(text, params);
      }
    };
    
    // Attempt to fetch participant details
    let participant = null;
    try {
      participant = await getParticipantById(participantId, simpleClientPool);
    } catch (dbError) {
      console.warn(`[Direct Auth] Could not fetch participant details: ${dbError.message}`);
      // Continue without participant details
    }
    
    // Get available LLMs if possible
    let availableLLMs = [];
    try {
      availableLLMs = await getAvailableLLMs();
    } catch (llmError) {
      console.warn(`[Direct Auth] Could not fetch LLMs: ${llmError.message}`);
    }
    
    // Return successful authentication response
    return res.json({
      user: {
        participantId,
        participant,
        clientSchema,
        authMethod: 'direct',
      },
      availableLLMs,
      message: 'Authentication successful via direct JWT verification'
    });
    
  } catch (error) {
    console.error('[Direct Auth] Unexpected error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

export default router;
