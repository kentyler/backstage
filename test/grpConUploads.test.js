// tests/grpConUploads.test.js

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
  createGrpConUpload,
  getGrpConUploadById,
  getGrpConUploadsByConversation,
  deleteGrpConUpload
} from '../src/db/grpConUploads/index.js';

// We don't need schema helpers since we're setting the search path directly

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

// Create a function to set the schema for a connection
async function setSchema(pool, schema) {
  await pool.query(`SET search_path TO ${schema}, public;`);
}

// Global afterAll to close the pool after all tests
afterAll(async () => {
  await testPool.end();
});

// Test suite for direct SQL operations
describe('Group Conversation Uploads - SQL Operations', () => {
  let testGroupId;
  let convId;
  let turnId;
  let uploadId;
  const testFilename = 'test-file.txt';
  const testMimeType = 'text/plain';
  const testFilePath = 'test/path/to/file.txt';
  
  beforeAll(async () => {
    // Create test group
    const groupResult = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      ['Test Upload Group']
    );
    testGroupId = groupResult.rows[0].id;
    
    // Create test conversation
    const convResult = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [testGroupId, 'Test Upload Conversation', 'Test Description', 1]
    );
    convId = convResult.rows[0].id;
    
    // Create a test turn to use for uploads
    const turnResult = await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [convId, 1, 0, 'Test turn for uploads', `[${Array(1536).fill(0.1).join(',')}]`, 1]
    );
    turnId = turnResult.rows[0].id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM grp_con_uploads WHERE grp_con_id = $1', [convId]);
    await testPool.query('DELETE FROM grp_con_avatar_turns WHERE grp_con_id = $1', [convId]);
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
    await testPool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
  });
  
  beforeEach(async () => {
    // Clean up any existing uploads for this conversation
    await testPool.query('DELETE FROM grp_con_uploads WHERE grp_con_id = $1', [convId]);
  });
  
  it('creates an upload', async () => {
    const result = await testPool.query(
      'INSERT INTO grp_con_uploads (grp_con_id, turn_id, filename, mime_type, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING id, grp_con_id, turn_id, filename, mime_type, file_path',
      [convId, turnId, testFilename, testMimeType, testFilePath]
    );
    const upload = result.rows[0];
    uploadId = upload.id;
    
    expect(upload).toHaveProperty('id');
    expect(Number(upload.grp_con_id)).toBe(Number(convId));
    expect(upload.filename).toBe(testFilename);
    expect(upload.mime_type).toBe(testMimeType);
    expect(upload.file_path).toBe(testFilePath);
  });
  
  it('gets an upload by ID', async () => {
    // Create a test upload
    const insertResult = await testPool.query(
      'INSERT INTO grp_con_uploads (grp_con_id, turn_id, filename, mime_type, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [convId, turnId, testFilename, testMimeType, testFilePath]
    );
    const uploadId = insertResult.rows[0].id;
    
    // Get it back
    const result = await testPool.query(
      'SELECT id, grp_con_id, turn_id, filename, mime_type, file_path FROM grp_con_uploads WHERE id = $1',
      [uploadId]
    );
    const upload = result.rows[0];
    
    expect(upload).not.toBeNull();
    expect(Number(upload.id)).toBe(Number(uploadId));
    expect(Number(upload.grp_con_id)).toBe(Number(convId));
    expect(Number(upload.turn_id)).toBe(Number(turnId));
    expect(upload.filename).toBe(testFilename);
    expect(upload.mime_type).toBe(testMimeType);
    expect(upload.file_path).toBe(testFilePath);
  });
  
  it('gets uploads by conversation', async () => {
    // Create multiple test uploads
    await testPool.query(
      'INSERT INTO grp_con_uploads (grp_con_id, turn_id, filename, mime_type, file_path) VALUES ($1, $2, $3, $4, $5)',
      [convId, turnId, 'file1.txt', 'text/plain', 'path/to/file1.txt']
    );
    await testPool.query(
      'INSERT INTO grp_con_uploads (grp_con_id, turn_id, filename, mime_type, file_path) VALUES ($1, $2, $3, $4, $5)',
      [convId, turnId, 'file2.pdf', 'application/pdf', 'path/to/file2.pdf']
    );
    
    // Get them back
    const result = await testPool.query(
      'SELECT id, grp_con_id, filename, mime_type, file_path FROM grp_con_uploads WHERE grp_con_id = $1',
      [convId]
    );
    const uploads = result.rows;
    
    expect(Array.isArray(uploads)).toBe(true);
    expect(uploads.length).toBe(2);
    expect(uploads.some(u => u.filename === 'file1.txt')).toBe(true);
    expect(uploads.some(u => u.filename === 'file2.pdf')).toBe(true);
  });
  
  it('deletes an upload', async () => {
    // Create a test upload
    const insertResult = await testPool.query(
      'INSERT INTO grp_con_uploads (grp_con_id, turn_id, filename, mime_type, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [convId, turnId, testFilename, testMimeType, testFilePath]
    );
    const uploadId = insertResult.rows[0].id;
    
    // Delete it
    await testPool.query('DELETE FROM grp_con_uploads WHERE id = $1', [uploadId]);
    
    // Verify it's gone
    const result = await testPool.query(
      'SELECT id FROM grp_con_uploads WHERE id = $1',
      [uploadId]
    );
    expect(result.rows.length).toBe(0);
  });
});

// Test suite for the actual functions
describe('Group Conversation Uploads - Functions', () => {
  // Make sure schema is set to 'dev' for all tests in this suite
  beforeAll(async () => {
    // Explicitly set the schema for this test suite
    await testPool.query('SET search_path TO dev, public;');
  });
  let testGroupId;
  let convId;
  let turnId;
  let uploadId;
  const testFilename = 'test-function-file.txt';
  const testMimeType = 'text/plain';
  const testFilePath = 'test/path/to/function-file.txt';
  
  beforeAll(async () => {
    // Create test group
    const groupResult = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      ['Test Upload Functions Group']
    );
    testGroupId = groupResult.rows[0].id;
    
    // Create test conversation
    const convResult = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [testGroupId, 'Test Upload Functions Conversation', 'Test Description', 1]
    );
    convId = convResult.rows[0].id;
    
    // Create a test turn to use for uploads
    const turnResult = await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [convId, 1, 0, 'Test turn for function uploads', `[${Array(1536).fill(0.1).join(',')}]`, 1]
    );
    turnId = turnResult.rows[0].id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM grp_con_uploads WHERE grp_con_id = $1', [convId]);
    await testPool.query('DELETE FROM grp_con_avatar_turns WHERE grp_con_id = $1', [convId]);
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
    await testPool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
  });
  
  beforeEach(async () => {
    // Clean up any existing uploads for this conversation
    await testPool.query('DELETE FROM grp_con_uploads WHERE grp_con_id = $1', [convId]);
  });
  
  it('createGrpConUpload creates an upload', async () => {
    const uploadData = {
      grpConId: convId,
      turnId: turnId,
      filename: testFilename,
      mimeType: testMimeType,
      filePath: testFilePath
    };
    
    const upload = await createGrpConUpload(uploadData);
    uploadId = upload.id;
    
    expect(upload).toHaveProperty('id');
    expect(Number(upload.grp_con_id)).toBe(Number(convId));
    expect(Number(upload.turn_id)).toBe(Number(turnId));
    expect(upload.filename).toBe(testFilename);
    expect(upload.mime_type).toBe(testMimeType);
    expect(upload.file_path).toBe(testFilePath);
  });
  
  it('getGrpConUploadById gets an upload by ID', async () => {
    // Create a test upload
    const uploadData = {
      grpConId: convId,
      turnId: turnId,
      filename: testFilename,
      mimeType: testMimeType,
      filePath: testFilePath
    };
    
    const created = await createGrpConUpload(uploadData);
    
    // Get it back using the function
    const upload = await getGrpConUploadById(created.id);
    
    expect(upload).not.toBeNull();
    expect(Number(upload.id)).toBe(Number(created.id));
    expect(Number(upload.grp_con_id)).toBe(Number(convId));
    expect(Number(upload.turn_id)).toBe(Number(turnId));
    expect(upload.filename).toBe(testFilename);
    expect(upload.mime_type).toBe(testMimeType);
    expect(upload.file_path).toBe(testFilePath);
  });
  
  it('getGrpConUploadsByConversation gets uploads by conversation', async () => {
    // Create multiple test uploads
    const uploadData1 = {
      grpConId: convId,
      turnId: turnId,
      filename: 'function-file1.txt',
      mimeType: 'text/plain',
      filePath: 'path/to/function-file1.txt'
    };
    
    const uploadData2 = {
      grpConId: convId,
      turnId: turnId,
      filename: 'function-file2.pdf',
      mimeType: 'application/pdf',
      filePath: 'path/to/function-file2.pdf'
    };
    
    await createGrpConUpload(uploadData1);
    await createGrpConUpload(uploadData2);
    
    // Get them back using the function
    const uploads = await getGrpConUploadsByConversation(convId);
    
    expect(Array.isArray(uploads)).toBe(true);
    expect(uploads.length).toBe(2);
    expect(uploads.some(u => u.filename === 'function-file1.txt')).toBe(true);
    expect(uploads.some(u => u.filename === 'function-file2.pdf')).toBe(true);
  });
  
  it('deleteGrpConUpload deletes an upload', async () => {
    // Create a test upload
    const uploadData = {
      grpConId: convId,
      turnId: turnId,
      filename: testFilename,
      mimeType: testMimeType,
      filePath: testFilePath
    };
    
    const created = await createGrpConUpload(uploadData);
    
    // Delete it using the function
    const deleted = await deleteGrpConUpload(created.id);
    
    expect(deleted).toBe(true);
    
    // Verify it's gone
    const upload = await getGrpConUploadById(created.id);
    expect(upload).toBeNull();
  });
});
