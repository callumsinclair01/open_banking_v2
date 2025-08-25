#!/bin/bash

# FinanceNZ Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 Deploying FinanceNZ to production..."

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're not on the main branch. Current branch: $CURRENT_BRANCH"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ There are uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
if npm test; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed. Please fix them before deploying."
    exit 1
fi

# Build the application
echo "🏗️  Building application..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix the errors."
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
if npm run db:migrate; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migrations failed"
    exit 1
fi

# Deploy to Vercel (if using Vercel)
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    echo "✅ Deployed to Vercel"
else
    echo "⚠️  Vercel CLI not found. Please deploy manually or install Vercel CLI."
fi

# Create a deployment tag
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
TAG="deploy-$TIMESTAMP"
git tag $TAG
git push origin $TAG

echo "🎉 Deployment complete!"
echo "📝 Deployment tag: $TAG"
echo ""
echo "Post-deployment checklist:"
echo "1. Verify the application is running correctly"
echo "2. Check that all environment variables are set"
echo "3. Test the Open Banking integration"
echo "4. Verify Stripe webhooks are working"
echo "5. Monitor logs for any errors"
