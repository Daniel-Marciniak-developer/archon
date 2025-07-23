@echo off
echo ========================================
echo    ARCHON PROJECT - DOCKER STARTUP
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/4] Stopping any existing containers...
docker-compose down

echo.
echo [2/4] Building images (this may take a few minutes)...
docker-compose build

echo.
echo [3/4] Starting all services...
docker-compose up -d

echo.
echo [4/4] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo    CHECKING SERVICE STATUS
echo ========================================

REM Check PostgreSQL
echo Checking PostgreSQL...
docker-compose exec -T postgres pg_isready -U archon_user -d archon_dev
if errorlevel 1 (
    echo ❌ PostgreSQL not ready
) else (
    echo ✅ PostgreSQL ready
)

REM Check Redis
echo Checking Redis...
docker-compose exec -T redis redis-cli ping
if errorlevel 1 (
    echo ❌ Redis not ready
) else (
    echo ✅ Redis ready
)

echo.
echo ========================================
echo    SERVICES RUNNING
echo ========================================
echo.
echo 🌐 Frontend:     http://localhost:5173
echo 🔧 Backend API:  http://localhost:8000
echo 📚 API Docs:     http://localhost:8000/docs
echo 🗄️  PostgreSQL:   localhost:5432
echo 🔴 Redis:        localhost:6379
echo.
echo ========================================
echo    USEFUL COMMANDS
echo ========================================
echo.
echo View logs:       docker-compose logs -f
echo Stop services:   docker-compose down
echo Restart:         docker-compose restart
echo Shell access:    docker-compose exec backend bash
echo Database shell:  docker-compose exec postgres psql -U archon_user -d archon_dev
echo.
echo Press any key to view logs (Ctrl+C to exit logs)...
pause >nul

echo.
echo Showing logs (Press Ctrl+C to exit)...
docker-compose logs -f
