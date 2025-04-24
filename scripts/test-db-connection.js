/**
 * Simple script to test database connectivity
 * Run this script to verify that your database configuration works
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

// Display connection parameters (without showing sensitive info)
console.log('Database connection parameters:');
console.log('Host:', process.env.PGHOST || 'Not set (default: localhost)');
console.log('Port:', process.env.PGPORT || 'Not set (default: 5432)');
console.log('Database:', process.env.PGDATABASE || 'Not set');
console.log('User:', process.env.PGUSER || 'Not set');
console.log('Password:', process.env.PGPASSWORD ? 'Set (hidden)' : 'Not set');
console.log('Connection string:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');

// Check if any DB connection parameters are missing
const missingParams = [];
if (!process.env.PGHOST) missingParams.push('PGHOST');
if (!process.env.PGDATABASE) missingParams.push('PGDATABASE');
if (!process.env.PGUSER) missingParams.push('PGUSER');
if (!process.env.PGPASSWORD) missingParams.push('PGPASSWORD');

if (missingParams.length > 0 && !process.env.DATABASE_URL) {
  console.error('\n⚠️ WARNING: Missing database connection parameters:', missingParams.join(', '));
  console.error('Make sure your .env file is properly configured and loaded.');
  console.error('Run node scripts/check-env.js to verify your environment variables.');
  // We'll still try to connect using default values
}

// Create a connection pool
const pool = new Pool();

/**
 * Test database connection and basic queries
 */
async function testConnection() {
  console.log('\nTesting database connection...');
  
  try {
    // Get a client from the pool
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query executed successfully!');
    console.log('Current database time:', result.rows[0].current_time);
    
    // Test querying the tables we need
    console.log('\nChecking required tables:');
    
    // Test groups table
    try {
      const groupsResult = await client.query('SELECT COUNT(*) FROM public.groups');
      console.log('✅ Found groups table with', groupsResult.rows[0].count, 'records');
    } catch (error) {
      console.error('❌ Error accessing groups table:', error.message);
    }
    
    // Test participants table
    try {
      const participantsResult = await client.query('SELECT COUNT(*) FROM public.participants');
      console.log('✅ Found participants table with', participantsResult.rows[0].count, 'records');
    } catch (error) {
      console.error('❌ Error accessing participants table:', error.message);
    }
    
    // Test participant_groups table
    try {
      const membershipResult = await client.query('SELECT COUNT(*) FROM public.participant_groups');
      console.log('✅ Found participant_groups table with', membershipResult.rows[0].count, 'records');
    } catch (error) {
      console.error('❌ Error accessing participant_groups table:', error.message);
    }
    
    // Test the test data
    try {
      const testGroupResult = await client.query('SELECT * FROM public.groups WHERE id = 1');
      if (testGroupResult.rows.length > 0) {
        console.log('✅ Found test group (ID: 1):', testGroupResult.rows[0].name);
      } else {
        console.log('❌ Test group (ID: 1) not found. Run setup-test-data.js to create it.');
      }
    } catch (error) {
      console.error('❌ Error checking test group:', error.message);
    }
    
    try {
      const testParticipantResult = await client.query('SELECT * FROM public.participants WHERE id = 1');
      if (testParticipantResult.rows.length > 0) {
        console.log('✅ Found test participant (ID: 1):', testParticipantResult.rows[0].name);
      } else {
        console.log('❌ Test participant (ID: 1) not found. Run setup-test-data.js to create it.');
      }
    } catch (error) {
      console.error('❌ Error checking test participant:', error.message);
    }
    
    // Release the client back to the pool
    client.release();
    console.log('\nConnection test completed successfully!');
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    
    // Provide troubleshooting tips based on error code
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPossible causes:');
      console.error('- Database server is not running');
      console.error('- Incorrect host or port');
      console.error('- Firewall blocking the connection');
      console.error('\nSolutions:');
      console.error('- Check if PostgreSQL is running');
      console.error('- Verify host and port in .env file');
      console.error('- Check firewall settings');
    }
    
    if (error.code === '28P01') {
      console.error('\nAuthentication failed:');
      console.error('- Incorrect username or password');
      console.error('\nSolutions:');
      console.error('- Check PGUSER and PGPASSWORD in .env file');
      console.error('- Verify database user has proper permissions');
    }
    
    if (error.code === '3D000') {
      console.error('\nDatabase does not exist:');
      console.error('- The specified database name was not found');
      console.error('\nSolutions:');
      console.error('- Check PGDATABASE in .env file');
      console.error('- Create the database if it doesn\'t exist');
    }
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});