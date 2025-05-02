/**
 * @file scripts/add-preference-tables.js
 * @description Script to add preference tables to the database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the SQL script
const sqlFilePath = path.join(__dirname, '..', 'sql-scripts', 'add-preference-tables.sql');

async function addPreferenceTables() {
  console.log('Adding preference tables to the database...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Preference tables added successfully!');
  } catch (error) {
    console.error('Error adding preference tables:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
addPreferenceTables();