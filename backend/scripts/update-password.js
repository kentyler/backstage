/**
 * Script to update a participant's password in the database with a bcrypt hash
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Password to set ("7297" for this user)
const userId = 572;
const newPassword = "7297";

async function updatePassword() {
  // Create a connection pool to the database using the same config as the app
  const pool = new Pool({
    connectionString: process.env.DB_HOST,
    ssl: process.env.DB_HOST.includes('neon') ? { rejectUnauthorized: false } : false
  });
  
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password in the database
    const result = await pool.query(
      'UPDATE participants SET password = $1 WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, userId]
    );
    
    if (result.rows.length === 0) {
      console.error(`User with ID ${userId} not found`);
    } else {
      console.log(`Updated password for user:`, result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await pool.end();
  }
}

updatePassword();
