// tests/avatarStructure.test.js

// Import test setup to ensure correct schema
import './setup.js';

// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import pg directly
import pg from 'pg';
const { Pool } = pg;

// Import vitest
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Global afterAll to close the pool after all tests
afterAll(async () => {
  await testPool.end();
});

describe('Avatar Table Structure', () => {
  beforeAll(async () => {
    // Explicitly set the schema
    await testPool.query('SET search_path TO dev, public;');
  });
  
  it('checks the structure of the avatars table', async () => {
    try {
      // Try to select a single row from the avatars table to see its structure
      const result = await testPool.query(`
        SELECT * FROM avatars LIMIT 1
      `);
      
      console.log('Avatars table columns:');
      result.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}`);
      });
      expect(result.rows.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('Error checking avatar structure:', error);
      throw error;
    }
  });
});
