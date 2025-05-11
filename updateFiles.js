const fs = require('fs');
const path = require('path');

// Function to check if a file needs updating
function needsUpdate(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Check if the pool import is the first line of code (after comments)
    const lines = content.split('\n');
    let foundCode = false;
    for (const line of lines) {
      if (line.trim() === '') continue;
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;
      foundCode = true;
      if (line.trim() === "import { pool } from '../connection.js';") {
        return true;
      }
      break;
    }
    return false;
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error}`);
    return false;
  }
}

// Function to update a file
function updateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let foundCode = false;
    let newLines = [];
    
    for (const line of lines) {
      if (line.trim() === '') {
        newLines.push(line);
        continue;
      }
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
        newLines.push(line);
        continue;
      }
      foundCode = true;
      if (line.trim() === "import { pool } from '../connection.js';") {
        continue; // Skip this line
      }
      newLines.push(line);
    }

    const newContent = newLines.join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error updating file ${filePath}: ${error}`);
  }
}

// Get all .js files in the db directory
const dbDir = path.join(__dirname, 'src', 'db');
const files = [];

// Function to recursively find files
function findFiles(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath);
    } else if (path.extname(item) === '.js') {
      files.push(fullPath);
    }
  }
}

findFiles(dbDir);

// Process each file
files.forEach(file => {
  if (needsUpdate(file)) {
    updateFile(file);
  }
});

console.log('Update complete!');
