/**
 * Script to verify preference types in the database
 * This script checks if specific preference types exist and logs their properties
 */

import { pool } from '../src/db/connection.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyPreferenceTypes() {
  try {
    console.log('Connecting to database...');
    
    // Get all preference types
    const allTypesQuery = `
      SELECT id, name, description, default_value, created_at, updated_at
      FROM public.preference_types
      ORDER BY id
    `;
    
    const allTypesResult = await pool.query(allTypesQuery);
    console.log('\nAll preference types:');
    console.table(allTypesResult.rows);
    
    // Check for specific preference types
    const specificTypes = ['llm_selection', 'avatar_id'];
    
    for (const typeName of specificTypes) {
      const specificTypeQuery = `
        SELECT id, name, description, default_value, created_at, updated_at
        FROM public.preference_types
        WHERE name = $1
      `;
      
      const specificTypeResult = await pool.query(specificTypeQuery, [typeName]);
      
      if (specificTypeResult.rows.length > 0) {
        console.log(`\nPreference type '${typeName}' exists:`);
        console.table(specificTypeResult.rows);
        
        // Check for site preferences of this type
        const sitePrefsQuery = `
          SELECT sp.id, sp.preference_type_id, sp.value, sp.created_at, sp.updated_at, pt.name as type_name
          FROM public.site_preferences sp
          JOIN public.preference_types pt ON sp.preference_type_id = pt.id
          WHERE pt.name = $1
        `;
        
        const sitePrefsResult = await pool.query(sitePrefsQuery, [typeName]);
        
        if (sitePrefsResult.rows.length > 0) {
          console.log(`\nSite preferences for '${typeName}':`);
          console.table(sitePrefsResult.rows);
        } else {
          console.log(`\nNo site preferences found for '${typeName}'`);
        }
      } else {
        console.log(`\nPreference type '${typeName}' does NOT exist!`);
      }
    }
    
    console.log('\nVerification complete.');
  } catch (error) {
    console.error('Error verifying preference types:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the verification
verifyPreferenceTypes();