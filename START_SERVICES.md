# 🚀 Quick Start Guide - Your AI Automation App

## ✅ Setup Complete!

I've successfully:
- Installed all dependencies
- Built shared packages (types, ai-core)
- Generated Prisma client
- Created all app routes with Polaris UI
- Created .env files for all services

## 🔑 IMPORTANT: Add Your Gemini API Key

Before starting, you need to add your Gemini API key to these files:

1. `/Users/MiguelValor/Documents/prototype 01/apps/dashboard/.env`
2. `/Users/MiguelValor/Documents/prototype 01/services/product-ai/.env`
3. `/Users/MiguelValor/Documents/prototype 01/services/inventory-ai/.env`

Replace `your_gemini_api_key_here` with your actual key from: https://makersuite.google.com/app/apikey

## 🎯 Start Everything (4 Terminals)

### Terminal 1: Product-AI Service
```bash
cd "/Users/MiguelValor/Documents/prototype 01/services/product-ai"
npx pnpm dev
```

### Terminal 2: Inventory-AI Service
```bash
cd "/Users/MiguelValor/Documents/prototype 01/services/inventory-ai"
npx pnpm dev
```

### Terminal 3: Workflow-Engine Service
```bash
cd "/Users/MiguelValor/Documents/prototype 01/services/workflow-engine"
npx pnpm dev
```

### Terminal 4: Shopify Dashboard App
```bash
cd "/Users/MiguelValor/Documents/prototype 01/apps/dashboard"
npx pnpm dev
```

This will:
- Start a dev server with hot reload
- Create a Cloudflare tunnel (or ngrok)
- Give you a URL to access your app

## 🎨 What You'll See

Once the dashboard starts, refresh your Shopify admin at:
`https://admin.shopify.com/store/ultra-instinct-7882/apps/automator-10`

You should now see:

### Dashboard (`/app`)
- ✅ Store overview
- ✅ Products needing SEO count
- ✅ AI features list
- ✅ Quick action buttons

### Product Optimization (`/app/products/optimize`)
- ✅ Table of products missing SEO
- ✅ "Optimize with AI" buttons
- ✅ Real-time optimization status
- ✅ Auto-apply for high confidence (80%+)
- ✅ Approval queue for low confidence

## 🧪 Test the AI

1. Click "Optimize Products" on the dashboard
2. Click "Optimize with AI" on any product
3. Watch it call your Product-AI service
4. See the SEO get updated in real-time!

## 📝 Service Health Checks

Once services are running, test them:

```bash
# Product-AI
curl http://localhost:3001/health

# Inventory-AI
curl http://localhost:3002/health

# Workflow-Engine
curl http://localhost:3003/health
```

## 🔧 Troubleshooting

### "GEMINI_API_KEY is required"
- Make sure you replaced `your_gemini_api_key_here` in the .env files

### Port already in use
```bash
lsof -ti:3001  # Check port 3001
kill -9 <PID>  # Kill the process
```

### Shopify app not loading
- Make sure the Cloudflare/ngrok tunnel URL is set in your Shopify app settings
- Run `npx shopify app config link` to reconnect

## 🎉 You're Ready!

Your AI-powered Shopify automation app is ready to transform product management!

Features:
- AI SEO optimization with Gemini
- Automatic high-confidence updates
- Manual approval for low-confidence suggestions
- Beautiful Polaris UI
- Embedded Shopify app experience
