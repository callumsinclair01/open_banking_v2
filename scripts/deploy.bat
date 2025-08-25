@echo off
setlocal enabledelayedexpansion

REM FinanceNZ Deployment Script for Windows
REM This script helps deploy the application to production

echo.
echo 🚀 Deploying FinanceNZ to production...
echo.

REM Check if we're on the main branch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i

if not "%CURRENT_BRANCH%"=="main" (
    echo ⚠️  Warning: You're not on the main branch. Current branch: %CURRENT_BRANCH%
    set /p CONTINUE="Do you want to continue? (y/N): "
    if /i not "!CONTINUE!"=="y" (
        echo ❌ Deployment cancelled
        pause
        exit /b 1
    )
)

REM Check if there are uncommitted changes
git status --porcelain >nul 2>&1
for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set CHANGES=%%i
if !CHANGES! gtr 0 (
    echo ❌ There are uncommitted changes. Please commit or stash them first.
    pause
    exit /b 1
)

REM Run tests
echo 🧪 Running tests...
call npm test
if %errorlevel% equ 0 (
    echo ✅ All tests passed
) else (
    echo ❌ Tests failed. Please fix them before deploying.
    pause
    exit /b 1
)
echo.

REM Build the application
echo 🏗️  Building application...
call npm run build
if %errorlevel% equ 0 (
    echo ✅ Build successful
) else (
    echo ❌ Build failed. Please fix the errors.
    pause
    exit /b 1
)
echo.

REM Run database migrations
echo 🗄️  Running database migrations...
call npm run db:migrate
if %errorlevel% equ 0 (
    echo ✅ Database migrations completed
) else (
    echo ❌ Database migrations failed
    pause
    exit /b 1
)
echo.

REM Deploy to Vercel (if using Vercel)
where vercel >nul 2>nul
if %errorlevel% equ 0 (
    echo 🌐 Deploying to Vercel...
    call vercel --prod
    if %errorlevel% equ 0 (
        echo ✅ Deployed to Vercel
    ) else (
        echo ❌ Vercel deployment failed
    )
) else (
    echo ⚠️  Vercel CLI not found. Please deploy manually or install Vercel CLI.
    echo Install with: npm install -g vercel
)
echo.

REM Create a deployment tag
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Format 'yyyyMMdd-HHmmss'"') do set TIMESTAMP=%%i
set TAG=deploy-%TIMESTAMP%
git tag %TAG%
git push origin %TAG%

echo 🎉 Deployment complete!
echo 📝 Deployment tag: %TAG%
echo.
echo Post-deployment checklist:
echo 1. Verify the application is running correctly
echo 2. Check that all environment variables are set
echo 3. Test the Open Banking integration
echo 4. Verify Stripe webhooks are working
echo 5. Monitor logs for any errors
echo.
pause
