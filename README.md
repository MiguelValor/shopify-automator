# AI-Powered Shopify Store Management Platform

A comprehensive automation system for Shopify stores powered by Google Gemini AI. This platform handles product descriptions, SEO optimization, inventory management, dynamic pricing, and image optimization with semi-automated approval workflows.

## Features

- **Product SEO & Content Automation**: AI-generated product descriptions, meta tags, and keyword optimization
- **Inventory Forecasting**: Demand prediction, reorder alerts, and optimal stock level recommendations
- **Dynamic Pricing**: Competitive pricing analysis, demand-based pricing, and margin optimization
- **Image Optimization**: AI-generated alt text, image tagging, and SEO optimization
- **Approval Workflows**: Semi-automated system with confidence-based auto-approval
- **Analytics Dashboard**: Track performance metrics, acceptance rates, and impact analysis

## Architecture

This is a monorepo built with:

- **Frontend**: Remix + Shopify Polaris
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Google Gemini (gemini-2.0-flash-exp)
- **Microservices**: Express-based services for specialized tasks
- **Background Workers**: Job queue processing for automation

### Services

1. **Dashboard** (port 3000) - Main Shopify app with admin UI
2. **Product AI** (port 3001) - SEO generation, descriptions, tagging
3. **Inventory AI** (port 3002) - Demand forecasting, reorder calculations
4. **Workflow Engine** (port 3003) - Approval workflows, rule execution
5. **Pricing AI** (port 3004) - Dynamic pricing strategies
6. **Image AI** (port 3005) - Alt text generation, image analysis
7. **Worker** - Background job processor

## Setup Instructions

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database
- Shopify Partner account
- Google Gemini API key

### Installation

1. **Clone and install dependencies**

```bash
cd prototype\ 01
pnpm install
```

2. **Configure environment variables**

```bash
cd apps/dashboard
cp .env.example .env
```

Edit `.env` with your credentials:
- Shopify API credentials
- PostgreSQL connection string
- Gemini API key

3. **Set up the database**

```bash
# Run migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate
```

4. **Build shared packages**

```bash
cd packages/types && pnpm build
cd ../ai-core && pnpm build
```

### Running the Application

**Development mode** (all services):

```bash
# From root directory
pnpm dev
```

**Individual services**:

```bash
# Dashboard
cd apps/dashboard && pnpm dev

# Product AI Service
cd services/product-ai && pnpm dev

# Worker
cd apps/worker && pnpm dev
```

### Database Management

```bash
# View database in Prisma Studio
pnpm db:studio

# Create a new migration
pnpm db:migrate

# Reset database (WARNING: deletes all data)
cd apps/dashboard && npx prisma migrate reset
```

## Project Structure

```
prototype 01/
├── apps/
│   ├── dashboard/          # Main Shopify Remix app
│   │   ├── app/
│   │   │   ├── routes/    # Remix routes
│   │   │   ├── components/ # React components
│   │   │   └── lib/       # Service clients
│   │   └── prisma/        # Database schema
│   └── worker/            # Background job processor
├── services/
│   ├── product-ai/        # Product SEO & content generation
│   ├── inventory-ai/      # Demand forecasting
│   ├── workflow-engine/   # Approval workflows
│   ├── pricing-ai/        # Dynamic pricing
│   └── image-ai/          # Image optimization
└── packages/
    ├── types/             # Shared TypeScript types
    └── ai-core/           # Gemini AI client library
```

## Database Schema

### Core Models

- **Shop**: Store-level configuration and automation settings
- **AutomationRule**: Trigger-based automation rules
- **ApprovalQueue**: Central approval system for AI suggestions
- **BackgroundJob**: Job queue tracking

### Product Optimization

- **ProductOptimization**: AI-generated SEO, descriptions, tags
- **ImageOptimization**: Alt text and image tagging

### Inventory Management

- **InventoryForecast**: Demand forecasts and reorder points

### Pricing

- **PricingRule**: Pricing strategy configuration
- **PriceOptimization**: Price change suggestions
- **CompetitorPrice**: Competitor pricing data

## Usage

### 1. Product Optimization

Navigate to `/app/products/optimize` in the dashboard:

1. Select products to optimize
2. Choose optimization types (SEO, description, tags)
3. Review AI suggestions
4. Approve or reject changes
5. Changes are applied to Shopify automatically

### 2. Inventory Forecasting

Navigate to `/app/inventory/forecast`:

1. View demand forecasts for all products
2. See reorder alerts and recommendations
3. Review days until stockout
4. Adjust safety stock levels

### 3. Dynamic Pricing

Navigate to `/app/pricing`:

1. Create pricing rules with strategies
2. Set target margins and constraints
3. Review competitor pricing
4. Approve price changes
5. Track pricing performance

### 4. Automation Rules

Navigate to `/app/automations/rules`:

1. Create automation rules (triggers + actions)
2. Set conditions (tags, vendor, price range)
3. Enable auto-approve for high confidence suggestions
4. Set priority for rule execution

### 5. Approval Queue

Navigate to `/app/automations/approvals`:

1. Review pending AI suggestions
2. See confidence scores
3. Compare current vs proposed changes
4. Bulk approve/reject actions

## API Endpoints

### Product AI Service (port 3001)

- `POST /generate-seo` - Generate SEO metadata
- `POST /generate-description` - Generate product description
- `POST /suggest-tags` - Suggest product tags

### Inventory AI Service (port 3002)

- `POST /forecast-demand` - Generate demand forecast
- `POST /calculate-reorder` - Calculate reorder point

### Pricing AI Service (port 3004)

- `POST /calculate-optimal-price` - Calculate optimal price
- `POST /analyze-competitors` - Analyze competitor pricing

### Image AI Service (port 3005)

- `POST /generate-alt-text` - Generate image alt text
- `POST /analyze-image` - Analyze image content

### Workflow Engine (port 3003)

- `POST /create-approval` - Create approval item
- `POST /approvals/:id/approve` - Approve suggestion
- `POST /approvals/:id/reject` - Reject suggestion

## Configuration

### Shopify API Scopes Required

```
read_products,write_products,read_inventory,write_inventory,read_price_rules,write_price_rules
```

### Automation Rules

Rules consist of:
- **Trigger**: Event that starts the automation (e.g., product.created)
- **Conditions**: Filters (tags, vendor, price range)
- **Actions**: What to execute (generate_seo, adjust_price)
- **Auto-approve**: Enable for high confidence (>0.8) suggestions

### Confidence Thresholds

- **High (>0.8)**: Can auto-approve if enabled
- **Medium (0.6-0.8)**: Requires manual review
- **Low (<0.6)**: Flagged for careful review

## Development

### Adding a New Service

1. Create directory in `services/`
2. Add `package.json` with dependencies
3. Implement Express server with endpoints
4. Add service URL to dashboard `.env`
5. Create client in `apps/dashboard/app/lib/services/`

### Adding a New Dashboard Page

1. Create route in `apps/dashboard/app/routes/`
2. Use Shopify Polaris components
3. Call service APIs via clients
4. Handle approval workflows

### Adding a New Background Job

1. Create job in `apps/worker/src/jobs/`
2. Implement job processor logic
3. Add scheduling in worker
4. Update BackgroundJob tracking

## Deployment

### Prerequisites

- PostgreSQL database (managed service recommended)
- Node.js hosting (Vercel, Railway, Fly.io)
- Shopify app configured in Partner dashboard

### Steps

1. Deploy PostgreSQL database
2. Run migrations on production DB
3. Deploy all services
4. Update Shopify app URLs
5. Configure webhooks

## Troubleshooting

### Prisma Errors

```bash
# Regenerate Prisma client
cd apps/dashboard && npx prisma generate

# Check migration status
npx prisma migrate status

# Fix migration issues
npx prisma migrate resolve
```

### Service Communication Issues

Check that all services are running and ports are correct in `.env` files.

### Shopify API Rate Limits

The app implements exponential backoff and respects rate limits (2 req/sec Standard, 4 req/sec Plus).

## Security

- API keys encrypted in database
- All user inputs validated and sanitized
- AI-generated content sanitized before applying to Shopify
- GDPR compliant data handling

## Performance

- Shopify product data cached (5-15 min TTL)
- AI suggestions cached (24 hour TTL)
- Database connection pooling enabled
- Horizontal scaling supported for all services

## Support

For issues or questions, please check:
1. This README
2. Code comments in relevant files
3. Prisma schema documentation

## License

MIT
