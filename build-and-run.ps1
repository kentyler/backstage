# Build and Run Script for Back-Stage Application
# This script builds the React frontend and runs the Express backend server
# which serves both the API and the React frontend from a single server process

Write-Host "Back-Stage Build and Run Script" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

# Step 1: Kill any existing processes on ports 3000 and 5000
Write-Host "Checking for processes on ports 3000 and 5000..." -ForegroundColor Cyan

# Function to safely kill processes on a specific port
function KillProcessOnPort($port) {
    try {
        # Find processes using the port
        $processInfoRaw = netstat -ano | findstr ":$port" | findstr "LISTENING"
        
        if ($processInfoRaw) {
            # Extract PIDs and remove duplicates
            $pidList = @()
            $processInfoRaw -split "`n" | ForEach-Object {
                if ($_ -match "LISTENING\s+(\d+)") {
                    $pidList += $matches[1]
                }
            }
            
            # Get unique PIDs
            $uniquePids = $pidList | Select-Object -Unique
            
            Write-Host "Found processes using port $port : $uniquePids" -ForegroundColor Yellow
            
            # Kill each process
            foreach ($pid in $uniquePids) {
                Write-Host "Killing process with PID: $pid" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                
                # Verify process was killed
                if (-not (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
                    Write-Host "Process with PID $pid successfully terminated" -ForegroundColor Green
                } else {
                    Write-Host "Failed to terminate process with PID $pid, trying taskkill..." -ForegroundColor Red
                    # Fallback to taskkill
                    taskkill /PID $pid /F /T
                }
            }
            return $true
        } else {
            Write-Host "No processes found using port $port" -ForegroundColor Green
            return $false
        }
    } catch {
        Write-Host "Error while killing processes on port $port" -ForegroundColor Red
        return $false
    }
}

# Kill processes on React and Express ports
$reactProcessKilled = KillProcessOnPort 3000
$expressProcessKilled = KillProcessOnPort 5000

# Only wait if processes were actually killed
if ($reactProcessKilled -or $expressProcessKilled) {
    Write-Host "Waiting for processes to terminate..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
}

# Step 2: Build the React frontend
Write-Host "`nBuilding React frontend..." -ForegroundColor Cyan

# Save current location to return to it later
$currentLocation = Get-Location

# Change to frontend directory and build the React app
Set-Location -Path "$currentLocation\frontend"

# Check if the directory exists
if (-not (Test-Path -Path ".")) {
    Write-Host "ERROR: Frontend directory not found at $currentLocation\frontend" -ForegroundColor Red
    exit 1
}

# Check if package.json exists before building
if (-not (Test-Path -Path ".\package.json")) {
    Write-Host "ERROR: package.json not found in frontend directory" -ForegroundColor Red
    exit 1
}

# Run npm install first to ensure dependencies are up to date
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install

# Build the React app
Write-Host "Building React app..." -ForegroundColor Cyan
npm run build

# Check if build was successful
if (-not (Test-Path -Path ".\build")) {
    Write-Host "React build failed! Check for errors." -ForegroundColor Red
    exit 1
}

# List build contents to confirm files are there
$buildFiles = Get-ChildItem -Path ".\build" -Recurse | Measure-Object
Write-Host "Build successful! Created $($buildFiles.Count) files." -ForegroundColor Green
Write-Host "Build directory: $currentLocation\frontend\build" -ForegroundColor Green

# Return to original directory
Set-Location -Path $currentLocation

# Step 3: Start the Express server
Write-Host "`nStarting Express server..." -ForegroundColor Cyan

# Change to backend directory
Set-Location -Path "$currentLocation\backend"

# Check if server.js exists
if (-not (Test-Path -Path ".\server.js")) {
    Write-Host "ERROR: server.js not found in backend directory" -ForegroundColor Red
    exit 1
}

# Start the server directly in the current window
Write-Host "Starting Node.js server..." -ForegroundColor Cyan
Write-Host "---------------------------------------------" -ForegroundColor Cyan
node server.js

# All server output will now be visible directly in the console
# The script execution will naturally pause at the node server.js command

# This message will be shown only if the server stops or crashes
Write-Host "`nServer has stopped. You may need to restart the script." -ForegroundColor Yellow
