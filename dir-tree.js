#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        output: 'directory-tree.txt',
        directory: '.',
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--output' || arg === '-o') {
            options.output = args[++i];
        } else if (arg === '--directory' || arg === '-d') {
            options.directory = args[++i];
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg.startsWith('--')) {
            console.error(`Unknown option: ${arg}`);
            process.exit(1);
        } else if (i === 0) {
            options.directory = arg;
        } else if (i === 1) {
            options.output = arg;
        }
    }

    return options;
}

function showHelp() {
    console.log(`
Directory Tree Generator

Usage:
  ${path.basename(process.argv[1])} [options] [directory] [output-file]

Options:
  -d, --directory <path>  Directory to generate tree for (default: .)
  -o, --output <file>     Output file path (default: directory-tree.txt)
  -h, --help             Show this help message
  `);
}

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

// Main function to run the script
async function main() {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        return 0;
    }
    
    try {
        const rootDir = path.resolve(process.cwd(), options.directory);
        const outputFile = path.isAbsolute(options.output) 
            ? options.output 
            : path.resolve(process.cwd(), options.output);
        
        console.log('Starting directory tree generation...');
        console.log('Root directory:', rootDir);
        console.log('Output file:', outputFile);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputFile);
        if (outputDir && !fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log('Created output directory:', outputDir);
        }
        
        // Generate the tree content
        console.log('Generating directory tree...');
        const treeContent = `📁 ${rootDir}\n${generateDirectoryTree(rootDir, '  ')}`;
        
        // Write to file
        fs.writeFileSync(outputFile, treeContent, 'utf8');
        
        console.log('✓ Directory tree successfully written to:', outputFile);
        return 0;
    } catch (error) {
        console.error('❌ Error generating directory tree:', error.message);
        return 1;
    }
}

// Run the script
main().then(exitCode => {
    process.exit(exitCode);
}).catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});