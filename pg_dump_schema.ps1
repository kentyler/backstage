<#
.SYNOPSIS
  Dumps the PostgreSQL schema (with comments) from a Neon database.
  call in terminal: .\pg_dump.ps1
#>

param(
  [string]$Neon_Host     = 'ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech',
  [int]   $Port     = 5432,
  [string]$User     = 'neondb_owner',
  [string]$Database = 'neondb',
  [string]$Output   = 'neon_schema.sql'
)

# Assumes PGPASSWORD is set as a Windows environment variable
Write-Host "Dumping schema .."
pg_dump `
  --host     $Neon_Host `
  --port     $Port `
  --username $User `
  --dbname   $Database `
  --schema-only `
  --no-owner `
  --no-privileges `
  --file     $Output

Write-Host "Schema written to $Output"
