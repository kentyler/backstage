/**
 * Script to create a client schema programmatically
 * 
 * This script creates a new schema for a client and duplicates all tables
 * from the dev schema to the client schema. The dev schema contains the
 * latest tested changes and is used as the source for table structures.
 * This approach allows for:
 * 
 * 1. Strong data isolation between clients
 * 2. Shared structure across all client schemas
 * 3. The public schema can still be used for shared data or as a template
 * 
 * Usage: node scripts/create-client-schema.js <client_name>
 * 
 * Example: node scripts/create-client-schema.js client1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to create a client schema
async function createClientSchema(clientName) {
  if (!clientName) {
    console.error('Error: Client name is required');
    console.log('Usage: node scripts/create-client-schema.js <client_name>');
    process.exit(1);
  }

  // Validate client name (only allow alphanumeric and underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(clientName)) {
    console.error('Error: Client name must contain only letters, numbers, and underscores');
    process.exit(1);
  }

  console.log(`Creating schema for client: ${clientName}`);
  console.log('Note: This script uses the dev schema as the source for table structures.');
  console.log('The dev schema contains the latest tested changes.');

  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, '..', 'sql-scripts', 'create-client-schema.sql');
    let sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // Replace the placeholder 'client1' with the actual client name
    sqlScript = sqlScript.replace(/client1/g, clientName);

    // Execute the SQL script
    await pool.query(sqlScript);

    console.log(`Schema created successfully for client: ${clientName}`);
    console.log('The new schema contains copies of all tables from the dev schema.');
    console.log('You can now start using this schema for client-specific data.');
  } catch (error) {
    console.error('Error creating client schema:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get the client name from the command line arguments
const clientName = process.argv[2];

// Create the client schema
createClientSchema(clientName);