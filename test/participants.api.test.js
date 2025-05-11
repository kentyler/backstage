/**
 * @file test/participants.api.test.js
 * @description API integration tests for participant endpoints
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import participantsRouter from '../src/routes/participants.js';
import { pool } from '../src/db/connection.js';

// Import test setup to ensure correct schema
import './setup.js';

// Create a test app with the participants router
const app = express();
app.use(express.json());
app.use('/api/participants', participantsRouter);

// Create a supertest instance
const request = supertest(app);

// Test data
const TEST_PARTICIPANT = {
  name: 'API Test User',
  email: 'api-test-user@example.com',
  password: 'test-password-123'
};

// Variables to store test data IDs
let testParticipantId;

describe('Participants API', () => {
  // Set up test data before all tests
  beforeAll(async () => {
    // Make sure schema is set to 'dev' for all tests in this suite
    await pool.query('SET search_path TO dev, public;');
    
    // Clean up any existing test data with the same email
    await pool.query(
      'DELETE FROM participants WHERE email = $1',
      [TEST_PARTICIPANT.email]
    );
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up test participant if it exists
    if (testParticipantId) {
      await pool.query(
        'DELETE FROM participants WHERE id = $1',
        [testParticipantId]
      );
    }
    
    await pool.end();
  });

  describe('POST /api/participants', () => {
    it('should create a new participant', async () => {
      const response = await request
        .post('/api/participants')
        .send(TEST_PARTICIPANT)
        .expect(201);
      
      // Store the participant ID for later tests
      testParticipantId = response.body.id;
      
      // Verify response
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(TEST_PARTICIPANT.name);
      expect(response.body.email).toBe(TEST_PARTICIPANT.email);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
    });
    
    it('should return 400 when creating a participant with duplicate email', async () => {
      await request
        .post('/api/participants')
        .send(TEST_PARTICIPANT)
        .expect(400);
    });
    
    it('should return 400 when creating a participant with missing fields', async () => {
      await request
        .post('/api/participants')
        .send({ name: 'Missing Fields User' })
        .expect(400);
    });
  });
  
  describe('GET /api/participants', () => {
    it('should retrieve all participants', async () => {
      const response = await request
        .get('/api/participants')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Find our test participant
      const testParticipant = response.body.find(p => p.id === testParticipantId);
      expect(testParticipant).toBeDefined();
      expect(testParticipant.name).toBe(TEST_PARTICIPANT.name);
    });
  });
  
  describe('GET /api/participants/:id', () => {
    it('should retrieve a participant by ID', async () => {
      const response = await request
        .get(`/api/participants/${testParticipantId}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testParticipantId);
      expect(response.body.name).toBe(TEST_PARTICIPANT.name);
      expect(response.body.email).toBe(TEST_PARTICIPANT.email);
    });
    
    it('should return 404 for non-existent participant ID', async () => {
      await request
        .get('/api/participants/99999')
        .expect(404);
    });
    
    it('should return 400 for invalid participant ID', async () => {
      await request
        .get('/api/participants/invalid-id')
        .expect(400);
    });
  });
  
  describe('PUT /api/participants/:id', () => {
    it('should update a participant', async () => {
      const updates = {
        name: 'Updated API Test User'
      };
      
      const response = await request
        .put(`/api/participants/${testParticipantId}`)
        .send(updates)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testParticipantId);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.email).toBe(TEST_PARTICIPANT.email);
    });
    
    it('should return 404 for updating non-existent participant', async () => {
      await request
        .put('/api/participants/99999')
        .send({ name: 'Non-existent User' })
        .expect(404);
    });
    
    it('should return 400 for invalid participant ID', async () => {
      await request
        .put('/api/participants/invalid-id')
        .send({ name: 'Invalid ID User' })
        .expect(400);
    });
  });
  
  describe('DELETE /api/participants/:id', () => {
    it('should delete a participant', async () => {
      const response = await request
        .delete(`/api/participants/${testParticipantId}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      
      // Verify participant is deleted
      const checkResponse = await request
        .get(`/api/participants/${testParticipantId}`)
        .expect(404);
      
      // Clear the ID since we've deleted it
      testParticipantId = null;
    });
    
    it('should return 400 for invalid participant ID', async () => {
      await request
        .delete('/api/participants/invalid-id')
        .expect(400);
    });
  });
});
