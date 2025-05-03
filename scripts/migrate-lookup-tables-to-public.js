/**
 * Script to migrate lookup tables to public schema
 * 
 * This script runs the SQL script to migrate lookup tables from client schemas back to the public schema.
 * It's designed to be run after the initial multi-tenancy setup when you want to switch to keeping
 * lookup tables only in the public schema.
 * 
 * Usage: node scripts/migrate-lookup-tables-to-public.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to migrate lookup tables to public schema
async function migrateLookupTables() {
  console.log('Migrating lookup tables to public schema...');
  console.log('This will:');
  console.log('1. Identify lookup tables (ending with \'types\' or named \'turn_kinds\')');
  console.log('2. Grant usage on the public schema to all users');
  console.log('3. Drop lookup tables from client schemas');
  console.log('4. Set up permissions for client schemas to access the public lookup tables');
  console.log('\nThis operation may take some time depending on the size of your database.');
  console.log('Please wait...\n');

  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, '..', 'sql-scripts', 'migrate-lookup-tables-to-public.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // Execute the SQL script
    await pool.query(sqlScript);

    console.log('\nLookup tables migration completed successfully!');
    console.log('Lookup tables are now only in the public schema.');
    console.log('Client schemas have been granted access to these tables.');
    
    // Get the list of lookup tables
    const lookupTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND (table_name LIKE '%types' OR table_name = 'turn_kinds')
    `);
    
    console.log('\nLookup tables (now only in public schema):');
    lookupTablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\nNext steps:');
    console.log('1. Update your application code to always query lookup tables from the public schema');
    console.log('2. When you need to update lookup tables, you only need to update them in the public schema');
    
  } catch (error) {
    console.error('Error migrating lookup tables:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Migrate lookup tables
migrateLookupTables();