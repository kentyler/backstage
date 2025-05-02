/**
 * @file scripts/add-llm-config-to-avatars.js
 * @description Script to add llm_config JSON field to avatars table
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/connection.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SQL file
const sqlFilePath = path.join(__dirname, '..', 'sql-scripts', 'add-llm-config-to-avatars.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

async function main() {
  try {
    console.log('Adding llm_config field to avatars table...');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Successfully added llm_config field to avatars table');
    
    // Update the default LLM avatar with configuration
    const updateDefaultLLMAvatar = `
      UPDATE public.avatars
      SET llm_config = $1::jsonb
      WHERE id = 3
    `;
    
    // Use the existing API key from the environment variable as a default
    const defaultConfig = {
      api_key: process.env.LLM_API_KEY || '',
      model: 'claude-3-opus-20240229',
      provider: 'anthropic'
    };
    
    await pool.query(updateDefaultLLMAvatar, [JSON.stringify(defaultConfig)]);
    
    console.log('Updated default LLM avatar (ID: 3) with configuration');
    
    process.exit(0);
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
}

main();