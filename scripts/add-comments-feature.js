/**
 * @file scripts/add-comments-feature.js
 * @description Script to apply database changes for the comments feature
 * 
 * This script:
 * 1. Changes the turn_index column in grp_con_avatar_turns from integer to numeric(10,2)
 * 2. Adds a new turn_kind for comments in the turn_kinds table
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Applying database changes for comments feature...');
  
  try {
    // Read the SQL script
    const sqlPath = path.join(__dirname, '..', 'sql-scripts', 'add-comments-feature.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL script
    await pool.query(sql);
    
    console.log('Successfully applied database changes for comments feature.');
  } catch (error) {
    console.error('Error applying database changes:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();