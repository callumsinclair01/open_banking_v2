@echo off
setlocal enabledelayedexpansion

REM FinanceNZ Setup Script for Windows
REM This script helps set up the development environment

echo.
echo 🚀 Setting up FinanceNZ development environment...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION:v=%") do set MAJOR_VERSION=%%i

if %MAJOR_VERSION% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: %NODE_VERSION%
    pause
    exit /b 1
)

echo ✅ Node.js %NODE_VERSION% detected
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo 📝 Creating .env.local from .env.example...
    copy .env.example .env.local >nul
    if %errorlevel% equ 0 (
        echo ✅ .env.local created successfully
        echo ⚠️  Please update .env.local with your actual environment variables
    ) else (
        echo ❌ Failed to create .env.local
    )
) else (
    echo ✅ .env.local already exists
)
echo.

REM Check if Supabase CLI is installed
echo 🗄️  Checking Supabase CLI...
where supabase >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Supabase CLI found
    echo 💡 You can start local development with: npm run supabase:start
) else (
    echo ⚠️  Supabase CLI not found. Install it for local development:
    echo    npm install -g supabase
)
echo.

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "public\images" mkdir "public\images"
if not exist "logs" mkdir "logs"
if not exist "tmp" mkdir "tmp"
echo ✅ Directories created
echo.

echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Update your .env.local file with actual environment variables
echo 2. Set up your Supabase project at https://supabase.com
echo 3. Run the database migration: supabase db push
echo 4. Configure your Stripe account and add the keys
echo 5. Set up Open Banking NZ API credentials
echo 6. Run 'npm run dev' to start the development server
echo.
echo For more information, see the README.md file.
echo.
pause
