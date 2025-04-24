/**
 * Script to check the environment variables needed for database connection
 * Run this script to verify your .env file is configured properly
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config();

console.log('Environment Variable Check');
console.log('=========================\n');

// Check if .env file exists
const envPath = path.join(rootDir, '.env');
const envExists = fs.existsSync(envPath);

console.log('.env file exists:', envExists ? '✅ Yes' : '❌ No');
if (!envExists) {
  console.log('\nERROR: .env file not found at:', envPath);
  console.log('Create a .env file with your database configuration.');
  process.exit(1);
}

// Check environment variables
const requiredVars = [
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD'
];

const missingVars = [];
const configuredVars = {};

for (const varName of requiredVars) {
  const value = process.env[varName];
  const isSet = value !== undefined && value !== '';
  configuredVars[varName] = isSet;
  
  if (!isSet) {
    missingVars.push(varName);
  }
}

// Display results
console.log('\nEnvironment Variables:');
console.log('PGHOST:', configuredVars.PGHOST ? '✅ Set' : '❌ Missing');
console.log('PGPORT:', configuredVars.PGPORT ? '✅ Set' : '❌ Missing');
console.log('PGDATABASE:', configuredVars.PGDATABASE ? '✅ Set' : '❌ Missing');
console.log('PGUSER:', configuredVars.PGUSER ? '✅ Set' : '❌ Missing');
console.log('PGPASSWORD:', configuredVars.PGPASSWORD ? '✅ Set' : '❌ Missing');

// Check if DATABASE_URL is set (alternative connection method)
const hasConnectionString = process.env.DATABASE_URL !== undefined && process.env.DATABASE_URL !== '';
console.log('DATABASE_URL:', hasConnectionString ? '✅ Set' : '❌ Missing');

// Print .env file content (without the actual values)
console.log('\n.env File Content:');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const parts = trimmedLine.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        console.log(`${key}=********`);
      } else {
        console.log(trimmedLine);
      }
    }
  }
} catch (error) {
  console.error('Error reading .env file:', error.message);
}

// Provide recommendations
if (missingVars.length > 0) {
  console.log('\n❌ ERROR: Missing required environment variables!');
  console.log('Add the following to your .env file:');
  
  for (const varName of missingVars) {
    console.log(`${varName}=your_value_here`);
  }
} else if (!hasConnectionString) {
  console.log('\n✅ All required individual environment variables are set.');
} else {
  console.log('\n✅ Database connection string is configured.');
}

// Check dotenv loading
console.log('\nDotenv Loading:');
console.log('dotenv package imported:', dotenv ? '✅ Yes' : '❌ No');
console.log('dotenv.config() called:', '✅ Yes');

console.log('\nMake sure your .env file is in the correct location and has the right format:');
console.log('- Each variable should be on its own line');
console.log('- No spaces around the equal sign');
console.log('- No quotes around values');
console.log('- Example: PGUSER=postgres');

// Exit with an error code if there are missing variables
if (missingVars.length > 0) {
  process.exit(1);
}