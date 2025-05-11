/**
 * Test setup file
 * This file sets up the test environment before tests run
 */

// Import the schema configuration
import { setDefaultSchema } from '../src/config/schema.js';

// Set the default schema to 'dev' for all tests
setDefaultSchema('dev');

console.log('Test setup: Default schema set to "dev"');
