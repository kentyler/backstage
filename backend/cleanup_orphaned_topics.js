/**
 * Script to clean up orphaned topic_paths records and fix foreign key constraint
 */

import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_t2aufdmn3sbw@ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function cleanupOrphanedTopics() {
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Connecting to database...');
    
    // Check for orphaned topic_paths
    console.log('📊 Checking for orphaned topic_paths...');
    const orphanedTopics = await pool.query(`
      SELECT tp.id, tp.group_id, tp.path 
      FROM topic_paths tp 
      LEFT JOIN groups g ON tp.group_id = g.id 
      WHERE g.id IS NULL
    `);
    
    console.log('Orphaned topic_paths found:', orphanedTopics.rows);
    
    if (orphanedTopics.rows.length > 0) {
      console.log('🗑️ Deleting orphaned topic_paths...');
      await pool.query(`
        DELETE FROM topic_paths 
        WHERE id IN (
          SELECT tp.id 
          FROM topic_paths tp 
          LEFT JOIN groups g ON tp.group_id = g.id 
          WHERE g.id IS NULL
        )
      `);
      console.log(`✅ Deleted ${orphanedTopics.rows.length} orphaned topic_paths`);
    }
    
    // Now try to add the foreign key constraint
    console.log('🔗 Adding new foreign key constraint for group_id...');
    await pool.query(`
      ALTER TABLE topic_paths 
      ADD CONSTRAINT fk_topic_paths_group 
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    `);
    
    console.log('✅ New foreign key constraint added successfully');
    
    // Verify the new constraint
    const newConstraintsCheck = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'topic_paths' AND constraint_type = 'FOREIGN KEY';
    `);
    
    console.log('📊 Updated foreign key constraints:', newConstraintsCheck.rows);
    
    console.log('🎉 Cleanup and foreign key constraint fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
cleanupOrphanedTopics()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });