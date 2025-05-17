<#
.SYNOPSIS
    Creates a new architectural decision record
.DESCRIPTION
    This script creates a new markdown file in the docs/decisions directory
    with a standardized template for architectural decisions.
.PARAMETER Title
    The title of the decision (in quotes if it contains spaces)
.EXAMPLE
    .\new-decision.ps1 "LLM Integration Pattern"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Title
)

# Get current date in YYYY-MM-DD format
$date = Get-Date -Format "yyyy-MM-dd"

# Create filename-safe version of title
$safeTitle = $Title.ToLower() -replace '[^a-z0-9]','-'
$safeTitle = $safeTitle -replace '-+','-'
$safeTitle = $safeTitle.Trim('-')

$fileName = "$date-$safeTitle.md"
$filePath = Join-Path -Path "$PSScriptRoot\..\docs\decisions" -ChildPath $fileName

# Check if file already exists
if (Test-Path $filePath) {
    Write-Error "Decision file already exists: $filePath"
    exit 1
}

# Get template content
$templatePath = Join-Path -Path "$PSScriptRoot\..\docs\decisions" -ChildPath "TEMPLATE.md"
$template = Get-Content -Path $templatePath -Raw

# Replace placeholders
$template = $template -replace '\[YYYY-MM-DD\]', "[$date]"
$template = $template -replace 'Brief Title', $Title

# Write the new file
$template | Out-File -FilePath $filePath -Encoding utf8

Write-Host "Created new decision file: $filePath"
Write-Host "Opening in default editor..."

# Open the file in the default editor
Invoke-Item $filePath
