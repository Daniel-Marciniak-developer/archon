@echo off
echo ========================================
echo    ARCHON PROJECT - SIMPLE STARTUP
echo ========================================
echo.

REM Check directories
if not exist "backend" (
    echo ERROR: backend directory not found!
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend directory not found!
    pause
    exit /b 1
)

echo Starting Backend Server in background...
start "Archon Backend" /min cmd /c "cd backend && python -m uvicorn main:app --reload --port 8000"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
cd frontend
npm run dev
