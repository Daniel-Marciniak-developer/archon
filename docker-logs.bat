@echo off
echo ========================================
echo    ARCHON DOCKER LOGS
echo ========================================
echo.
echo Choose service to view logs:
echo.
echo 1. All services
echo 2. Backend only
echo 3. Frontend only
echo 4. PostgreSQL only
echo 5. Redis only
echo 6. Celery Worker only
echo.
set /p choice="Enter choice (1-6): "

if "%choice%"=="1" (
    echo Showing all logs...
    docker-compose logs -f
) else if "%choice%"=="2" (
    echo Showing backend logs...
    docker-compose logs -f backend
) else if "%choice%"=="3" (
    echo Showing frontend logs...
    docker-compose logs -f frontend
) else if "%choice%"=="4" (
    echo Showing PostgreSQL logs...
    docker-compose logs -f postgres
) else if "%choice%"=="5" (
    echo Showing Redis logs...
    docker-compose logs -f redis
) else if "%choice%"=="6" (
    echo Showing Celery Worker logs...
    docker-compose logs -f celery-worker
) else (
    echo Invalid choice. Showing all logs...
    docker-compose logs -f
)
