/**
 * Script to change site_preferences.value from JSONB to BIGINT
 * 
 * This script executes the SQL in sql-scripts/change-preference-value-to-bigint.sql
 * which extracts the LLM ID from the JSON object and stores it directly as a number.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Starting to change site_preferences.value from JSONB to BIGINT...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'sql-scripts', 'change-preference-value-to-bigint.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    console.log('Executing SQL...');
    await pool.query(sql);
    
    console.log('Successfully changed site_preferences.value from JSONB to BIGINT!');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error changing site_preferences.value:', error);
    process.exit(1);
  }
}

main();