/**
 * Script to remove non-lookup tables from public schema
 * 
 * This script runs the SQL script to remove non-lookup tables from the public schema.
 * It's designed to be run after the initial multi-tenancy setup and after migrating
 * lookup tables to the public schema.
 * 
 * Usage: node scripts/remove-non-lookup-tables-from-public.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to remove non-lookup tables from public schema
async function removeNonLookupTables() {
  console.log('Removing non-lookup tables from public schema...');
  console.log('This will:');
  console.log('1. Identify which tables are non-lookup tables');
  console.log('2. Check that these tables exist in the dev schema');
  console.log('3. Remove the non-lookup tables from the public schema');
  console.log('\nThis operation is irreversible. Make sure you have a backup before proceeding.');
  console.log('Please wait...\n');

  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, '..', 'sql-scripts', 'remove-non-lookup-tables-from-public.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // Execute the SQL script
    const result = await pool.query(sqlScript);

    console.log('\nNon-lookup tables removal completed successfully!');
    
    // Get the list of lookup tables
    const lookupTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND (table_name LIKE '%types' OR table_name = 'turn_kinds')
    `);
    
    console.log('\nThe following tables were kept in public schema:');
    lookupTablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\nNext steps:');
    console.log('1. Update the create-client-schema script to use the dev schema as the source for table structures');
    console.log('2. When creating new client schemas, use the updated script');
    
  } catch (error) {
    console.error('Error removing non-lookup tables:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Remove non-lookup tables
removeNonLookupTables();