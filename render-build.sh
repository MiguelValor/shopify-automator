#!/usr/bin/env bash
# Render build script for Shopify Remix app

set -e  # Exit on error

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🗄️  Setting up database..."
cd apps/dashboard
pnpm prisma generate
pnpm prisma db push || echo "Warning: Could not push database schema (this is expected in production)"

echo "🏗️  Building application..."
pnpm build

echo "✅ Build complete!"
