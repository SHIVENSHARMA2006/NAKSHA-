# NAKSHA-AI Docker Desktop Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   NAKSHA-AI Container Deployment (Docker Desktop)       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking Docker status..." -ForegroundColor Yellow

docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Desktop is not running. Please start Docker Desktop and retry." -ForegroundColor Red
    exit 1
}

Write-Host "Building and launching NAKSHA-AI containers..." -ForegroundColor Cyan
docker compose up --build -d

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "NAKSHA-AI is now live on Docker Desktop!" -ForegroundColor Green
Write-Host "Frontend Web-GIS: http://localhost:3000" -ForegroundColor Cyan
Write-Host "FastAPI Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Interactive Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
