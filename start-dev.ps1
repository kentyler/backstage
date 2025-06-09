# PowerShell script to start both development servers and open browser
# For Windows users

Write-Host "🚀 Starting development servers..." -ForegroundColor Green

# Function to cleanup background jobs on exit
function Cleanup {
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    Get-Job | Stop-Job -PassThru | Remove-Job
    exit 0
}

# Set up cleanup on Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    # Start backend server
    Write-Host "📡 Starting backend server on port 5000..." -ForegroundColor Cyan
    $backendJob = Start-Job -ScriptBlock {
        Set-Location "backend"
        npm start
    }
    
    # Wait for backend to start
    Start-Sleep -Seconds 3
    
    if ($backendJob.State -eq "Failed") {
        Write-Host "❌ Backend failed to start" -ForegroundColor Red
        Receive-Job $backendJob
        exit 1
    }
    
    # Start frontend server  
    Write-Host "🎨 Starting frontend server on port 3000..." -ForegroundColor Cyan
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location "frontend"
        npm start
    }
    
    # Wait for frontend to compile
    Write-Host "⏳ Waiting for frontend to compile..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    
    if ($frontendJob.State -eq "Failed") {
        Write-Host "❌ Frontend failed to start" -ForegroundColor Red
        Receive-Job $frontendJob
        Stop-Job $backendJob
        exit 1
    }
    
    # Open browser
    Write-Host "🌐 Opening browser..." -ForegroundColor Green
    Start-Process "http://localhost:3000"
    
    Write-Host ""
    Write-Host "✅ Development environment is ready!" -ForegroundColor Green
    Write-Host "📡 Backend running on port 5000" -ForegroundColor Cyan
    Write-Host "🎨 Frontend running on port 3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
    
    # Keep script running
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if jobs are still running
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "❌ One of the servers failed" -ForegroundColor Red
            break
        }
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
finally {
    Cleanup
}