# FinanceNZ Deployment Script for Windows PowerShell
# This script helps deploy the application to production

Write-Host ""
Write-Host "🚀 Deploying FinanceNZ to production..." -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if we're on the main branch
try {
    $currentBranch = git branch --show-current 2>$null
    if ($currentBranch -ne "main") {
        Write-Host "⚠️  Warning: You're not on the main branch. Current branch: $currentBranch" -ForegroundColor Yellow
        $continue = Read-Host "Do you want to continue? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "⚠️  Could not determine current branch. Continuing..." -ForegroundColor Yellow
}

# Check if there are uncommitted changes
try {
    $changes = git status --porcelain 2>$null
    if ($changes) {
        Write-Host "❌ There are uncommitted changes. Please commit or stash them first." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "⚠️  Could not check git status. Continuing..." -ForegroundColor Yellow
}

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Blue
try {
    npm test
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All tests passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Tests failed. Please fix them before deploying." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Tests failed. Please fix them before deploying." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Build the application
Write-Host "🏗️  Building application..." -ForegroundColor Blue
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed. Please fix the errors." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Build failed. Please fix the errors." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Blue
try {
    npm run db:migrate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migrations completed" -ForegroundColor Green
    } else {
        Write-Host "❌ Database migrations failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Database migrations failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Deploy to Vercel (if using Vercel)
if (Test-Command "vercel") {
    Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Blue
    try {
        vercel --prod
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployed to Vercel" -ForegroundColor Green
        } else {
            Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Vercel deployment failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Vercel CLI not found. Please deploy manually or install Vercel CLI." -ForegroundColor Yellow
    Write-Host "Install with: npm install -g vercel" -ForegroundColor Cyan
}
Write-Host ""

# Create a deployment tag
try {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $tag = "deploy-$timestamp"
    git tag $tag
    git push origin $tag
    
    Write-Host "🎉 Deployment complete!" -ForegroundColor Green
    Write-Host "📝 Deployment tag: $tag" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Could not create deployment tag: $_" -ForegroundColor Yellow
    Write-Host "🎉 Deployment complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Post-deployment checklist:" -ForegroundColor Cyan
Write-Host "1. Verify the application is running correctly" -ForegroundColor White
Write-Host "2. Check that all environment variables are set" -ForegroundColor White
Write-Host "3. Test the Open Banking integration" -ForegroundColor White
Write-Host "4. Verify Stripe webhooks are working" -ForegroundColor White
Write-Host "5. Monitor logs for any errors" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
