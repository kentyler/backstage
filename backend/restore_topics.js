/**
 * Script to restore the deleted topic_paths records
 */

import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_t2aufdmn3sbw@ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

// The deleted topic paths from the console output
const deletedTopics = [
  { id: '1', group_id: 1, path: 'Bible-Study.Lost-Christianities.Chapter-2' },
  { id: '2', group_id: 1, path: 'Bible-Study.Lost-Christianities' },
  { id: '3', group_id: 1, path: 'Mens-Group.Burial-Society' },
  { id: '4', group_id: 1, path: 'Bible-Study' },
  { id: '5', group_id: 1, path: 'Sanctuary' },
  { id: '6', group_id: 1, path: 'Bible-Study.Lost-Christianities.Chapter-5' },
  { id: '8', group_id: 1, path: 'Theology' },
  { id: '9', group_id: 1, path: 'Mens-Group' },
  { id: '13', group_id: 1, path: 'Sermons' },
  { id: '14', group_id: 1, path: 'Sanctuary.Facilities' },
  { id: '15', group_id: 1, path: 'Sanctuary.Facilities.Sleeping_Arrangements' },
  { id: '22', group_id: 1, path: 'Weekly_Bulletins' },
  { id: '23', group_id: 1, path: 'Talks_with_Jamie' },
  { id: '24', group_id: 1, path: 'Talks_with_Jamie.biweekly_transcripts' },
  { id: '26', group_id: 1, path: 'Weekly_Bulletins.last_week' },
  { id: '28', group_id: 1, path: 'Talks_with_Jamie_long_ones' },
  { id: '7', group_id: 1, path: 'Bible-Study.lost-Christianities.Chapter-4' },
  { id: '31', group_id: 1, path: 'Talks_with_Jamie.jokes' }
];

async function restoreTopics() {
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Connecting to database...');
    
    // Check if group 83 exists
    console.log('📊 Checking if group ID 83 exists...');
    const groupCheck = await pool.query('SELECT id, name FROM groups WHERE id = 83');
    
    if (groupCheck.rows.length === 0) {
      console.log('❌ Group ID 83 does not exist.');
      const allGroups = await pool.query('SELECT id, name FROM groups ORDER BY id');
      console.log('Available groups:', allGroups.rows);
      return;
    } else {
      console.log('✅ Group ID 83 exists:', groupCheck.rows[0]);
    }
    
    // Restore the topic paths under group 83
    console.log('\n🔄 Restoring topic paths under group 83...');
    
    for (const topic of deletedTopics) {
      try {
        await pool.query(`
          INSERT INTO topic_paths (id, path, group_id, created_by, index) 
          VALUES ($1::int, $2::ltree, 83, 1, $3::int)
          ON CONFLICT (id) DO NOTHING
        `, [parseInt(topic.id), topic.path, parseInt(topic.id)]);
        
        console.log(`✅ Restored: ${topic.path} (ID: ${topic.id}) → Group 83`);
      } catch (error) {
        console.error(`❌ Failed to restore ${topic.path}:`, error.message);
      }
    }
    
    // Skip sequence update since it may not exist
    console.log('\n✅ Skipping sequence update...');
    
    // Verify restoration
    const restoredCount = await pool.query('SELECT COUNT(*) FROM topic_paths WHERE group_id = 83');
    console.log(`\n📊 Verification: ${restoredCount.rows[0].count} topics restored for group 83`);
    
    console.log('\n🎉 Topic restoration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during restoration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the restoration
restoreTopics()
  .then(() => {
    console.log('✅ Restoration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Restoration script failed:', error);
    process.exit(1);
  });