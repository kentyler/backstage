#!/usr/bin/env node

/**
 * Script to fix sequences in schemas
 * 
 * Usage: node scripts/fix-sequences.js <schema_name>
 * 
 * Example: node scripts/fix-sequences.js dev
 * 
 * This script:
 * 1. Reads the SQL script from sql-scripts/fix-sequences.sql
 * 2. Executes it using the database connection
 * 3. Fixes sequences in the specified schema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix sequences in a schema
async function fixSequences(schemaName) {
  if (!schemaName) {
    console.error('Error: Schema name is required');
    console.log('Usage: node scripts/fix-sequences.js <schema_name>');
    process.exit(1);
  }

  // Validate schema name (only allow alphanumeric and underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(schemaName)) {
    console.error('Error: Schema name must contain only letters, numbers, and underscores');
    process.exit(1);
  }

  console.log(`Fixing sequences in schema: ${schemaName}`);

  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, '..', 'sql-scripts', 'fix-sequences.sql');
    let sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // Replace the placeholder with the actual schema name
    sqlScript = sqlScript.replace(/\$\{schema_name\}/g, schemaName);

    // Execute the SQL script
    await pool.query(`SET search_path TO ${schemaName}, public;`);
    await pool.query(sqlScript);

    console.log(`Sequences fixed successfully for schema: ${schemaName}`);
  } catch (error) {
    console.error(`Error fixing sequences: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get the schema name from the command line arguments
const schemaName = process.argv[2];

// Fix sequences in the specified schema
fixSequences(schemaName);