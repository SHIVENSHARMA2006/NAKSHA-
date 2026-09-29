# NAKSHA-AI Local Development Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   NAKSHA-AI Cadastral Decision Support Engine (DILRMP)   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Using Python virtual environment at: D:\naksha_env" -ForegroundColor Yellow
Write-Host "Caches isolated to: D:\naksha_cache" -ForegroundColor Yellow
Write-Host ""

$env:PYTHONPATH = "$PSScriptRoot"

# Start Backend in background process
Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "D:\naksha_env\Scripts\uvicorn.exe" -ArgumentList "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# Start Frontend Vite Dev Server
Write-Host "Starting Web-GIS Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
