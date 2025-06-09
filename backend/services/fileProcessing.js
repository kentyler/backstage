/**
 * File Processing Service - Legacy Entry Point
 * 
 * This file is maintained for backward compatibility.
 * New code should use the modular structure in ./fileProcessing/
 */

// Re-export all functions from the new modular structure
export { 
  processFile, 
  deleteFromStorage, 
  searchFileContent, 
  isFileInProcessing 
} from './fileProcessing/index.js';
