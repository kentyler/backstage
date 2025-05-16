# Build and Run Script for Back-Stage Application
# This script builds the React frontend and runs the Express backend server
# which serves both the API and the React frontend from a single server process

Write-Host "Back-Stage Build and Run Script" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

# Function to safely kill processes on a specific port
function KillProcessOnPort($port) {
    try {
        # Use PowerShell to find and kill processes
        $netstatOutput = netstat -ano | Select-String ":$port\s+.*LISTENING\s+(\d+)"
        $pids = $netstatOutput | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
        
        if ($pids) {
            Write-Host "Found processes using port $port : $($pids -join ', ')" -ForegroundColor Yellow
            
            foreach ($pid in $pids) {
                # First try to kill it nicely
                taskkill /PID $pid /F 2>$null
                Start-Sleep -Milliseconds 500
                
                # Check if it's still running
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Process $pid still running, forcing termination..." -ForegroundColor Red
                    taskkill /F /PID $pid /T 2>$null
                    Start-Sleep -Milliseconds 500
                }
                
                # Final check
                if (-not (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
                    Write-Host "Process $pid successfully terminated" -ForegroundColor Green
                } else {
                    Write-Host "WARNING: Could not terminate process $pid" -ForegroundColor Red
                    return $false
                }
            }
            return $true
        } else {
            Write-Host "No processes found using port $port" -ForegroundColor Green
            return $true
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host ("Error while killing processes on port {0}: {1}" -f $port, $errorMsg) -ForegroundColor Red
        return $false
    }
}

# Step 1: Kill any existing processes on ports 3000 and 5000
Write-Host "`nChecking for processes on ports 3000 and 5000..." -ForegroundColor Yellow

$maxRetries = 3
$retryCount = 0
$success = $false

while (-not $success -and $retryCount -lt $maxRetries) {
    $retryCount++
    
    if ($retryCount -gt 1) {
        Write-Host "Retry attempt $retryCount of $maxRetries..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    
    # Try to kill processes on both ports
    $port3000Clear = KillProcessOnPort 3000
    $port5000Clear = KillProcessOnPort 5000
    
    if ($port3000Clear -and $port5000Clear) {
        $success = $true
        Write-Host "Successfully cleared ports 3000 and 5000" -ForegroundColor Green
    } else {
        Write-Host "Failed to clear ports. Retrying..." -ForegroundColor Red
    }
}

if (-not $success) {
    Write-Host "Failed to clear ports after $maxRetries attempts. Please check manually." -ForegroundColor Red
    exit 1
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
