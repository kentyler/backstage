import './test-setup.js';
import request from 'supertest';
import { expect } from 'chai';
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/connection.js';
import llmRouter from '../routes/api/llm.js';

// Simple console logger
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    return Promise.resolve();
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
    return Promise.resolve();
  }
};

// Create a test app with the llm router
const app = express();
app.use(express.json());

// Add middleware to set req.clientPool and configure schema search path
app.use(async (req, res, next) => {
  req.clientPool = pool; // Use the pool directly from the connection
  
  // Set the search path to include both dev and public schemas
  try {
    await pool.query('SET search_path TO dev, public');
  } catch (error) {
    console.error('Error setting search path:', error);
    return next(error);
  }
  
  next();
});

// Mount the router
app.use('/api/client-schemas', llmRouter);

// Create a test client
const agent = request.agent(app);

// Start the server
const server = app.listen(0); // Use a random available port

describe('LLM Configuration API', function() {
  // Increase timeout for database operations
  this.timeout(10000);

  // Test data - using basic test values
  const testClientSchemaId = 1; // Should exist in dev schema
  const testLLMId = 1; // Should exist in dev schema
  
  before(async function() {
    await logger.log('Setting up test database...');
    try {
      // Verify the database connection
      const { rows } = await pool.query('SELECT NOW() as now, current_schema() as current_schema, current_user as current_user');
      await logger.log(`Database connection established at: ${rows[0].now}`);
      await logger.log(`Current schema: ${rows[0].current_schema}`);
      await logger.log(`Current user: ${rows[0].current_user}`);
      
      // List all tables in the database
      const tables = await pool.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'dev')
        ORDER BY table_schema, table_name
      `);
      await logger.log('Available tables: ' + tables.rows.map(t => `${t.table_schema}.${t.table_name}`).join(', '));
      
      // Check if test data exists
      try {
        const llmCheck = await pool.query('SELECT id, name, provider, model FROM llms WHERE id = $1', [testLLMId]);
        await logger.log('LLM check result: ' + JSON.stringify(llmCheck.rows[0] || 'Not found', null, 2));
        
        const schemaCheck = await pool.query('SELECT id, name FROM client_schemas WHERE id = $1', [testClientSchemaId]);
        await logger.log('Client schema check result: ' + JSON.stringify(schemaCheck.rows[0] || 'Not found', null, 2));
        
        const prefTypes = await pool.query(`SELECT * FROM preference_types WHERE name = 'llm_preference'`);
        await logger.log('Preference types: ' + JSON.stringify(prefTypes.rows, null, 2));
        
        const clientPrefs = await pool.query(`SELECT * FROM client_schema_preferences WHERE client_schema_id = $1`, [testClientSchemaId]);
        await logger.log('Client schema preferences: ' + JSON.stringify(clientPrefs.rows, null, 2));
      } catch (dbError) {
        await logger.error('Error checking test data: ' + dbError.stack);
      }
    } catch (error) {
      await logger.error('Failed to verify test database setup: ' + error.stack);
      throw error;
    }
  });

  after(async function() {
    try {
      // Close the server
      if (server && typeof server.close === 'function') {
        await logger.log('Closing test server...');
        await new Promise((resolve) => server.close(resolve));
        await logger.log('Test server closed');
      }
    } catch (error) {
      await logger.error('Error during test cleanup: ' + error.stack);
      throw error;
    }
  });

  describe('GET /api/client-schemas/:clientSchemaId/llm-config', function() {
    it('should return 400 if client schema ID is missing', function(done) {
      logger.log('--- Testing missing client schema ID ---');
      agent
        .get('/api/client-schemas//llm-config')
        .expect(400)
        .end(async (err, res) => {
          if (err) {
            await logger.error('Test failed: ' + err.stack);
            return done(err);
          }
          await logger.log('Response for missing ID: ' + JSON.stringify(res.body, null, 2));
          done();
        });
    });

    it('should return 404 for non-existent client schema', function(done) {
      const nonExistentId = 9999;
      logger.log(`--- Testing non-existent client schema (ID: ${nonExistentId}) ---`);
      agent
        .get(`/api/client-schemas/${nonExistentId}/llm-config`)
        .expect(404)
        .end(async (err, res) => {
          if (err) {
            await logger.error('Test failed: ' + err.stack);
            return done(err);
          }
          await logger.log('Response for non-existent schema: ' + JSON.stringify(res.body, null, 2));
          done();
        });
    });

    it('should return 200 and LLM config for existing client schema', function(done) {
      logger.log(`--- Testing with client schema ID: ${testClientSchemaId} ---`);
      
      // First, verify the test data exists
      pool.query('SELECT * FROM llms WHERE id = $1', [testLLMId])
        .then(async llmResult => {
          await logger.log('LLM test data: ' + JSON.stringify(llmResult.rows[0] || 'Not found', null, 2));
          return pool.query('SELECT * FROM client_schemas WHERE id = $1', [testClientSchemaId]);
        })
        .then(async schemaResult => {
          await logger.log('Schema test data: ' + JSON.stringify(schemaResult.rows[0] || 'Not found', null, 2));
          
          // Now run the actual test
          return agent
            .get(`/api/client-schemas/${testClientSchemaId}/llm-config`)
            .expect(200);
        })
        .then(async res => {
          await logger.log('Response for existing schema: ' + JSON.stringify(res.body, null, 2));
          // The response should contain the LLM config object
          expect(res.body).to.be.an('object');
          done();
        })
        .catch(async err => {
          await logger.error('Test failed: ' + err.stack);
          done(err);
        });
    });
  });

  describe('PUT /api/client-schemas/:clientSchemaId/llm-config', function() {
    it('should return 400 if client schema ID is missing', function(done) {
      agent
        .put('/api/client-schemas//llm-config')
        .send({ llmId: testLLMId })
        .expect(400, done);
    });

    it('should return 400 if LLM ID is missing', function(done) {
      agent
        .put(`/api/client-schemas/${testClientSchemaId}/llm-config`)
        .send({})
        .expect(400, done);
    });

    it('should return 404 for non-existent client schema', function(done) {
      const nonExistentId = 9999;
      agent
        .put(`/api/client-schemas/${nonExistentId}/llm-config`)
        .send({ llmId: testLLMId })
        .expect(404, done);
    });

    it('should update LLM config for existing client schema', function(done) {
      agent
        .put(`/api/client-schemas/${testClientSchemaId}/llm-config`)
        .send({ llmId: testLLMId })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          // The response should contain the updated LLM config
          expect(res.body).to.be.an('object');
          done();
        });
    });
  });
});
