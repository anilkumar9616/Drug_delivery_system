@echo off
REM ============================================================
REM Drug Delivery Platform - Local Development Setup Script
REM For Windows (PowerShell Required)
REM ============================================================

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  Drug Delivery Platform - Setup Script                ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
if not exist "%APPDATA%\npm\npm.cmd" (
    echo ❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/
    exit /b 1
)
echo ✅ Node.js is installed

REM Check if Docker is installed (optional)
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Docker not found. Docker setup is optional for local development.
) else (
    echo ✅ Docker is installed
)

REM Create directory structure
echo.
echo 📁 Creating directory structure...
if not exist "api-gateway\src" mkdir api-gateway\src
if not exist "services\auth-service\src" mkdir services\auth-service\src
if not exist "services\user-service\src" mkdir services\user-service\src
if not exist "services\medicine-service\src" mkdir services\medicine-service\src
if not exist "services\prescription-service\src" mkdir services\prescription-service\src
if not exist "services\order-service\src" mkdir services\order-service\src
if not exist "services\delivery-service\src" mkdir services\delivery-service\src
if not exist "frontend" mkdir frontend
if not exist "shared" mkdir shared
echo ✅ Directory structure created

REM Install API Gateway dependencies
echo.
echo 📦 Installing API Gateway dependencies...
cd api-gateway
call npm install
cd ..
echo ✅ API Gateway dependencies installed

REM Install Auth Service dependencies
echo.
echo 📦 Installing Auth Service dependencies...
cd services\auth-service
call npm install
cd ..\..
echo ✅ Auth Service dependencies installed

REM Create .env files
echo.
echo 🔐 Setting up environment variables...
if not exist "api-gateway\.env" (
    copy api-gateway\.env.example api-gateway\.env
    echo ✅ Created api-gateway\.env
)

if not exist "services\auth-service\.env" (
    copy services\auth-service\.env.example services\auth-service\.env
    echo ✅ Created services\auth-service\.env
)

REM Instructions
echo.
echo ╔═════════════════════════════════════════════════════════╗
echo ║  Setup Complete! 🎉                                    ║
echo ╠═════════════════════════════════════════════════════════╣
echo ║                                                         ║
echo ║  Next Steps:                                           ║
echo ║  1. Configure PostgreSQL & Redis in .env files        ║
echo ║  2. Create database:                                  ║
echo ║     psql -U postgres -f docs\DATABASE_SCHEMA.sql      ║
echo ║  3. Start services:                                   ║
echo ║     - Option A: Docker Compose                        ║
echo ║       docker-compose up -d                            ║
echo ║     - Option B: Local (multiple terminals)            ║
echo ║       Terminal 1: cd api-gateway && npm run dev       ║
echo ║       Terminal 2: cd services\auth-service && ...     ║
echo ║  4. Open browser: http://localhost:4000/health        ║
echo ║                                                         ║
echo ║  Documentation:                                        ║
echo ║  - Architecture: docs\ARCHITECTURE.md                 ║
echo ║  - Database: docs\DATABASE_SCHEMA.sql                 ║
echo ║  - Main README: README.md                             ║
echo ║                                                         ║
echo ║  Useful Commands:                                      ║
echo ║  - Check API Gateway: curl http://localhost:4000/...  ║
echo ║  - Check Auth Service: curl http://localhost:5001/... ║
echo ║  - Docker logs: docker-compose logs -f                ║
echo ║  - Docker down: docker-compose down                   ║
echo ║                                                         ║
echo ╚═════════════════════════════════════════════════════════╝
echo.

pause
