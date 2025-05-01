#!/usr/bin/env node

/**
 * Script to fix the participant_events sequence
 * This script executes the SQL in sql-scripts/fix-participant-events-sequence.sql
 * to ensure the id column in participant_events has a properly attached sequence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the SQL script
const sqlFilePath = path.join(__dirname, '..', 'sql-scripts', 'fix-participant-events-sequence.sql');

async function main() {
  console.log('Starting to fix participant_events sequence...');
  
  try {
    // Read the SQL file
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('SQL script loaded successfully');
    
    // Execute the SQL script
    await pool.query(sqlScript);
    console.log('SQL script executed successfully');
    
    // Verify the sequence is working by checking its current value
    const { rows } = await pool.query("SELECT currval('public.participant_events_id_seq')");
    console.log('Current sequence value:', rows[0].currval);
    
    console.log('✅ participant_events sequence fixed successfully');
  } catch (error) {
    console.error('❌ Error fixing participant_events sequence:', error.message);
    // If the error is about currval, it might mean the sequence exists but hasn't been used yet
    if (error.message.includes('currval')) {
      console.log('Sequence exists but may not have been used yet. This is normal for a new sequence.');
      console.log('✅ participant_events sequence should be fixed');
    } else {
      process.exit(1);
    }
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the script
main();