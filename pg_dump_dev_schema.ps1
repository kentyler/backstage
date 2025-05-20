# Script to dump only the 'dev' schema from the Neon PostgreSQL database
# Creates a file that can be used for migrations and schema creation

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Neon_Host = 'ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech',
    
    [Parameter()]
    [int]$Port = 5432,
    
    [Parameter()]
    [string]$User = 'neondb_owner',
    
    [Parameter()]
    [string]$Database = 'neondb',
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = (Join-Path -Path (Get-Location) -ChildPath 'dev_schema.sql')
)

# Ensure output directory exists
$outputDir = Split-Path -Parent $OutputFile
if (-not (Test-Path -Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Yellow
}

# Get PGPASSWORD from .env file if not set as environment variable
if (-not $env:PGPASSWORD) {
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        foreach ($line in $envContent) {
            if ($line -match "^PGPASSWORD=(.*)$") {
                $env:PGPASSWORD = $Matches[1]
                Write-Host "Using PGPASSWORD from .env file" -ForegroundColor Yellow
                break
            }
        }
    }
    
    if (-not $env:PGPASSWORD) {
        Write-Host "ERROR: PGPASSWORD not found in environment or .env file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Dumping 'dev' schema to: $OutputFile" -ForegroundColor Cyan

try {
    $dumpCommand = "pg_dump " +
        "--host $Neon_Host " +
        "--port $Port " +
        "--username $User " +
        "--dbname $Database " +
        "--schema dev " +
        "--schema-only " +
        "--no-owner " +
        "--no-privileges " +
        "--file $OutputFile"
    
    # Execute the command
    Invoke-Expression $dumpCommand
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    
    # Create a second file that's modified for use in creating a new schema
    $migrationFile = [System.IO.Path]::GetDirectoryName($OutputFile) + 
                    "\dev_to_" + 
                    [System.IO.Path]::GetFileNameWithoutExtension($OutputFile) + 
                    "_migration.sql"
    
    # Read the dump file, modify it, and save to the migration file
    $content = Get-Content -Path $OutputFile -Raw
    
    # Insert commands at the beginning
    $newHeader = @"
-- Migration script to copy dev schema to another schema
-- Usage: psql -v new_schema=your_schema_name -f this_file.sql

-- Set the target schema name (use -v new_schema=schema_name when running with psql)
\set target_schema :new_schema

-- Create the new schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS :"target_schema";

-- The following is the structure from the dev schema, modified to use the target schema
"@
    
    # Replace dev. with the target schema
    $modifiedContent = $content -replace "dev\.", ':"target_schema".';
    
    # Replace CREATE SCHEMA dev with a comment
    $modifiedContent = $modifiedContent -replace "CREATE SCHEMA dev;", "-- Original: CREATE SCHEMA dev;";
    
    # Combine and write to the migration file
    $newHeader + "`n`n" + $modifiedContent | Out-File -FilePath $migrationFile -Encoding utf8
    
    Write-Host "[SUCCESS] Schema successfully written to $OutputFile" -ForegroundColor Green
    Write-Host "[SUCCESS] Migration template created at $migrationFile" -ForegroundColor Green
    Write-Host "`nTo use the migration file:`n  psql -v new_schema=first_congregational -f $migrationFile" -ForegroundColor Cyan
    exit 0
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
}
