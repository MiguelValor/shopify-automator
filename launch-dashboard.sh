#!/bin/bash

# Launch AI Automation Dashboard
# This script links and starts your Shopify app

cd "/Users/MiguelValor/Documents/prototype 01/apps/dashboard"

echo "🔗 Step 1: Linking to your Shopify app..."
echo "This will open a browser to log in to Shopify Partners"
echo ""

npx @shopify/cli@latest app config link

echo ""
echo "✅ App linked!"
echo ""
echo "🚀 Step 2: Starting development server..."
echo "This will create a tunnel and start your app"
echo ""

npx @shopify/cli@latest app dev
