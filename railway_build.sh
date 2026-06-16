#!/bin/bash

# Build script for Railway
echo "🚀 Starting build process..."

# Install frontend dependencies and build
echo "📦 Building frontend..."
pnpm install
pnpm run build

# Check if build succeeded
if [ -d "dist" ]; then
    echo "✅ Frontend built successfully."
    # FastAPI expects dist/public, let's make sure it's there
    if [ ! -d "dist/public" ]; then
        mkdir -p dist/public
        cp -r dist/* dist/public/ 2>/dev/null || true
    fi
else
    echo "❌ Frontend build failed."
fi

# Install backend dependencies
echo "🐍 Installing backend dependencies..."
pip install -r requirements.txt

echo "✨ Build process completed."
