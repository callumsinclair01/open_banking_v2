# FinanceNZ Setup Script for Windows PowerShell
# This script helps set up the development environment

Write-Host ""
Write-Host "🚀 Setting up FinanceNZ development environment..." -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Node.js is installed
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js version
$nodeVersion = node -v
$majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

if ($majorVersion -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local from .env.example..." -ForegroundColor Blue
    try {
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ .env.local created successfully" -ForegroundColor Green
        Write-Host "⚠️  Please update .env.local with your actual environment variables" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Failed to create .env.local: $_" -ForegroundColor Red
    }
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "🗄️  Checking Supabase CLI..." -ForegroundColor Blue
if (Test-Command "supabase") {
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
    Write-Host "💡 You can start local development with: npm run supabase:start" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Supabase CLI not found. Install it for local development:" -ForegroundColor Yellow
    Write-Host "   npm install -g supabase" -ForegroundColor Cyan
}
Write-Host ""

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Blue
$directories = @("public\images", "logs", "tmp")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Write-Host "✅ Directories created" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env.local file with actual environment variables" -ForegroundColor White
Write-Host "2. Set up your Supabase project at https://supabase.com" -ForegroundColor White
Write-Host "3. Run the database migration: supabase db push" -ForegroundColor White
Write-Host "4. Configure your Stripe account and add the keys" -ForegroundColor White
Write-Host "5. Set up Open Banking NZ API credentials" -ForegroundColor White
Write-Host "6. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see the README.md file." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"
