/**
 * Script to migrate the llms table from client schemas to the public schema
 * 
 * This script runs the SQL script to migrate the llms table from client schemas to the public schema.
 * It adds a 'subdomain' column to the llms table and sets it to the client schema name for each record.
 * 
 * Usage: node scripts/migrate-llms-to-public.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to migrate llms table to public schema
async function migrateLLMsToPublic() {
  console.log('Migrating llms table to public schema...');
  console.log('This will:');
  console.log('1. Create the llms table in the public schema if it doesn\'t exist');
  console.log('2. Add a \'subdomain\' column to the public.llms table');
  console.log('3. Copy data from client schemas to public.llms, setting the subdomain field');
  console.log('4. Grant appropriate permissions for all users to access the tables');
  console.log('\nThis operation may take some time depending on the size of your database.');
  console.log('Please wait...\n');

  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, '..', 'sql-scripts', 'migrate-llms-to-public.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // Execute the SQL script
    await pool.query(sqlScript);

    console.log('\nLLMs table migration completed successfully!');
    console.log('The llms table is now in the public schema with a subdomain column.');
    console.log('Each LLM record has its subdomain set to the client schema it came from.');
    
    // Get the list of LLMs in the public schema
    const llmsResult = await pool.query(`
      SELECT id, name, provider, model, subdomain
      FROM public.llms
      ORDER BY subdomain, name
    `);
    
    console.log('\nLLMs in the public schema:');
    llmsResult.rows.forEach(row => {
      console.log(`- ${row.name} (ID: ${row.id}, Provider: ${row.provider}, Model: ${row.model}, Subdomain: ${row.subdomain})`);
    });
    
    console.log('\nNext steps:');
    console.log('1. Update your application code to query the llms table from the public schema');
    console.log('2. Use the subdomain field to filter LLMs by client');
    console.log('3. Consider dropping the llms table from client schemas after verifying the migration');
    
  } catch (error) {
    console.error('Error migrating llms table:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Migrate llms table to public schema
migrateLLMsToPublic();