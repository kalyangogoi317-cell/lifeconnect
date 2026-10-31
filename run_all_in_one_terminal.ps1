# LifeLink AI - Unified 1-Terminal Launcher
# Powered 100% by Google Gemini 2.5 Flash API + FastAPI Backend + Vite React Frontend

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = $PSScriptRoot }
if (-not $scriptDir) { $scriptDir = "D:\healthcare" }

$pythonExe = if (Test-Path "$scriptDir\venv\Scripts\python.exe") { "$scriptDir\venv\Scripts\python.exe" } else { "python" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     LifeLink AI - Google Gemini 2.5 Flash Launcher       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Load Google Gemini API Key from backend/.env if present
$envFile = "$scriptDir\lifelink-ai\backend\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim().Trim('"').Trim("'"))
        }
    }
}
Write-Host "[1/2] Configured Google Gemini API (gemini-2.5-flash)" -ForegroundColor Green

# 2. Start FastAPI Backend
Write-Host "[2/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($dir, $py)
    Set-Location "$dir\lifelink-ai\backend"
    & $py -m uvicorn main:app --host 0.0.0.0 --port 8000
} -ArgumentList $scriptDir, $pythonExe

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  LifeLink AI is Live and Ready!                          " -ForegroundColor Green
Write-Host "  Browser URL:  http://localhost:5173                     " -ForegroundColor Yellow
Write-Host "  Backend API:  http://localhost:8000                     " -ForegroundColor Yellow
Write-Host "  AI Engine:    Google Gemini 2.5 Flash Vision API        " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Vite React Frontend (Press Ctrl+C to stop)..." -ForegroundColor Gray
Write-Host ""

Set-Location "$scriptDir\lifelink-ai\frontend"
npm run dev -- --host 0.0.0.0 --port 5173
