import { generateEmbedding } from './embeddings.js';

// ... existing code ...

/**
 * Stores a message with its vector representation
 */
async function storeMessage(topicPathId, avatarId, content, isUser = true) {
  // ... existing validation ...

  const client = await pool.connect();
  let transactionCompleted = false;
  
  try {
    await client.query('BEGIN');
    
    // Generate embedding using the new service
    const contentVector = await generateEmbedding(content);
    
    // Store message with vector
    const result = await client.query(
      `INSERT INTO grp_con_avatar_turns 
       (topicpathid, avatar_id, content_text, content_vector, message_type_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [topicPathId, avatarId, content, contentVector, isUser ? 1 : 2]
    );

    await client.query('COMMIT');
    transactionCompleted = true;
    return result.rows[0].id;
  } catch (error) {
    if (!transactionCompleted) {
      await client.query('ROLLBACK');
    }
    console.error('Error storing message:', error);
    throw error;
  } finally {
    client.release();
  }
}