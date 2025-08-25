#!/bin/bash

# FinanceNZ Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up FinanceNZ development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual environment variables"
else
    echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npm run db:generate

# Check if database is accessible
echo "🔍 Checking database connection..."
if npm run db:push --silent; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection failed. Please check your DATABASE_URL in .env.local"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p public/images
mkdir -p logs
mkdir -p tmp

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env.local file with actual environment variables"
echo "2. Set up your Supabase project and update the database URL"
echo "3. Configure your Stripe account and add the keys"
echo "4. Set up Open Banking NZ API credentials"
echo "5. Run 'npm run dev' to start the development server"
echo ""
echo "For more information, see the README.md file."
