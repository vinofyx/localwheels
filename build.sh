#!/usr/bin/env bash
set -e  # exit immediately on any error

echo "==> [1/3] Installing frontend dependencies..."
cd frontend
npm install

echo "==> [2/3] Building frontend (React + Vite)..."
npm run build

echo "==> [3/3] Installing backend dependencies..."
cd ../backend
npm install

echo ""
echo "✅ Build complete!"
echo "   dist contents:"
ls -la ../frontend/dist/
