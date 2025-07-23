@echo off
echo ========================================
echo    ARCHON PROJECT SETUP SCRIPT
echo ========================================
echo.
echo This script will help you set up the Archon project.
echo.

REM Check if we're in the correct directory
if not exist "backend" (
    echo ERROR: backend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/6] Checking prerequisites...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.12+
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
) else (
    echo ✅ Python found
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js 18+
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found! Please install npm
    pause
    exit /b 1
) else (
    echo ✅ npm found
)

echo.
echo [2/6] Setting up environment files...

REM Copy .env files if they don't exist
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env"
        echo ✅ Created backend/.env from example
        echo ⚠️  Please edit backend/.env with your database and Redis URLs
    ) else (
        echo ❌ backend/.env.example not found
    )
) else (
    echo ✅ backend/.env already exists
)

if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env"
        echo ✅ Created frontend/.env from example
    ) else (
        echo ❌ frontend/.env.example not found
    )
) else (
    echo ✅ frontend/.env already exists
)

echo.
echo [3/6] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
) else (
    echo ✅ Backend dependencies installed
)

echo.
echo [4/6] Installing frontend dependencies...
cd ..\frontend
npm install --legacy-peer-deps
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
) else (
    echo ✅ Frontend dependencies installed
)

cd ..

echo.
echo [5/6] Database setup...
echo.
echo ⚠️  IMPORTANT: You need to set up PostgreSQL and Redis manually!
echo.
echo 📖 Database setup instructions: SETUP-DATABASE.md
echo 📖 Redis setup instructions: SETUP-REDIS.md
echo.
echo After setting up PostgreSQL, run:
echo   psql -U your_user -d archon_dev -f backend/schema.sql
echo.

echo [6/6] Setup complete!
echo.
echo ========================================
echo    NEXT STEPS
echo ========================================
echo.
echo 1. Set up PostgreSQL (see SETUP-DATABASE.md)
echo 2. Set up Redis (see SETUP-REDIS.md)
echo 3. Edit backend/.env with your database URLs
echo 4. Run: startup.bat
echo.
echo ========================================
echo.
pause
