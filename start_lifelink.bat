@echo off
title LifeLink AI - Google Gemini 2.5 Flash Launcher
echo ===================================================================
echo       LifeLink AI - Launcher (Powered by Google Gemini 2.5 Flash)
echo ===================================================================
echo.

:: 1. Read Google Gemini API Key from backend/.env if present
if "%GEMINI_API_KEY%"=="" (
    if exist "%~dp0lifelink-ai\backend\.env" (
        for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0lifelink-ai\backend\.env") do (
            if "%%A"=="GEMINI_API_KEY" set "GEMINI_API_KEY=%%B"
        )
    )
)
echo [1/2] Configured Google Gemini 2.5 Flash Vision API Key.

:: Find python executable
set "PY_EXE=python"
if exist "%~dp0venv\Scripts\python.exe" set "PY_EXE=%~dp0venv\Scripts\python.exe"

:: 2. Launch Backend
echo [2/2] Starting FastAPI Backend on http://localhost:8000 ...
start "LifeLink AI Backend" /min cmd /c "cd /d %~dp0lifelink-ai\backend && "%PY_EXE%" -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

:: 3. Launch Frontend in this same terminal
echo.
echo ===================================================================
echo   LifeLink AI is Live!
echo   Open in Browser: http://localhost:5173
echo   AI Engine:       Google Gemini 2.5 Flash Vision API
echo ===================================================================
echo.

cd /d %~dp0lifelink-ai\frontend
npm run dev -- --host 0.0.0.0 --port 5173
