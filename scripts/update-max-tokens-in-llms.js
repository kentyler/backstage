/**
 * Script to update max_tokens in llms table with appropriate values for different models
 * 
 * This script executes the SQL in sql-scripts/add-token-limit-to-llms.sql
 * which updates the max_tokens field to represent the model's context window size
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the SQL file
const sqlFilePath = path.join(__dirname, '..', 'sql-scripts', 'add-token-limit-to-llms.sql');

async function updateMaxTokensInLlms() {
  console.log('Reading SQL file...');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('Connecting to database...');
  
  try {
    console.log('Executing SQL...');
    await pool.query(sql);
    console.log('Successfully updated max_tokens in llms table');
    
    // Query the updated table to show the results
    console.log('Querying updated table...');
    const { rows } = await pool.query('SELECT id, name, provider, model, max_tokens FROM public.llms ORDER BY provider, model');
    
    console.log('Updated llms table:');
    console.table(rows);
    
    console.log('Update complete.');
  } catch (error) {
    console.error('Error updating max_tokens in llms table:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
updateMaxTokensInLlms();