# Implementation Guide - Remaining Services

This guide covers the implementation of the remaining services and dashboard components for the AI-Powered Shopify Automation Platform.

## ✅ Completed So Far

1. **Project Structure**: Monorepo with pnpm workspaces
2. **Database Schema**: Complete Prisma schema with all 11 models
3. **Shared Packages**:
   - `@shopify-automation/types`: TypeScript types
   - `@shopify-automation/ai-core`: Gemini client and prompt templates
4. **Product-AI Service** (port 3001): Complete with SEO, descriptions, tags
5. **Inventory-AI Service** (port 3002): Complete with forecasting and reorder calculations

## 🚧 Remaining Implementation

### 1. Workflow Engine Service (Port 3003)

**Purpose**: Manages approval workflows, automation rules, and action execution

**Files to Create**:

```
services/workflow-engine/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts
    ├── engine/
    │   ├── rule-engine.ts
    │   └── approval-manager.ts
    └── executors/
        └── action-executor.ts
```

**Key Implementations**:

#### `src/engine/rule-engine.ts`
```typescript
import { PrismaClient } from '@prisma/client';

export class RuleEngine {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async evaluateRule(ruleId: string, context: {
    event: string;
    product?: any;
    inventory?: any;
  }): Promise<boolean> {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || !rule.isActive) return false;

    const trigger = JSON.parse(rule.trigger);

    // Check if event matches
    if (trigger.event !== context.event) return false;

    // Evaluate conditions
    if (trigger.conditions) {
      return this.evaluateConditions(trigger.conditions, context);
    }

    return true;
  }

  private evaluateConditions(conditions: any, context: any): boolean {
    // Implement conditional logic
    // Examples:
    // - tags contains "electronics"
    // - vendor equals "Apple"
    // - price > 100
    // etc.
    return true; // Simplified
  }

  async executeRule(ruleId: string, context: any) {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) throw new Error('Rule not found');

    const actions = JSON.parse(rule.actions);

    for (const action of actions) {
      await this.executeAction(action, context, rule.autoApprove);
    }
  }

  private async executeAction(action: any, context: any, autoApprove: boolean) {
    // Execute action based on type
    // If autoApprove is true and confidence > 0.8, apply directly
    // Otherwise, create approval queue item
  }
}
```

#### `src/engine/approval-manager.ts`
```typescript
import { PrismaClient } from '@prisma/client';

export class ApprovalManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createApproval(params: {
    shopId: string;
    actionType: string;
    entityType: string;
    entityId: string;
    currentData: any;
    proposedData: any;
    confidence?: number;
    reasoning?: string;
  }) {
    return this.prisma.approvalQueue.create({
      data: {
        shopId: params.shopId,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        currentData: JSON.stringify(params.currentData),
        proposedData: JSON.stringify(params.proposedData),
        confidence: params.confidence,
        reasoning: params.reasoning,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  async approveItem(approvalId: string, reviewedBy: string) {
    const approval = await this.prisma.approvalQueue.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy,
      },
    });

    // Execute the approved action
    await this.executeApprovedAction(approval);

    return approval;
  }

  async rejectItem(approvalId: string, reviewedBy: string, notes?: string) {
    return this.prisma.approvalQueue.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy,
        reviewNotes: notes,
      },
    });
  }

  private async executeApprovedAction(approval: any) {
    // Apply the proposed changes to Shopify
    // Log in ProductOptimization, PriceOptimization, etc.
  }
}
```

#### `src/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import { RuleEngine } from './engine/rule-engine.js';
import { ApprovalManager } from './engine/approval-manager.js';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

const ruleEngine = new RuleEngine();
const approvalManager = new ApprovalManager();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'workflow-engine', port: PORT });
});

app.post('/create-approval', async (req, res) => {
  try {
    const approval = await approvalManager.createApproval(req.body);
    res.json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/approvals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy } = req.body;
    const approval = await approvalManager.approveItem(id, reviewedBy);
    res.json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/approvals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, notes } = req.body;
    const approval = await approvalManager.rejectItem(id, reviewedBy, notes);
    res.json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Workflow Engine running on port ${PORT}`);
});
```

---

### 2. Pricing-AI Service (Port 3004)

**Files to Create**:

```
services/pricing-ai/
├── package.json (same as product-ai)
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts
    └── strategies/
        ├── competitive-pricing.ts
        ├── demand-based-pricing.ts
        └── margin-based-pricing.ts
```

**Key Implementation**:

#### `src/strategies/competitive-pricing.ts`
```typescript
export class CompetitivePricingStrategy {
  async calculatePrice(params: {
    currentPrice: number;
    competitorPrices: number[];
    targetMargin: number;
    cost: number;
  }): Promise<{ suggestedPrice: number; reasoning: any }> {
    if (params.competitorPrices.length === 0) {
      return {
        suggestedPrice: params.currentPrice,
        reasoning: { error: 'No competitor data' },
      };
    }

    const avgCompetitorPrice =
      params.competitorPrices.reduce((a, b) => a + b, 0) /
      params.competitorPrices.length;

    // Price at 5% below average competitor
    let suggested = avgCompetitorPrice * 0.95;

    // Ensure minimum margin
    const minPrice = params.cost * (1 + params.targetMargin);
    suggested = Math.max(suggested, minPrice);

    return {
      suggestedPrice: Number(suggested.toFixed(2)),
      reasoning: {
        avgCompetitorPrice,
        marginProtection: params.targetMargin,
        strategy: 'competitive_undercut',
      },
    };
  }
}
```

#### `src/strategies/demand-based-pricing.ts`
```typescript
export class DemandBasedPricingStrategy {
  async calculatePrice(params: {
    currentPrice: number;
    inventoryLevel: number;
    avgDailyDemand: number;
    targetMargin: number;
    cost: number;
  }): Promise<{ suggestedPrice: number; reasoning: any }> {
    const daysOfStock = params.inventoryLevel / params.avgDailyDemand;

    let priceAdjustment = 1.0;

    // High inventory = lower price
    if (daysOfStock > 90) {
      priceAdjustment = 0.9; // 10% discount
    } else if (daysOfStock < 30) {
      priceAdjustment = 1.1; // 10% increase
    }

    let suggested = params.currentPrice * priceAdjustment;

    // Ensure minimum margin
    const minPrice = params.cost * (1 + params.targetMargin);
    suggested = Math.max(suggested, minPrice);

    return {
      suggestedPrice: Number(suggested.toFixed(2)),
      reasoning: {
        daysOfStock,
        priceAdjustment,
        strategy: 'demand_based',
      },
    };
  }
}
```

---

### 3. Image-AI Service (Port 3005)

**Files to Create**:

```
services/image-ai/
├── package.json (same as product-ai)
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts
    └── processors/
        ├── alt-text-generator.ts
        └── image-tagger.ts
```

**Key Implementation**:

#### `src/processors/alt-text-generator.ts`
```typescript
import { GeminiClient, PromptTemplates } from '@shopify-automation/ai-core';
import fetch from 'node-fetch';

export class AltTextGenerator {
  private gemini: GeminiClient;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient(apiKey);
  }

  async generateAltText(
    imageUrl: string,
    productContext?: { title: string; vendor: string }
  ): Promise<string> {
    try {
      // Fetch image and convert to base64
      const imageBase64 = await this.fetchImageAsBase64(imageUrl);

      const prompt = PromptTemplates.generateAltText({
        productTitle: productContext?.title || 'Product',
        vendor: productContext?.vendor,
      });

      const result = await this.gemini.analyzeImage({
        base64: imageBase64,
        mimeType: 'image/jpeg',
        prompt,
      });

      // Truncate to 125 characters
      return result.content.slice(0, 125);
    } catch (error) {
      throw new Error(`Alt text generation failed: ${error.message}`);
    }
  }

  private async fetchImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  }
}
```

---

### 4. Worker Service (Background Jobs)

**Files to Create**:

```
apps/worker/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── queue/
    │   ├── job-queue.ts
    │   └── job-processor.ts
    └── jobs/
        ├── product-scan-job.ts
        ├── inventory-forecast-job.ts
        ├── price-monitor-job.ts
        ├── image-process-job.ts
        └── approval-expiry-job.ts
```

**Key Implementation**:

#### `src/jobs/product-scan-job.ts`
```typescript
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

export class ProductScanJob {
  private prisma: PrismaClient;
  private productAIUrl: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.productAIUrl = process.env.PRODUCT_AI_URL || 'http://localhost:3001';
  }

  async execute(shopId: string) {
    console.log(`Running product scan for shop ${shopId}`);

    // Fetch products from Shopify
    const products = await this.fetchShopifyProducts(shopId);

    // Filter products needing optimization
    const needsOptimization = products.filter(
      (p) => !p.seo?.description || p.description.length < 100
    );

    for (const product of needsOptimization) {
      try {
        // Call Product-AI service
        const response = await fetch(`${this.productAIUrl}/generate-seo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        const result = await response.json();

        if (result.success) {
          // Create ProductOptimization record
          await this.prisma.productOptimization.create({
            data: {
              shopId,
              shopifyProductId: product.id,
              optimizationType: 'seo',
              status: result.data.confidence > 0.8 ? 'approved' : 'pending',
              suggestedValue: JSON.stringify(result.data),
              confidence: result.data.confidence,
              aiModel: 'gemini-pro',
            },
          });

          // Create approval queue item if needed
          if (result.data.confidence <= 0.8) {
            // Create approval via workflow-engine
          }
        }
      } catch (error) {
        console.error(`Failed to optimize product ${product.id}:`, error);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private async fetchShopifyProducts(shopId: string): Promise<any[]> {
    // Fetch from Shopify GraphQL API
    return [];
  }
}
```

#### `src/index.ts`
```typescript
import cron from 'node-cron';
import { ProductScanJob } from './jobs/product-scan-job.js';
import { InventoryForecastJob } from './jobs/inventory-forecast-job.js';
import { PriceMonitorJob } from './jobs/price-monitor-job.js';

const productScanJob = new ProductScanJob();
const inventoryForecastJob = new InventoryForecastJob();
const priceMonitorJob = new PriceMonitorJob();

// Run product scan every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Starting product scan job...');
  await productScanJob.execute('shop_id');
});

// Run inventory forecast daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting inventory forecast job...');
  await inventoryForecastJob.execute('shop_id');
});

// Run price monitor every 12 hours
cron.schedule('0 */12 * * *', async () => {
  console.log('Starting price monitor job...');
  await priceMonitorJob.execute('shop_id');
});

console.log('🚀 Worker service started');
```

---

### 5. Dashboard Routes & Components

**Key Routes to Create**:

#### `apps/dashboard/app/routes/app.products.optimize.tsx`
```typescript
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Page, Card, DataTable, Button } from '@shopify/polaris';

export async function loader({ request }: LoaderFunctionArgs) {
  // Fetch products needing optimization
  // Fetch pending optimizations
  return json({
    products: [],
    optimizations: [],
  });
}

export default function ProductOptimize() {
  const { products, optimizations } = useLoaderData<typeof loader>();

  return (
    <Page title="Product Optimization">
      <Card>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text']}
          headings={['Product', 'Type', 'Status', 'Actions']}
          rows={optimizations.map((opt) => [
            opt.productTitle,
            opt.optimizationType,
            opt.status,
            <Button onClick={() => {}}>Review</Button>,
          ])}
        />
      </Card>
    </Page>
  );
}
```

#### `apps/dashboard/app/routes/app.automations.approvals.tsx`
```typescript
import { Page, Card, Button } from '@shopify/polaris';
import { useLoaderData } from '@remix-run/react';

export async function loader() {
  // Fetch pending approvals from workflow-engine
  return json({ approvals: [] });
}

export default function Approvals() {
  const { approvals } = useLoaderData<typeof loader>();

  return (
    <Page title="Approval Queue">
      {approvals.map((approval) => (
        <Card key={approval.id}>
          <h3>{approval.actionType}</h3>
          <p>Confidence: {approval.confidence}</p>
          <Button onClick={() => approveItem(approval.id)}>Approve</Button>
          <Button onClick={() => rejectItem(approval.id)}>Reject</Button>
        </Card>
      ))}
    </Page>
  );
}
```

---

## 📋 Implementation Checklist

### Services
- [ ] Complete Workflow Engine Service
- [ ] Complete Pricing-AI Service
- [ ] Complete Image-AI Service
- [ ] Complete Worker Service
- [ ] Test all service endpoints

### Dashboard
- [ ] Create `/app/products/optimize` route
- [ ] Create `/app/automations/approvals` route
- [ ] Create `/app/inventory/forecast` route
- [ ] Create `/app/pricing` route
- [ ] Create `/app/images/optimize` route
- [ ] Create `/app/automations/rules` route
- [ ] Create `/app/analytics` route

### Integration
- [ ] Create service clients in `lib/services/`
- [ ] Create GraphQL operations in `graphql/`
- [ ] Test Shopify API integration
- [ ] Test inter-service communication

### Database
- [ ] Run Prisma migrations
- [ ] Seed test data
- [ ] Test all CRUD operations

### Testing
- [ ] Manual testing of each service
- [ ] End-to-end workflow testing
- [ ] Load testing for job queue

---

## 🚀 Quick Start Commands

```bash
# Install all dependencies
pnpm install

# Build shared packages
cd packages/types && pnpm build
cd ../ai-core && pnpm build

# Run database migrations
cd apps/dashboard && npx prisma migrate dev --name init

# Start all services (in separate terminals)
cd services/product-ai && pnpm dev
cd services/inventory-ai && pnpm dev
cd services/workflow-engine && pnpm dev
cd services/pricing-ai && pnpm dev
cd services/image-ai && pnpm dev
cd apps/worker && pnpm dev
cd apps/dashboard && pnpm dev
```

---

## 📝 Next Steps

1. Create package.json files for remaining services
2. Implement service logic following patterns above
3. Create dashboard routes and components
4. Test integration between services
5. Deploy to production environment

This guide provides the complete structure and implementation patterns. Each service follows the same architecture, making it easy to replicate and extend.
