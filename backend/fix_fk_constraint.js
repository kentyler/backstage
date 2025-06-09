/**
 * Script to fix the topic_paths foreign key constraint
 * This drops the old client_id constraint and adds the correct group_id constraint
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Use the same connection logic as the main app
const connectionString = process.env.DB_HOST;

async function fixForeignKeyConstraint() {
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Connecting to database...');
    
    // Check current constraints
    console.log('📊 Checking current constraints on topic_paths...');
    const constraintsCheck = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'topic_paths' AND constraint_type = 'FOREIGN KEY';
    `);
    
    console.log('Current foreign key constraints:', constraintsCheck.rows);
    
    // Drop old foreign key constraints
    console.log('🗑️ Dropping old foreign key constraints...');
    await pool.query('ALTER TABLE topic_paths DROP CONSTRAINT IF EXISTS fk_topic_paths_client');
    await pool.query('ALTER TABLE topic_paths DROP CONSTRAINT IF EXISTS topic_paths_client_id_fkey');
    
    console.log('✅ Old constraints dropped');
    
    // Add new foreign key constraint
    console.log('🔗 Adding new foreign key constraint for group_id...');
    await pool.query(`
      ALTER TABLE topic_paths 
      ADD CONSTRAINT fk_topic_paths_group 
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    `);
    
    console.log('✅ New foreign key constraint added');
    
    // Verify the new constraint
    const newConstraintsCheck = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'topic_paths' AND constraint_type = 'FOREIGN KEY';
    `);
    
    console.log('📊 Updated foreign key constraints:', newConstraintsCheck.rows);
    
    console.log('🎉 Foreign key constraint fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing foreign key constraint:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixForeignKeyConstraint()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });