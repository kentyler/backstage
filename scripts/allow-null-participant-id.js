// scripts/allow-null-participant-id.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the SQL script
const sqlScriptPath = path.join(__dirname, '..', 'sql-scripts', 'allow-null-participant-id.sql');

async function executeScript() {
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    console.log('Executing SQL script to allow null participant_id values...');
    
    // Connect to the database
    const client = await pool.connect();

    try {
      // Start a transaction
      await client.query('BEGIN');

      // Execute the SQL script
      await client.query(sqlScript);

      // Commit the transaction
      await client.query('COMMIT');

      console.log('Database schema updated successfully to allow null participant_id values in participant_events table.');
    } catch (error) {
      // Rollback the transaction if there's an error
      await client.query('ROLLBACK');
      console.error('Error updating database schema:', error.message);
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Script execution failed:', error.message);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Execute the script
executeScript();