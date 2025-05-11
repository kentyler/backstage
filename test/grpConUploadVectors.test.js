// tests/grpConUploadVectors.test.js

// Import test setup to ensure correct schema
import './setup.js';

// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import pg directly
import pg from 'pg';
const { Pool } = pg;

// Import vitest
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Import the functions to test
import {
  createGrpConUploadVector,
  getGrpConUploadVectorsByUpload
} from '../src/db/grpConUploadVectors/index.js';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Execute a query to ensure the schema is set
(async () => {
  await testPool.query('SET search_path TO dev, public;');
})();

// Global afterAll to close the pool after all tests
afterAll(async () => {
  await testPool.end();
});

// Create the grp_con_upload_vectors table if it doesn't exist
beforeAll(async () => {
  try {
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS grp_con_upload_vectors (
        id SERIAL PRIMARY KEY,
        upload_id INTEGER NOT NULL REFERENCES grp_con_uploads(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content_text TEXT,
        content_vector VECTOR(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created grp_con_upload_vectors table if it did not exist');
  } catch (error) {
    console.error('Error creating grp_con_upload_vectors table:', error);
  }
});

// Test suite for direct SQL operations
describe('Group Conversation Upload Vectors - SQL Operations', () => {
  let testGroupId;
  let convId;
  let turnId;
  let uploadId;
  
  beforeAll(async () => {
    // Create test group
    const groupResult = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      ['Test Upload Vectors Group']
    );
    testGroupId = groupResult.rows[0].id;
    
    // Create test conversation
    const convResult = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [testGroupId, 'Test Upload Vectors Conversation', 'Test Description', 1]
    );
    convId = convResult.rows[0].id;
    
    // Create a test turn to use for uploads
    const turnResult = await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [convId, 1, 0, 'Test turn for upload vectors', `[${Array(1536).fill(0.1).join(',')}]`, 1]
    );
    turnId = turnResult.rows[0].id;
    
    // Create a test upload to use for vectors
    const uploadResult = await testPool.query(
      'INSERT INTO grp_con_uploads (grp_con_id, turn_id, filename, mime_type, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [convId, turnId, 'test-vector-file.txt', 'text/plain', 'test/path/to/vector-file.txt']
    );
    uploadId = uploadResult.rows[0].id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM grp_con_upload_vectors WHERE upload_id = $1', [uploadId]);
    await testPool.query('DELETE FROM grp_con_uploads WHERE id = $1', [uploadId]);
    await testPool.query('DELETE FROM grp_con_avatar_turns WHERE grp_con_id = $1', [convId]);
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
    await testPool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
  });
  
  beforeEach(async () => {
    // Clean up any existing vectors for this upload
    await testPool.query('DELETE FROM grp_con_upload_vectors WHERE upload_id = $1', [uploadId]);
  });
  
  it('creates a vector', async () => {
    const result = await testPool.query(
      'INSERT INTO grp_con_upload_vectors (upload_id, chunk_index, content_text, content_vector) VALUES ($1, $2, $3, $4) RETURNING id, upload_id, chunk_index, content_text, content_vector',
      [uploadId, 1, 'Test vector content', `[${Array(1536).fill(0.2).join(',')}]`]
    );
    const vector = result.rows[0];
    
    expect(vector).toHaveProperty('id');
    expect(Number(vector.upload_id)).toBe(Number(uploadId));
    expect(Number(vector.chunk_index)).toBe(1);
    expect(vector.content_text).toBe('Test vector content');
    
    // Parse vector string to array for testing
    const parsedVector = vector.content_vector
      .slice(1, -1) // Remove brackets
      .split(',')
      .map(Number);
    
    expect(Array.isArray(parsedVector)).toBe(true);
    expect(parsedVector.length).toBe(1536);
  });
  
  it('gets vectors by upload ID', async () => {
    // Create multiple test vectors
    await testPool.query(
      'INSERT INTO grp_con_upload_vectors (upload_id, chunk_index, content_text, content_vector) VALUES ($1, $2, $3, $4)',
      [uploadId, 1, 'Vector content 1', `[${Array(1536).fill(0.1).join(',')}]`]
    );
    await testPool.query(
      'INSERT INTO grp_con_upload_vectors (upload_id, chunk_index, content_text, content_vector) VALUES ($1, $2, $3, $4)',
      [uploadId, 2, 'Vector content 2', `[${Array(1536).fill(0.2).join(',')}]`]
    );
    
    // Get them back
    const result = await testPool.query(
      'SELECT id, upload_id, chunk_index, content_text FROM grp_con_upload_vectors WHERE upload_id = $1 ORDER BY chunk_index',
      [uploadId]
    );
    const vectors = result.rows;
    
    expect(Array.isArray(vectors)).toBe(true);
    expect(vectors.length).toBe(2);
    expect(Number(vectors[0].chunk_index)).toBe(1);
    expect(Number(vectors[1].chunk_index)).toBe(2);
    expect(vectors[0].content_text).toBe('Vector content 1');
    expect(vectors[1].content_text).toBe('Vector content 2');
  });
});

// Test suite for the actual functions
describe('Group Conversation Upload Vectors - Functions', () => {
  let testGroupId;
  let convId;
  let turnId;
  let uploadId;
  
  // Make sure schema is set to 'dev' for all tests in this suite
  beforeAll(async () => {
    // Explicitly set the schema for this test suite
    await testPool.query('SET search_path TO dev, public;');
    
    // Create test group
    const groupResult = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      ['Test Upload Vectors Functions Group']
    );
    testGroupId = groupResult.rows[0].id;
    
    // Create test conversation
    const convResult = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [testGroupId, 'Test Upload Vectors Functions Conversation', 'Test Description', 1]
    );
    convId = convResult.rows[0].id;
    
    // Create a test turn to use for uploads
    const turnResult = await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [convId, 1, 0, 'Test turn for function upload vectors', `[${Array(1536).fill(0.1).join(',')}]`, 1]
    );
    turnId = turnResult.rows[0].id;
    
    // Create a test upload to use for vectors
    const uploadResult = await testPool.query(
      'INSERT INTO grp_con_uploads (grp_con_id, turn_id, filename, mime_type, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [convId, turnId, 'test-function-vector-file.txt', 'text/plain', 'test/path/to/function-vector-file.txt']
    );
    uploadId = uploadResult.rows[0].id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM grp_con_upload_vectors WHERE upload_id = $1', [uploadId]);
    await testPool.query('DELETE FROM grp_con_uploads WHERE id = $1', [uploadId]);
    await testPool.query('DELETE FROM grp_con_avatar_turns WHERE grp_con_id = $1', [convId]);
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
    await testPool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
  });
  
  beforeEach(async () => {
    // Clean up any existing vectors for this upload
    await testPool.query('DELETE FROM grp_con_upload_vectors WHERE upload_id = $1', [uploadId]);
  });
  
  it('createGrpConUploadVector creates a vector', async () => {
    const vectorData = {
      uploadId: uploadId,
      chunkIndex: 1,
      contentText: 'Test function vector content',
      contentVector: Array(1536).fill(0.3)
    };
    
    const vector = await createGrpConUploadVector(vectorData);
    
    expect(vector).toHaveProperty('id');
    expect(Number(vector.upload_id)).toBe(Number(uploadId));
    expect(Number(vector.chunk_index)).toBe(1);
    expect(vector.content_text).toBe('Test function vector content');
    
    // Parse vector string to array for testing
    const parsedVector = vector.content_vector
      ? vector.content_vector.slice(1, -1).split(',').map(Number)
      : null;
    
    expect(Array.isArray(parsedVector)).toBe(true);
    expect(parsedVector.length).toBe(1536);
  });
  
  it('getGrpConUploadVectorsByUpload gets vectors by upload ID', async () => {
    // Create multiple test vectors
    const vectorData1 = {
      uploadId: uploadId,
      chunkIndex: 1,
      contentText: 'Function vector content 1',
      contentVector: Array(1536).fill(0.1)
    };
    
    const vectorData2 = {
      uploadId: uploadId,
      chunkIndex: 2,
      contentText: 'Function vector content 2',
      contentVector: Array(1536).fill(0.2)
    };
    
    await createGrpConUploadVector(vectorData1);
    await createGrpConUploadVector(vectorData2);
    
    // Get them back using the function
    const vectors = await getGrpConUploadVectorsByUpload(uploadId);
    
    expect(Array.isArray(vectors)).toBe(true);
    expect(vectors.length).toBe(2);
    
    // Sort by chunk_index for consistent testing
    vectors.sort((a, b) => a.chunk_index - b.chunk_index);
    
    expect(Number(vectors[0].chunk_index)).toBe(1);
    expect(Number(vectors[1].chunk_index)).toBe(2);
    expect(vectors[0].content_text).toBe('Function vector content 1');
    expect(vectors[1].content_text).toBe('Function vector content 2');
  });
});
