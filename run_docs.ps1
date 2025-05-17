# Run documentation generation scripts in sequence

# Set error action preference
$ErrorActionPreference = "Stop"

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Ensure docs directory exists
$docsDir = Join-Path -Path $scriptDir -ChildPath "docs"
if (-not (Test-Path -Path $docsDir)) {
    New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
    Write-Host "Created docs directory at: $docsDir" -ForegroundColor Yellow
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Green
}

function Write-Step {
    param([string]$Message, [int]$Step, [int]$TotalSteps = 3)
    Write-Host "`n[$Step/$TotalSteps] $Message..." -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Header -Message "Starting Documentation Generation"

# 1. Run pg_dump_schema.ps1
$schemaOutput = Join-Path -Path $docsDir -ChildPath "schema_dump.sql"
Write-Step -Message "Running database schema dump" -Step 1

& "$PSScriptRoot\pg_dump_schema.ps1" -OutputFile $schemaOutput
if ($LASTEXITCODE -ne 0) {
    Write-Error -Message "Database schema dump failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Success -Message "Database schema dump completed: $schemaOutput"

# 2. Run extract_jsdocs.py
$jsdocOutput = Join-Path -Path $docsDir -ChildPath "jsdocs.json"
Write-Step -Message "Extracting JSDocs from source files" -Step 2

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Using Python: $pythonVersion"
} catch {
    Write-Error -Message "Python is not installed or not in PATH. Please install Python and try again."
    exit 1
}

& python "$PSScriptRoot\extract_jsdocs.py" --output "$jsdocOutput" --format json
if ($LASTEXITCODE -ne 0) {
    Write-Error -Message "JSDoc extraction failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Success -Message "JSDoc extraction completed: $jsdocOutput"

# 3. Run dir-tree.js
$treeOutput = Join-Path -Path $docsDir -ChildPath "directory_tree.txt"
Write-Step -Message "Generating directory structure" -Step 3

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Using Node.js: $nodeVersion"
} catch {
    Write-Error -Message "Node.js is not installed or not in PATH. Please install Node.js and try again."
    exit 1
}

& node "$PSScriptRoot\dir-tree.js" --output "$treeOutput"
if ($LASTEXITCODE -ne 0) {
    Write-Error -Message "Directory tree generation failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Success -Message "Directory tree generation completed: $treeOutput"

# All done!
Write-Header -Message "Documentation Generation Complete!"
Write-Host "All documentation has been generated in the 'docs' directory:"
Write-Host "- Database Schema: $schemaOutput"
Write-Host "- API Documentation: $jsdocOutput"
Write-Host "- Project Structure: $treeOutput"

# Docs directory is ready
Write-Host "`nDocumentation has been generated in: $docsDir"
