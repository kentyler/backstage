#!/usr/bin/env python3
"""
JSDoc Documentation Extractor

This script scans your project for files (respecting .gitignore), extracts JSDocs
style comments, and compiles them into a unified documentation file.
"""

import os
import re
import glob
import argparse
from pathlib import Path
from fnmatch import fnmatch

# Directories that should always be excluded
EXCLUDED_DIRS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage'
]

def load_gitignore(root_dir):
    """Load patterns from .gitignore file."""
    gitignore_path = os.path.join(root_dir, '.gitignore')
    ignore_patterns = []
    
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Convert gitignore pattern to glob pattern
                    pattern = line.rstrip('/')
                    ignore_patterns.append(pattern)
    
    return ignore_patterns

def should_ignore(path, ignore_patterns, root_dir):
    """Check if a path should be ignored based on gitignore patterns."""
    # Get relative path from project root
    rel_path = os.path.relpath(path, root_dir)
    
    # Check if in excluded directory - hard-coded exclusions
    path_parts = rel_path.split(os.sep)
    for part in path_parts:
        if part in EXCLUDED_DIRS:
            return True
    
    # Check each ignore pattern
    for pattern in ignore_patterns:
        if pattern.startswith('/'):
            # Pattern with leading slash matches only from root
            pattern = pattern[1:]
            if fnmatch(rel_path, pattern):
                return True
        else:
            # Pattern matches anywhere in path
            if fnmatch(rel_path, pattern) or any(fnmatch(part, pattern) for part in path_parts):
                return True
    
    return False

def extract_jsdoc_comments(file_path):
    """Extract JSDocs style comments from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
    except UnicodeDecodeError:
        # Skip binary files
        return []
    
    # Pattern to match JSDocs comments
    # This handles both /** ... */ style and // JSDoc style comments
    jsdoc_pattern = r'/\*\*[\s\S]*?\*/|//\s*\*[\s\S]*?(?:\n\s*//|$)'
    
    comments = re.finditer(jsdoc_pattern, content)
    
    result = []
    for match in comments:
        comment_text = match.group(0)
        # Add file path and comment to result
        result.append({
            'file': file_path,
            'comment': comment_text
        })
    
    return result

def format_documentation(comments, output_format='markdown'):
    """Format extracted comments into documentation."""
    if output_format == 'markdown':
        doc = "# Project Documentation\n\n"
        
        # Group comments by file
        files = {}
        for item in comments:
            file_path = item['file']
            if file_path not in files:
                files[file_path] = []
            files[file_path].append(item['comment'])
        
        # Generate documentation for each file
        for file_path, file_comments in files.items():
            doc += f"## {file_path}\n\n"
            
            for comment in file_comments:
                # Clean up the comment formatting
                clean_comment = comment.replace('/**', '').replace('*/', '').replace(' * ', '').replace('//', '')
                lines = [line.strip() for line in clean_comment.split('\n')]
                clean_lines = [line for line in lines if line]
                
                formatted_comment = '\n'.join(clean_lines)
                doc += f"```\n{formatted_comment}\n```\n\n"
        
        return doc
    else:
        # Could add support for HTML, JSON, etc.
        return "Unsupported output format"

def main():
    parser = argparse.ArgumentParser(description='Extract JSDocs comments from project files.')
    parser.add_argument('--root', '-r', default='.', help='Root directory of the project')
    parser.add_argument('--output', '-o', default='documentation.md', help='Output file path')
    parser.add_argument('--format', '-f', default='markdown', choices=['markdown'], help='Output format')
    parser.add_argument('--extensions', '-e', default='.js,.jsx,.ts,.tsx', help='Comma-separated list of file extensions to process')
    parser.add_argument('--verbose', '-v', action='store_true', help='Display more information during processing')
    
    args = parser.parse_args()
    
    root_dir = os.path.abspath(args.root)
    output_file = args.output
    output_format = args.format
    extensions = args.extensions.split(',')
    verbose = args.verbose
    
    if verbose:
        print(f"Scanning for files in {root_dir}...")
        print(f"Automatically excluding: {', '.join(EXCLUDED_DIRS)}")
    
    # Load gitignore patterns
    ignore_patterns = load_gitignore(root_dir)
    
    # Find all matching files, respecting gitignore
    all_comments = []
    files_processed = 0
    files_with_comments = 0
    
    for ext in extensions:
        for path in glob.glob(f"{root_dir}/**/*{ext}", recursive=True):
            if not should_ignore(path, ignore_patterns, root_dir):
                files_processed += 1
                file_comments = extract_jsdoc_comments(path)
                if file_comments:
                    files_with_comments += 1
                    all_comments.extend(file_comments)
                    if verbose:
                        print(f"Found {len(file_comments)} comments in {path}")
    
    # Generate documentation
    documentation = format_documentation(all_comments, output_format)
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(documentation)
    
    print(f"Documentation generated in {output_file}")
    print(f"Found {len(all_comments)} JSDocs comments in {files_with_comments} files")
    print(f"Total files processed: {files_processed}")

if __name__ == "__main__":
    main()