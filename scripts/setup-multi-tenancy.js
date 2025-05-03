/**
 * Script to set up multi-tenancy programmatically
 * 
 * This script runs the SQL script to set up schema-based multi-tenancy with:
 * 1. A 'dev' schema with all existing data from the public schema
 * 2. Three client schemas ('conflict_club', 'first_congregational', 'bsa') with only lookup table data
 * 
 * Usage: node scripts/setup-multi-tenancy.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to set up multi-tenancy
async function setupMultiTenancy() {
  console.log('Setting up schema-based multi-tenancy...');
  console.log('This will:');
  console.log('1. Create a \'dev\' schema with all existing data from the public schema');
  console.log('2. Create client schemas with only lookup table data');
  console.log('   - conflict_club');
  console.log('   - first_congregational');
  console.log('   - bsa');
  console.log('3. Set up sequences correctly in all schemas');
  console.log('\nThis operation may take some time depending on the size of your database.');
  console.log('Please wait...\n');

  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, '..', 'sql-scripts', 'setup-multi-tenancy.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // Execute the SQL script
    await pool.query(sqlScript);

    console.log('\nMulti-tenancy setup completed successfully!');
    console.log('The following schemas have been created:');
    console.log('- dev (contains all data from public schema)');
    console.log('- conflict_club (contains only lookup table data)');
    console.log('- first_congregational (contains only lookup table data)');
    console.log('- bsa (contains only lookup table data)');
    
    // Get the list of lookup tables
    const lookupTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND (table_name LIKE '%types' OR table_name = 'turn_kinds')
    `);
    
    console.log('\nLookup tables (data copied to all schemas):');
    lookupTablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\nNext steps:');
    console.log('1. Update your application to use the client schemas');
    console.log('2. Use the create-client-schema.js script to create additional client schemas as needed');
    
  } catch (error) {
    console.error('Error setting up multi-tenancy:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Set up multi-tenancy
setupMultiTenancy();