#!/usr/bin/env bash
# Render start script for Shopify Remix app

set -e  # Exit on error

echo "🚀 Starting Shopify app..."
cd apps/dashboard
pnpm start
