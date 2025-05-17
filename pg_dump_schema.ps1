<#
.SYNOPSIS
  Dumps the PostgreSQL schema (with comments) from a Neon database.
  call in terminal: .\pg_dump.ps1
#>

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
    
    [Parameter(Mandatory=$true)]
    [string]$OutputFile = (Join-Path -Path (Get-Location) -ChildPath 'neon_schema.sql')
)

# Ensure output directory exists
$outputDir = Split-Path -Parent $OutputFile
if (-not (Test-Path -Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Yellow
}

# Assumes PGPASSWORD is set as a Windows environment variable
Write-Host "Dumping schema to: $OutputFile" -ForegroundColor Cyan

try {
    pg_dump `
        --host $Neon_Host `
        --port $Port `
        --username $User `
        --dbname $Database `
        --schema-only `
        --no-owner `
        --no-privileges `
        --file $OutputFile
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "[SUCCESS] Schema successfully written to $OutputFile" -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
}
