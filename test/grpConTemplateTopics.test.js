// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import pg directly
import pg from 'pg';
const { Pool } = pg;

// Import vitest
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Test data
let testTemplateId;
let testGrpConId;
const testTopic = {
  title: 'Test Topic',
  content: 'Test content',
  topicIndex: 1
};

describe('grpConTemplateTopics', () => {
  beforeAll(async () => {
    // First create a test group
    const groupResult = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      ['Test Group']
    );
    const groupId = groupResult.rows[0].id;
    
    // Then create a test group conversation
    const grpConResult = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [groupId, 'Test Conversation', 'Test Description', 1]
    );
    testGrpConId = grpConResult.rows[0].id;
    
    // Now create a test template
    const templateResult = await testPool.query(
      'INSERT INTO grp_con_templates (grp_con_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [testGrpConId, 'Test Template', 'Test Description']
    );
    testTemplateId = templateResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test template
    await testPool.query('DELETE FROM grp_con_template_topics WHERE template_id = $1', [testTemplateId]);
    await testPool.query('DELETE FROM grp_con_templates WHERE id = $1', [testTemplateId]);
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [testGrpConId]);
    // Close the pool
    await testPool.end();
  });

  beforeEach(async () => {
    // Remove any existing test topics for this template
    await testPool.query(
      'DELETE FROM grp_con_template_topics WHERE template_id = $1',
      [testTemplateId]
    );
  });

  it('creates a template topic', async () => {
    const result = await testPool.query(
      'INSERT INTO grp_con_template_topics (template_id, title, content, topic_index) VALUES ($1, $2, $3, $4) RETURNING id, template_id, title, content, topic_index',
      [testTemplateId, testTopic.title, testTopic.content, testTopic.topicIndex]
    );
    const topic = result.rows[0];
    
    expect(topic).toHaveProperty('id');
    expect(Number(topic.template_id)).toBe(Number(testTemplateId));
    expect(topic.title).toBe(testTopic.title);
    expect(topic.content).toBe(testTopic.content);
    expect(Number(topic.topic_index)).toBe(testTopic.topicIndex);
    
    // Clean up
    await testPool.query('DELETE FROM grp_con_template_topics WHERE id = $1', [topic.id]);
  });

  it('gets topic by ID', async () => {
    // Create a test topic
    const insertResult = await testPool.query(
      'INSERT INTO grp_con_template_topics (template_id, title, content, topic_index) VALUES ($1, $2, $3, $4) RETURNING id',
      [testTemplateId, testTopic.title, testTopic.content, testTopic.topicIndex]
    );
    const topicId = insertResult.rows[0].id;
    
    // Retrieve it by ID
    const result = await testPool.query(
      'SELECT id, template_id, title, content, topic_index FROM grp_con_template_topics WHERE id = $1',
      [topicId]
    );
    const topic = result.rows[0];
    
    expect(topic).not.toBeNull();
    expect(Number(topic.id)).toBe(Number(topicId));
    expect(Number(topic.template_id)).toBe(Number(testTemplateId));
    expect(topic.title).toBe(testTopic.title);
    expect(topic.content).toBe(testTopic.content);
    expect(Number(topic.topic_index)).toBe(testTopic.topicIndex);
    
    // Clean up
    await testPool.query('DELETE FROM grp_con_template_topics WHERE id = $1', [topicId]);
  });

  it('gets topics by template', async () => {
    // Create multiple test topics
    await testPool.query(
      'INSERT INTO grp_con_template_topics (template_id, title, content, topic_index) VALUES ($1, $2, $3, $4)',
      [testTemplateId, 'Topic 1', 'Content 1', 1]
    );
    await testPool.query(
      'INSERT INTO grp_con_template_topics (template_id, title, content, topic_index) VALUES ($1, $2, $3, $4)',
      [testTemplateId, 'Topic 2', 'Content 2', 2]
    );
    
    // Retrieve topics by template
    const result = await testPool.query(
      'SELECT id, template_id, title, content, topic_index FROM grp_con_template_topics WHERE template_id = $1 ORDER BY topic_index',
      [testTemplateId]
    );
    const topics = result.rows;
    
    expect(Array.isArray(topics)).toBe(true);
    expect(topics.length).toBe(2);
    expect(topics[0].title).toBe('Topic 1');
    expect(topics[1].title).toBe('Topic 2');
  });

  it('updates a template topic', async () => {
    // Create a test topic
    const insertResult = await testPool.query(
      'INSERT INTO grp_con_template_topics (template_id, title, content, topic_index) VALUES ($1, $2, $3, $4) RETURNING id',
      [testTemplateId, 'Old Title', 'Old Content', 1]
    );
    const topicId = insertResult.rows[0].id;
    
    // Update the topic
    await testPool.query(
      'UPDATE grp_con_template_topics SET title = $1, content = $2, topic_index = $3 WHERE id = $4',
      ['New Title', 'New Content', 2, topicId]
    );
    
    // Verify the update
    const result = await testPool.query(
      'SELECT id, template_id, title, content, topic_index FROM grp_con_template_topics WHERE id = $1',
      [topicId]
    );
    const topic = result.rows[0];
    
    expect(topic).not.toBeNull();
    expect(topic.title).toBe('New Title');
    expect(topic.content).toBe('New Content');
    expect(Number(topic.topic_index)).toBe(2);
    
    // Clean up
    await testPool.query('DELETE FROM grp_con_template_topics WHERE id = $1', [topicId]);
  });

  it('deletes a template topic', async () => {
    // Create a test topic
    const insertResult = await testPool.query(
      'INSERT INTO grp_con_template_topics (template_id, title, content, topic_index) VALUES ($1, $2, $3, $4) RETURNING id',
      [testTemplateId, 'Test Title', 'Test Content', 1]
    );
    const topicId = insertResult.rows[0].id;
    
    // Delete the topic
    await testPool.query('DELETE FROM grp_con_template_topics WHERE id = $1', [topicId]);
    
    // Verify it's deleted
    const result = await testPool.query(
      'SELECT id FROM grp_con_template_topics WHERE id = $1',
      [topicId]
    );
    
    expect(result.rows.length).toBe(0);
  });
});
