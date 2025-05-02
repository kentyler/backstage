/**
 * Script to add token_limit column to llms table
 * 
 * This script adds a token_limit column to the llms table and updates existing records
 * with appropriate token limits for different models.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addTokenLimitToLlms() {
  try {
    console.log('Adding token_limit column to llms table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sql-scripts', 'add-token-limit-to-llms.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sqlContent);
    
    console.log('Successfully added token_limit column to llms table and updated existing records.');
    
    // Query the updated table to show the results
    const { rows } = await pool.query(`
      SELECT id, name, provider, model, token_limit
      FROM public.llms
      ORDER BY id
    `);
    
    console.log('\nUpdated llms table:');
    console.table(rows);
    
    console.log('\nOperation completed successfully.');
  } catch (error) {
    console.error('Error adding token_limit column to llms table:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
addTokenLimitToLlms();