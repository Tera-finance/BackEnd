#!/bin/bash

# TrustBridge Backend Deployment Script
# Usage: ./deploy.sh [branch]

set -e  # Exit on error

BRANCH=${1:-main}
APP_NAME="trustbridge-api"

echo "🚀 Starting TrustBridge Backend deployment..."
echo "📦 Branch: $BRANCH"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the backend-trustbridge directory?"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code from $BRANCH..."
git pull origin $BRANCH

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed. dist/ directory not found."
    exit 1
fi

# Restart PM2
echo "🔄 Restarting PM2 process..."
pm2 restart $APP_NAME

# Show status
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status $APP_NAME

echo ""
echo "📝 Recent Logs:"
pm2 logs $APP_NAME --lines 20 --nostream

echo ""
echo "🎉 Deployment finished!"
echo "💡 To view live logs: pm2 logs $APP_NAME"
echo "💡 To monitor: pm2 monit"
