import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Set environment for testing
process.env.NODE_ENV = 'test';

// Always use 'dev' schema for tests
process.env.DB_SCHEMA = 'dev';

// Log environment variables for debugging
console.log('Test environment loaded:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DB_SCHEMA:', process.env.DB_SCHEMA);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '*** (set)' : 'Not set');
