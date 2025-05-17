<#
.SYNOPSIS
    Updates the ARCHITECTURE.md file with recent decisions
.DESCRIPTION
    Scans the docs/decisions directory and updates the ARCHITECTURE.md file
    to include a summary of recent decisions in the "Recent Changes" section.
.EXAMPLE
    .\update-architecture.ps1
#>

$ErrorActionPreference = "Stop"

# Paths
$rootDir = Split-Path -Parent $PSScriptRoot
$decisionsDir = Join-Path $rootDir "docs\decisions"
$architectureFile = Join-Path $rootDir "docs\ARCHITECTURE.md"

# Get all decision files (excluding template and README)
$decisionFiles = Get-ChildItem -Path $decisionsDir -Filter "*.md" | 
    Where-Object { $_.Name -notin @('TEMPLATE.md', 'README.md') } |
    Sort-Object -Descending

# Parse decision files and extract metadata
$decisions = @()

foreach ($file in $decisionFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Extract metadata using regex
    if ($content -match '## \[(?<date>[^\]]+)\] Decision: (?<title>[^\n]+).*?\*\*Status\*\*: (?<status>[^\n]+).*?\*\*Impact\*\*:([^#]+)') {
        $decisions += [PSCustomObject]@{
            Date = $matches['date']
            Title = $matches['title'].Trim()
            Status = $matches['status'].Trim()
            Impact = $matches[3].Trim() -replace '\s+', ' '
            FileName = $file.Name
        }
    }
}

# Generate markdown for recent decisions (last 5)
$recentDecisions = $decisions | Sort-Object Date -Descending | Select-Object -First 5

$recentChanges = "## Recent Changes\n\n"

foreach ($decision in $recentDecisions) {
    $recentChanges += "### $($decision.Date) - $($decision.Title)\n"
    $recentChanges += "**Status**: $($decision.Status)\n"
    $recentChanges += "**Impact**: $($decision.Impact)\n"
    $recentChanges += "[View decision](./decisions/$($decision.FileName))\n\n"
}

# Update ARCHITECTURE.md
$content = Get-Content -Path $architectureFile -Raw

# Replace the Recent Changes section
$content = $content -replace '(?s)## Recent Changes.*?(?=## |$)', $recentChanges.Trim()

# Save the updated content
$content | Out-File -FilePath $architectureFile -Encoding utf8 -NoNewline

Write-Host "ARCHITECTURE.md has been updated with recent decisions."
