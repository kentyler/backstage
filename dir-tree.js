#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Main function to generate directory tree
function generateDirectoryTree(dir, indent = '') {
  console.log('Processing directory:', dir);
  let output = '';
  
  try {
    // Get all files and directories in the current directory
    const items = fs.readdirSync(dir);
    
    // Process each item
    for (const item of items) {
      // Skip node_modules and other directories we want to ignore
      if (item === 'node_modules' || item === '.git') continue;
      
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Add directory to the output
        output += `${indent}📁 ${item}/\n`;
        // Recursively process subdirectory
        output += generateDirectoryTree(itemPath, indent + '  ');
      } else {
        // Add file to the output
        output += `${indent}📄 ${item}\n`;
      }
    }
    
    return output;
  } catch (error) {
    console.error('Error reading directory:', dir, error);
    return `${indent}❌ Error reading ${dir}: ${error.message}\n`;
  }
}

// Run the script
try {
  console.log('Starting directory tree generation...');
  
  // Generate the tree
  const rootDir = '.';
  const outputFile = 'directory-tree.txt';
  
  console.log('Generating tree for directory:', rootDir);
  const treeContent = `📁 ${path.resolve(rootDir)}\n${generateDirectoryTree(rootDir, '  ')}`;
  
  console.log('Writing tree to file:', outputFile);
  fs.writeFileSync(outputFile, treeContent, 'utf8');
  
  console.log('Directory tree successfully written to:', path.resolve(outputFile));
} catch (error) {
  console.error('Error generating directory tree:', error);
}