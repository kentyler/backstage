Write-Host "Express React Restart Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Kill processes on ports 3000 and 5000
Write-Host "`nChecking for processes on ports 3000 and 5000..." -ForegroundColor Yellow

# Find and kill processes on port 3000 (React)
$processesOn3000 = netstat -ano | Select-String ":3000" | ForEach-Object { ($_ -split "\s+")[5] } | Where-Object { $_ -ne "" -and $_ -ne "PID" } | Select-Object -Unique
if ($processesOn3000) {
    Write-Host "Found processes using port 3000 (React): $processesOn3000" -ForegroundColor Red
    foreach ($processId in $processesOn3000) {
        Write-Host "Killing process with PID: $processId" -ForegroundColor Red
        taskkill /F /PID $processId
    }
} else {
    Write-Host "No processes found using port 3000" -ForegroundColor Green
}

# Find and kill processes on port 5000 (Express)
$processesOn5000 = netstat -ano | Select-String ":5000" | ForEach-Object { ($_ -split "\s+")[5] } | Where-Object { $_ -ne "" -and $_ -ne "PID" } | Select-Object -Unique
if ($processesOn5000) {
    Write-Host "Found processes using port 5000 (Express): $processesOn5000" -ForegroundColor Red
    foreach ($processId in $processesOn5000) {
        Write-Host "Killing process with PID: $processId" -ForegroundColor Red
        taskkill /F /PID $processId
    }
} else {
    Write-Host "No processes found using port 5000" -ForegroundColor Green
}

# Give a moment for processes to fully terminate
Write-Host "`nWaiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Install backend dependencies if needed
Write-Host "`nChecking backend dependencies..." -ForegroundColor Cyan
if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd .\backend; npm install; Read-Host 'Press Enter when install is complete'" -Wait -WindowStyle Normal
}

# Install frontend dependencies if needed
Write-Host "`nChecking frontend dependencies..." -ForegroundColor Cyan
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd .\frontend; npm install; Read-Host 'Press Enter when install is complete'" -Wait -WindowStyle Normal
}

# Start the Express backend server
Write-Host "`nStarting Express backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd .\backend; npm start" -WindowStyle Normal

# Start the React frontend server
Write-Host "`nStarting React frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd .\frontend; npm start" -WindowStyle Normal

Write-Host "`nServers are starting!" -ForegroundColor Green
Write-Host "- Backend Express server: http://localhost:5000" -ForegroundColor Green
Write-Host "- Frontend React server: http://localhost:3000" -ForegroundColor Green
Write-Host "`nServers are running in separate windows. You can close this window." -ForegroundColor Yellow
Write-Host "To restart servers, run this script again." -ForegroundColor Yellow
