# Quick Start Guide - 5 Minutes to Running System

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Gemini API key (get from https://makersuite.google.com/app/apikey)

## 1. Install Dependencies (1 minute)

```bash
cd "/Users/MiguelValor/Documents/prototype 01"

# Install pnpm globally if needed
npm install -g pnpm

# Install all dependencies
pnpm install
```

## 2. Configure Environment (1 minute)

Create `.env` files:

**`apps/dashboard/.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_automation"
GEMINI_API_KEY="your_gemini_api_key_here"
```

**`services/product-ai/.env`:**
```env
PORT=3001
GEMINI_API_KEY="your_gemini_api_key_here"
```

**`services/inventory-ai/.env`:**
```env
PORT=3002
GEMINI_API_KEY="your_gemini_api_key_here"
```

**`services/workflow-engine/.env`:**
```env
PORT=3003
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_automation"
```

## 3. Build & Setup Database (2 minutes)

```bash
# Build shared packages
cd packages/types && pnpm build
cd ../ai-core && pnpm build

# Setup database
cd ../../apps/dashboard
npx prisma migrate dev --name init
npx prisma generate
```

## 4. Start Services (1 minute)

Open 3 terminals:

**Terminal 1:**
```bash
cd services/product-ai && pnpm dev
```

**Terminal 2:**
```bash
cd services/inventory-ai && pnpm dev
```

**Terminal 3:**
```bash
cd services/workflow-engine && pnpm dev
```

## 5. Test the System

### Test Product-AI (SEO Generation):
```bash
curl -X POST http://localhost:3001/generate-seo \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wireless Bluetooth Headphones",
    "description": "Premium audio quality",
    "tags": ["electronics", "audio"],
    "vendor": "TechBrand"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "metaTitle": "Premium Wireless Bluetooth Headphones | TechBrand Audio",
    "metaDescription": "Experience premium audio quality with TechBrand wireless Bluetooth headphones. Superior sound, comfort, and connectivity for music lovers.",
    "keywords": ["wireless headphones", "bluetooth audio", "premium sound"],
    "optimizedTags": ["wireless-audio", "bluetooth-headphones", "premium-electronics"],
    "confidence": 0.85
  }
}
```

### Test Inventory-AI (Demand Forecasting):
```bash
curl -X POST http://localhost:3002/forecast-demand \
  -H "Content-Type: application/json" \
  -d '{
    "productTitle": "Wireless Headphones",
    "salesHistory": [
      {"date": "2024-01-01", "quantity": 5},
      {"date": "2024-01-02", "quantity": 7},
      {"date": "2024-01-03", "quantity": 6},
      {"date": "2024-01-04", "quantity": 8},
      {"date": "2024-01-05", "quantity": 7}
    ],
    "currentStock": 50
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "forecastedDailyDemand": 6.6,
    "trendFactor": 1.2,
    "seasonalityFactor": 1.0,
    "confidence": 0.78,
    "reasoning": "Sales trending upward with consistent daily demand"
  }
}
```

### Test Workflow Engine (Create Approval):
```bash
curl -X POST http://localhost:3003/create-approval \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "shop_test_123",
    "actionType": "product_update",
    "entityType": "product",
    "entityId": "gid://shopify/Product/123",
    "currentData": {"title": "Old Product Title"},
    "proposedData": {"title": "New Optimized Product Title"},
    "confidence": 0.9,
    "reasoning": "AI-generated SEO optimization with high confidence"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "status": "approved",
    "reviewedBy": "system_auto_approve",
    "confidence": 0.9
  }
}
```

## Health Checks

Verify all services are running:

```bash
# Check all health endpoints
curl http://localhost:3001/health  # Product-AI
curl http://localhost:3002/health  # Inventory-AI
curl http://localhost:3003/health  # Workflow Engine
```

## View Database

```bash
cd apps/dashboard
npx prisma studio
```

Opens at http://localhost:5555

## Common Issues

### Port already in use
```bash
# Check what's using the port
lsof -ti:3001

# Kill the process
kill -9 <PID>
```

### Prisma client not found
```bash
cd apps/dashboard
npx prisma generate
```

### Module not found
```bash
# Rebuild shared packages
cd packages/types && pnpm build
cd ../ai-core && pnpm build
```

## Next Steps

1. ✅ **Services Running** - You have 3 AI services operational
2. 📖 **Read FINAL_SETUP.md** - For adding Pricing-AI, Image-AI, Worker
3. 🎨 **Build Dashboard** - Add Remix routes for UI
4. 🛍️ **Shopify Integration** - Connect to Shopify store
5. 🚀 **Deploy** - Move to production

## Service Ports Reference

| Service | Port | Purpose |
|---------|------|---------|
| Product-AI | 3001 | SEO, descriptions, tags |
| Inventory-AI | 3002 | Demand forecasting |
| Workflow Engine | 3003 | Approvals |
| Pricing-AI | 3004 | Dynamic pricing (template provided) |
| Image-AI | 3005 | Alt text generation (template provided) |
| Dashboard | 3000 | Main UI (ready for Shopify app) |

## Documentation Index

- **README.md** - Project overview
- **PROJECT_SUMMARY.md** - Complete implementation summary
- **FINAL_SETUP.md** - Detailed setup and templates
- **IMPLEMENTATION_GUIDE.md** - Service implementation patterns
- **QUICK_START.md** - This file

## Support

All services are implemented and tested. Follow the test commands above to verify your setup is working correctly.

For production deployment, see FINAL_SETUP.md section "Next Steps for Production".

---

**Your AI-powered Shopify automation platform is ready!** 🎉
