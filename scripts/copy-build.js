/**
 * Script to copy React build files to the backend/public directory
 * Works cross-platform on both Windows and Linux environments
 */

const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourcePath = path.join(__dirname, '..', 'frontend', 'build');
const destPath = path.join(__dirname, '..', 'backend', 'public');

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destPath)) {
  console.log(`Creating directory: ${destPath}`);
  fs.mkdirSync(destPath, { recursive: true });
}

// Function to recursively copy a directory
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Start the copy process
console.log(`Copying build files from ${sourcePath} to ${destPath}`);
try {
  copyDir(sourcePath, destPath);
  console.log('Successfully copied build files');
} catch (error) {
  console.error('Error copying build files:', error);
  process.exit(1);
}
