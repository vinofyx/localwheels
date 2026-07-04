#!/usr/bin/env bash
# ── LocalWheels local full-stack build ───────────────────────────────────────
# Use this script for LOCAL testing only.
# Hostinger deploys backend and frontend separately via GitHub integration.
set -e

echo "==> Installing backend dependencies..."
cd backend && npm install && cd ..

echo "==> Installing & building frontend..."
cd frontend && npm install && npm run build && cd ..

echo "✅ Full build complete"
