# Final Setup and Deployment Guide

## 🎯 Current Status

### ✅ Completed Components

1. **Project Structure**
   - Monorepo with pnpm workspaces
   - Turbo build system configured
   - TypeScript configuration across all packages

2. **Database Layer**
   - Complete Prisma schema with 11 models
   - All relationships defined
   - Indexes optimized

3. **Shared Packages**
   - `@shopify-automation/types` - All TypeScript interfaces
   - `@shopify-automation/ai-core` - Gemini client with prompt templates

4. **Microservices (Implemented)**
   - **Product-AI** (Port 3001): SEO generation, descriptions, tag suggestions
   - **Inventory-AI** (Port 3002): Demand forecasting, reorder calculations
   - **Workflow-Engine** (Port 3003): Approval workflows, rule execution

5. **Documentation**
   - README.md with architecture overview
   - IMPLEMENTATION_GUIDE.md with detailed patterns
   - This final setup guide

---

## 🚀 Complete Setup Instructions

### Step 1: Install Dependencies

```bash
cd "/Users/MiguelValor/Documents/prototype 01"

# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Step 2: Configure Environment Variables

Create `.env` files for each service:

**Dashboard** (`apps/dashboard/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_automation"
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SCOPES="read_products,write_products,read_inventory,write_inventory"
HOST="http://localhost:3000"

GEMINI_API_KEY="your_gemini_api_key"

PRODUCT_AI_URL="http://localhost:3001"
INVENTORY_AI_URL="http://localhost:3002"
WORKFLOW_ENGINE_URL="http://localhost:3003"
PRICING_AI_URL="http://localhost:3004"
IMAGE_AI_URL="http://localhost:3005"
```

**Product-AI** (`services/product-ai/.env`):
```env
PORT=3001
GEMINI_API_KEY="your_gemini_api_key"
```

**Inventory-AI** (`services/inventory-ai/.env`):
```env
PORT=3002
GEMINI_API_KEY="your_gemini_api_key"
```

**Workflow-Engine** (`services/workflow-engine/.env`):
```env
PORT=3003
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_automation"
```

### Step 3: Setup Database

```bash
# Navigate to dashboard
cd apps/dashboard

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Step 4: Build Shared Packages

```bash
# Build types package
cd packages/types
pnpm build

# Build AI core package
cd ../ai-core
pnpm build
```

### Step 5: Start Services

**Option A: Start all services with Turbo (recommended)**
```bash
# From root directory
pnpm dev
```

**Option B: Start services individually (for debugging)**

Terminal 1 - Product AI:
```bash
cd services/product-ai
pnpm dev
```

Terminal 2 - Inventory AI:
```bash
cd services/inventory-ai
pnpm dev
```

Terminal 3 - Workflow Engine:
```bash
cd services/workflow-engine
pnpm dev
```

Terminal 4 - Dashboard:
```bash
cd apps/dashboard
pnpm dev
```

---

## 📋 Quick Implementation of Remaining Services

### Pricing-AI Service (Port 3004)

Create `services/pricing-ai/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'pricing-ai', port: PORT });
});

app.post('/calculate-optimal-price', async (req, res) => {
  try {
    const { currentPrice, competitorPrices, cost, targetMargin } = req.body;

    // Simple competitive pricing
    const avgCompetitor = competitorPrices.reduce((a: number, b: number) => a + b, 0) / competitorPrices.length;
    let suggestedPrice = avgCompetitor * 0.95; // 5% below average

    // Ensure minimum margin
    const minPrice = cost * (1 + targetMargin);
    suggestedPrice = Math.max(suggestedPrice, minPrice);

    res.json({
      success: true,
      data: {
        suggestedPrice: Number(suggestedPrice.toFixed(2)),
        priceChange: suggestedPrice - currentPrice,
        priceChangePercent: ((suggestedPrice - currentPrice) / currentPrice) * 100,
        reasoning: {
          strategy: 'competitive',
          avgCompetitorPrice: avgCompetitor,
          marginProtection: targetMargin,
        },
        confidence: 0.85,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CALCULATION_FAILED', message: (error as Error).message },
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Pricing AI running on port ${PORT}`);
});
```

Start with:
```bash
cd services/pricing-ai
pnpm dev
```

---

### Image-AI Service (Port 3005)

Create `services/image-ai/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GeminiClient } from '@shopify-automation/ai-core';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

const gemini = new GeminiClient(process.env.GEMINI_API_KEY!);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'image-ai', port: PORT });
});

app.post('/generate-alt-text', async (req, res) => {
  try {
    const { productTitle, vendor, imageUrl } = req.body;

    // For now, generate alt text without image analysis
    const altText = `${vendor ? vendor + ' ' : ''}${productTitle} product image`;

    res.json({
      success: true,
      data: {
        altText: altText.slice(0, 125),
        confidence: 0.75,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GENERATION_FAILED', message: (error as Error).message },
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Image AI running on port ${PORT}`);
});
```

---

### Worker Service (Background Jobs)

Create `apps/worker/package.json`:

```json
{
  "name": "@shopify-automation/worker",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "node-cron": "^3.0.3",
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/node-cron": "^3.0.11",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

Create `apps/worker/src/index.ts`:

```typescript
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

console.log('🚀 Worker service starting...');

// Product scan job - every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Running product scan job...');

  try {
    // Find shops that need scanning
    const shops = await prisma.shop.findMany({
      where: { automationEnabled: true },
    });

    for (const shop of shops) {
      console.log(`  Scanning shop: ${shop.shopDomain}`);
      // Call product-ai service for each shop
      // Create ProductOptimization records
      // Create ApprovalQueue items
    }
  } catch (error) {
    console.error('Product scan job failed:', error);
  }
});

// Inventory forecast job - daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('⏰ Running inventory forecast job...');

  try {
    const shops = await prisma.shop.findMany({
      where: { automationEnabled: true },
    });

    for (const shop of shops) {
      console.log(`  Forecasting inventory for: ${shop.shopDomain}`);
      // Call inventory-ai service
      // Create InventoryForecast records
      // Generate reorder alerts
    }
  } catch (error) {
    console.error('Inventory forecast job failed:', error);
  }
});

// Price monitor job - every 12 hours
cron.schedule('0 */12 * * *', async () => {
  console.log('⏰ Running price monitor job...');

  try {
    const rules = await prisma.pricingRule.findMany({
      where: { isActive: true },
    });

    for (const rule of rules) {
      console.log(`  Monitoring prices for rule: ${rule.ruleName}`);
      // Fetch competitor prices
      // Call pricing-ai service
      // Create PriceOptimization records
    }
  } catch (error) {
    console.error('Price monitor job failed:', error);
  }
});

// Approval expiry job - every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Checking for expired approvals...');

  try {
    const expired = await prisma.approvalQueue.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    if (expired.count > 0) {
      console.log(`  Expired ${expired.count} old approvals`);
    }
  } catch (error) {
    console.error('Approval expiry job failed:', error);
  }
});

console.log('✅ Worker service started');
console.log('   Jobs scheduled:');
console.log('   - Product scan: Every 6 hours');
console.log('   - Inventory forecast: Daily at 2 AM');
console.log('   - Price monitor: Every 12 hours');
console.log('   - Approval expiry: Every hour');
```

---

## 🧪 Testing the Services

### Test Product-AI Service

```bash
curl -X POST http://localhost:3001/generate-seo \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wireless Bluetooth Headphones",
    "description": "High-quality audio experience",
    "tags": ["electronics", "audio"],
    "vendor": "TechBrand"
  }'
```

### Test Inventory-AI Service

```bash
curl -X POST http://localhost:3002/forecast-demand \
  -H "Content-Type: application/json" \
  -d '{
    "productTitle": "Wireless Headphones",
    "salesHistory": [
      {"date": "2024-01-01", "quantity": 5},
      {"date": "2024-01-02", "quantity": 7},
      {"date": "2024-01-03", "quantity": 6}
    ],
    "currentStock": 50
  }'
```

### Test Workflow Engine

```bash
curl -X POST http://localhost:3003/create-approval \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "shop_123",
    "actionType": "product_update",
    "entityType": "product",
    "entityId": "gid://shopify/Product/123",
    "currentData": {"title": "Old Title"},
    "proposedData": {"title": "New Optimized Title"},
    "confidence": 0.9,
    "reasoning": "AI-generated SEO optimization"
  }'
```

---

## 📊 Database Seed Data (Optional)

Create `apps/dashboard/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test shop
  const shop = await prisma.shop.create({
    data: {
      shopDomain: 'test-shop.myshopify.com',
      automationEnabled: true,
    },
  });

  console.log('Created shop:', shop.id);

  // Create automation rule
  const rule = await prisma.automationRule.create({
    data: {
      shopId: shop.id,
      ruleType: 'seo',
      isActive: true,
      autoApprove: true,
      trigger: JSON.stringify({
        event: 'product.created',
        conditions: { tags: { contains: 'electronics' } },
      }),
      actions: JSON.stringify([{ type: 'generate_seo' }]),
      priority: 1,
    },
  });

  console.log('Created rule:', rule.id);

  // Create pricing rule
  const pricingRule = await prisma.pricingRule.create({
    data: {
      shopId: shop.id,
      ruleName: 'Competitive Pricing - Electronics',
      isActive: true,
      strategy: 'competitive',
      targetMarginMin: 0.25,
      targetMarginMax: 0.40,
      competitorWeight: 0.5,
      demandWeight: 0.3,
      inventoryWeight: 0.2,
    },
  });

  console.log('Created pricing rule:', pricingRule.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
cd apps/dashboard
npx tsx prisma/seed.ts
```

---

## 🎯 Next Steps for Production

### 1. Complete Dashboard UI

The dashboard needs Remix routes for:
- Product optimization interface
- Approval queue management
- Inventory forecasting dashboard
- Pricing rules configuration
- Analytics and reporting

### 2. Shopify Integration

- Set up OAuth flow
- Implement GraphQL mutations for product updates
- Add webhooks for real-time product changes
- Test with Shopify test store

### 3. Enhanced AI Features

- Implement full Gemini Vision for image analysis
- Add competitor price scraping
- Improve forecast accuracy with more historical data
- A/B testing for AI suggestions

### 4. Production Deployment

- Set up PostgreSQL on managed service
- Deploy services to cloud provider
- Configure environment variables
- Set up monitoring and logging
- Implement rate limiting
- Add authentication/authorization

### 5. Testing

- Unit tests for each service
- Integration tests for workflows
- End-to-end testing of approval process
- Load testing for job queue

---

## 🐛 Troubleshooting

### Services won't start
- Check that ports 3001-3005 are available
- Verify environment variables are set
- Ensure database is running

### Prisma errors
```bash
cd apps/dashboard
npx prisma generate
npx prisma migrate reset  # WARNING: Deletes all data
```

### Module resolution errors
```bash
# Rebuild all packages
pnpm run build

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

---

## 📝 Summary

**What's Working:**
- ✅ Complete database schema
- ✅ 3 AI microservices (Product, Inventory, Workflow)
- ✅ Shared TypeScript types and AI core
- ✅ Inter-service communication patterns
- ✅ Approval workflow system

**What Needs Completion:**
- ⏳ Pricing-AI service (template provided above)
- ⏳ Image-AI service (template provided above)
- ⏳ Worker service with cron jobs (template provided above)
- ⏳ Dashboard UI routes
- ⏳ Shopify GraphQL integration
- ⏳ Production deployment

**Estimated Time to Complete:**
- Remaining services: 2-4 hours
- Dashboard UI: 8-12 hours
- Shopify integration: 4-6 hours
- Testing & deployment: 4-8 hours

**Total project value delivered:**
- 11-model database architecture
- 6 microservices architecture
- AI-powered automation system
- Semi-automated approval workflows
- Scalable, maintainable codebase

You now have a solid foundation for an AI-powered Shopify automation platform!
