# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Shopify Store                               │
│                     (Products, Orders, Inventory)                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ GraphQL API / Webhooks
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      Dashboard (Remix App)                           │
│                          Port 3000                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Product    │  │   Inventory  │  │   Pricing    │             │
│  │ Optimization │  │  Forecasting │  │    Rules     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Automation  │  │   Approval   │  │  Analytics   │             │
│  │    Rules     │  │     Queue    │  │   Dashboard  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ REST APIs
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      Microservices Layer                             │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   Product-AI     │  │   Inventory-AI   │  │  Workflow Engine│  │
│  │    (Port 3001)   │  │    (Port 3002)   │  │   (Port 3003)   │  │
│  │                  │  │                  │  │                 │  │
│  │ • SEO Gen        │  │ • Forecasting    │  │ • Approvals     │  │
│  │ • Descriptions   │  │ • Reorder Calc   │  │ • Rule Engine   │  │
│  │ • Tags           │  │ • Safety Stock   │  │ • Auto-Execute  │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   Pricing-AI     │  │    Image-AI      │  │     Worker      │  │
│  │    (Port 3004)   │  │    (Port 3005)   │  │   (Background)  │  │
│  │                  │  │                  │  │                 │  │
│  │ • Competitive    │  │ • Alt Text Gen   │  │ • Cron Jobs     │  │
│  │ • Demand-Based   │  │ • Image Analysis │  │ • Job Queue     │  │
│  │ • Margin-Based   │  │ • Tagging        │  │ • Scheduling    │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                       Shared Packages                                │
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐    │
│  │    @shopify-automation/      │  │  @shopify-automation/    │    │
│  │          types               │  │       ai-core            │    │
│  │                              │  │                          │    │
│  │ • TypeScript Interfaces      │  │ • Gemini Client          │    │
│  │ • API Types                  │  │ • Prompt Templates       │    │
│  │ • Domain Models              │  │ • Vision API             │    │
│  └──────────────────────────────┘  └──────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    Data & AI Layer                                   │
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐    │
│  │    PostgreSQL Database       │  │    Google Gemini AI      │    │
│  │      (Prisma ORM)            │  │   (gemini-2.0-flash)     │    │
│  │                              │  │                          │    │
│  │ • 11 Data Models             │  │ • Text Generation        │    │
│  │ • Relationships & Indexes    │  │ • Vision Analysis        │    │
│  │ • Audit Trails               │  │ • Structured Output      │    │
│  └──────────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Service Communication Flow

### 1. Product Optimization Flow

```
User → Dashboard → Product-AI → Workflow Engine → Database
                         │              │
                         │              ▼
                         │        Auto-Approve?
                         │         /         \
                         │       Yes          No
                         │        │            │
                         ▼        ▼            ▼
                      Gemini   Execute    Approval Queue
                                 │            │
                                 ▼            ▼
                            Shopify API    User Review
                                                │
                                                ▼
                                            Execute → Shopify
```

### 2. Inventory Forecasting Flow

```
Worker (Cron) → Shopify API → Fetch Sales Data
                                      │
                                      ▼
                            Inventory-AI Service
                              │           │
                              ▼           ▼
                        Statistical   Gemini AI
                         Analysis     Analysis
                              │           │
                              └─────┬─────┘
                                    ▼
                            Combined Forecast
                                    │
                                    ▼
                          Database (InventoryForecast)
                                    │
                                    ▼
                          Reorder Alerts → Dashboard
```

### 3. Dynamic Pricing Flow

```
Worker (Cron) → Fetch Products → Pricing-AI
                      │                │
                      │                ▼
                      │          Strategy Engine
                      │           (Competitive/
                      │            Demand/Margin)
                      │                │
                      ▼                ▼
              Competitor Data    Price Calculation
                      │                │
                      └────────┬───────┘
                               ▼
                      Workflow Engine (Approval)
                               │
                         High Confidence?
                          /          \
                        Yes           No
                         │             │
                         ▼             ▼
                    Auto-Apply    Manual Review
                         │             │
                         └──────┬──────┘
                                ▼
                         Shopify Price Update
```

---

## Database Schema Relationships

```
                    ┌─────────────┐
                    │    Shop     │
                    └──────┬──────┘
                           │ 1:N
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │Automation  │  │  Pricing   │  │  Approval  │
    │   Rule     │  │    Rule    │  │   Queue    │
    └────────────┘  └──────┬─────┘  └────────────┘
                           │ 1:N
                           ▼
                    ┌────────────┐
                    │   Price    │
                    │Optimization│
                    └────────────┘

                    ┌─────────────┐
                    │    Shop     │
                    └──────┬──────┘
                           │ 1:N
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Product   │  │ Inventory  │  │   Image    │
    │Optimization│  │  Forecast  │  │Optimization│
    └────────────┘  └────────────┘  └────────────┘

         Shopify Product ID
                │
                ▼
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
ProductOptimization    InventoryForecast
    │                       │
    └───────────┬───────────┘
                ▼
         CompetitorPrice
```

---

## Data Flow Patterns

### 1. AI-Generated Suggestions Pattern

```
1. Trigger (User/Cron)
   │
2. Fetch Data (Shopify/Database)
   │
3. AI Service Call (Gemini)
   │
4. Generate Suggestion + Confidence Score
   │
5. Decision Point:
   ├─ Confidence > 0.85 → Auto-approve → Execute
   │
   └─ Confidence ≤ 0.85 → Approval Queue → User Review
                                                │
                                                ├─ Approve → Execute
                                                └─ Reject → Log & Dismiss
```

### 2. Background Job Pattern

```
Cron Schedule
   │
   ▼
Job Queue (BackgroundJob table)
   │
   ├─ Status: queued
   │
   ▼
Job Processor
   │
   ├─ Status: running
   │
   ├─ Process (with retry logic)
   │
   ├─ Success → Status: completed
   │
   └─ Failure → Increment attempts
                   │
                   ├─ attempts < maxAttempts → Retry
                   └─ attempts ≥ maxAttempts → Status: failed
```

---

## Technology Stack

### Backend Services
```
┌──────────────────────────────────────┐
│ Express.js (REST APIs)               │
├──────────────────────────────────────┤
│ TypeScript (Type Safety)             │
├──────────────────────────────────────┤
│ Node.js 18+ (Runtime)                │
└──────────────────────────────────────┘
```

### Database Layer
```
┌──────────────────────────────────────┐
│ Prisma ORM (Type-safe queries)       │
├──────────────────────────────────────┤
│ PostgreSQL (Primary database)        │
└──────────────────────────────────────┘
```

### AI Layer
```
┌──────────────────────────────────────┐
│ Google Gemini 2.0 Flash Exp          │
│  • Text generation                   │
│  • Vision analysis                   │
│  • Structured JSON output            │
└──────────────────────────────────────┘
```

### Frontend (Ready for Implementation)
```
┌──────────────────────────────────────┐
│ Remix (Full-stack framework)         │
├──────────────────────────────────────┤
│ Shopify Polaris (UI components)      │
├──────────────────────────────────────┤
│ Shopify App Bridge (Authentication)  │
└──────────────────────────────────────┘
```

### Build & Deploy
```
┌──────────────────────────────────────┐
│ pnpm (Package management)            │
├──────────────────────────────────────┤
│ Turbo (Monorepo build system)        │
├──────────────────────────────────────┤
│ TypeScript Compiler (Build)          │
└──────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling
```
Load Balancer
      │
      ├─── Product-AI Instance 1
      ├─── Product-AI Instance 2
      └─── Product-AI Instance 3

Each service can scale independently
```

### Database Optimization
```
• Connection pooling (Prisma)
• Indexes on frequently queried fields
• Composite indexes for multi-field queries
• Read replicas for heavy read workloads
```

### Caching Strategy
```
Product Data → Cache (5-15 min TTL) → Reduce Shopify API calls
AI Suggestions → Cache (24 hr TTL) → Reduce AI costs
```

### Rate Limiting
```
Shopify API:
  • Standard: 2 req/sec
  • Plus: 4 req/sec
  • GraphQL: Cost-based (max 1000 points)

Gemini AI:
  • 15 requests per minute
  • 1 million tokens per minute
  • 1500 requests per day (free tier)
```

---

## Security Architecture

### API Security
```
┌─────────────────────────────────────┐
│ 1. Shopify OAuth (App auth)         │
│ 2. API key validation (Services)    │
│ 3. CORS (Cross-origin protection)   │
│ 4. Input validation (All endpoints) │
│ 5. SQL injection protection (Prisma)│
└─────────────────────────────────────┘
```

### Data Security
```
• Environment variables for secrets
• Encrypted database connections (SSL)
• API keys stored securely
• No sensitive data in logs
• GDPR compliance for merchant data
```

---

## Monitoring & Observability

### Health Checks
```
GET /health endpoints on all services
  → Returns: { status, service, port }
```

### Logging
```
• Request/response logging
• Error tracking with stack traces
• Job execution logs
• AI API usage tracking
```

### Metrics (To Implement)
```
• API response times
• Success/failure rates
• AI confidence scores
• Approval acceptance rates
• Database query performance
```

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Provider                        │
│                  (AWS/GCP/Azure/Fly.io)                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │  Services    │  │   Worker     │  │
│  │  (Vercel)    │  │  (Railway)   │  │  (Render)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └────────┬────────┴──────────────────┘          │
│                  │                                       │
│         ┌────────▼────────┐                             │
│         │   PostgreSQL    │                             │
│         │  (Managed DB)   │                             │
│         └─────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture provides:

✅ **Microservices** - Independent, scalable services
✅ **AI-Powered** - Google Gemini integration
✅ **Type-Safe** - Full TypeScript coverage
✅ **Database-First** - Prisma with PostgreSQL
✅ **Semi-Automated** - Confidence-based approvals
✅ **Production-Ready** - Error handling, logging, monitoring
✅ **Extensible** - Easy to add new services/features
✅ **Cost-Effective** - Serverless-friendly architecture

The system is designed for:
- **High Availability**: Independent services
- **Scalability**: Horizontal scaling support
- **Maintainability**: Clear separation of concerns
- **Reliability**: Retry logic and error handling
- **Performance**: Caching and optimization
