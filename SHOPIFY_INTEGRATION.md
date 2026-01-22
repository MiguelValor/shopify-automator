# Shopify Integration Guide

## Adding Shopify App Features to Current Dashboard

Instead of starting over with `npm init @shopify/app@latest`, integrate Shopify into your existing advanced architecture.

## Step 1: Install Shopify Dependencies

```bash
cd apps/dashboard

pnpm add @shopify/shopify-app-remix @shopify/app-bridge-react @shopify/polaris @remix-run/node @remix-run/react @remix-run/serve
```

## Step 2: Create Shopify App Config

Create `apps/dashboard/shopify.app.toml`:

```toml
# Learn more about configuring your app at https://shopify.dev/docs/apps/tools/cli/configuration

name = "ai-automation-platform"
client_id = "YOUR_CLIENT_ID"
application_url = "https://your-app-url.ngrok.io"
embedded = true

[access_scopes]
scopes = "read_products,write_products,read_inventory,write_inventory,read_price_rules,write_price_rules"

[auth]
redirect_urls = [
  "https://your-app-url.ngrok.io/auth/callback",
  "https://your-app-url.ngrok.io/auth/shopify/callback",
]

[webhooks]
api_version = "2024-01"

[[webhooks.subscriptions]]
topics = [ "products/create", "products/update" ]
uri = "/webhooks"
```

## Step 3: Setup Shopify Auth

Create `apps/dashboard/app/shopify.server.ts`:

```typescript
import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  shopifyApp,
  ApiVersion,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.January24,
  scopes: process.env.SCOPES?.split(",") || [],
  appUrl: process.env.HOST!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    PRODUCTS_CREATE: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
    PRODUCTS_UPDATE: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      // Register webhooks
      shopify.registerWebhooks({ session });
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const apiVersion = ApiVersion.January24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
```

## Step 4: Create Auth Routes

Create `apps/dashboard/app/routes/auth.$.tsx`:

```typescript
import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};
```

## Step 5: Create App Routes with Authentication

Create `apps/dashboard/app/routes/app._index.tsx`:

```typescript
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineStack,
  Button,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch some basic stats
  const productsResponse = await admin.graphql(
    `#graphql
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            status
          }
        }
      }
    }`
  );

  const products = await productsResponse.json();

  return json({
    shop: session.shop,
    products: products.data.products.edges,
  });
};

export default function Index() {
  const { shop, products } = useLoaderData<typeof loader>();

  return (
    <Page title="AI Automation Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Welcome to AI-Powered Automation
              </Text>
              <Text as="p" variant="bodyMd">
                Connected to: {shop}
              </Text>
              <Text as="p" variant="bodyMd">
                Products found: {products.length}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Quick Actions
              </Text>
              <InlineStack gap="300">
                <Link to="/app/products/optimize">
                  <Button>Optimize Products</Button>
                </Link>
                <Link to="/app/inventory/forecast">
                  <Button>View Inventory Forecast</Button>
                </Link>
                <Link to="/app/automations/approvals">
                  <Button>Review Approvals</Button>
                </Link>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

## Step 6: Create Product Optimization Route

Create `apps/dashboard/app/routes/app.products.optimize.tsx`:

```typescript
import { json, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Card,
  DataTable,
  Button,
  Badge,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch products
  const response = await admin.graphql(
    `#graphql
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            description
            seo {
              title
              description
            }
            tags
            status
          }
        }
      }
    }`
  );

  const data = await response.json();
  const products = data.data.products.edges.map((edge: any) => edge.node);

  // Check which need optimization (missing SEO)
  const needsOptimization = products.filter(
    (p: any) => !p.seo?.description || p.seo.description.length < 50
  );

  return json({
    products: needsOptimization,
    shop: session.shop,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const action = formData.get("action") as string;

  if (action === "optimize") {
    // Call Product-AI service
    const productAIUrl = process.env.PRODUCT_AI_URL || "http://localhost:3001";

    // Get product details
    const productResponse = await admin.graphql(
      `#graphql
      query($id: ID!) {
        product(id: $id) {
          title
          description
          vendor
          tags
        }
      }`,
      { variables: { id: productId } }
    );

    const productData = await productResponse.json();
    const product = productData.data.product;

    // Generate SEO
    const seoResponse = await fetch(`${productAIUrl}/generate-seo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: product.title,
        description: product.description,
        vendor: product.vendor,
        tags: product.tags,
      }),
    });

    const seoResult = await seoResponse.json();

    if (seoResult.success) {
      // Create approval or apply directly based on confidence
      if (seoResult.data.confidence > 0.85) {
        // Apply directly
        await admin.graphql(
          `#graphql
          mutation updateProduct($input: ProductInput!) {
            productUpdate(input: $input) {
              product {
                id
                seo {
                  title
                  description
                }
              }
            }
          }`,
          {
            variables: {
              input: {
                id: productId,
                seo: {
                  title: seoResult.data.metaTitle,
                  description: seoResult.data.metaDescription,
                },
              },
            },
          }
        );
      } else {
        // Create approval queue item via workflow-engine
        const workflowUrl = process.env.WORKFLOW_ENGINE_URL || "http://localhost:3003";
        await fetch(`${workflowUrl}/create-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: "shop_id",
            actionType: "product_update",
            entityType: "product",
            entityId: productId,
            currentData: product,
            proposedData: seoResult.data,
            confidence: seoResult.data.confidence,
          }),
        });
      }
    }
  }

  return json({ success: true });
};

export default function ProductOptimize() {
  const { products } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const rows = products.map((product: any) => [
    product.title,
    product.seo?.description || "Missing",
    <Badge tone={product.seo?.description ? "success" : "warning"}>
      {product.seo?.description ? "Has SEO" : "Needs SEO"}
    </Badge>,
    <Button
      onClick={() => {
        const formData = new FormData();
        formData.append("productId", product.id);
        formData.append("action", "optimize");
        submit(formData, { method: "post" });
      }}
    >
      Optimize
    </Button>,
  ]);

  return (
    <Page title="Product Optimization" backAction={{ url: "/app" }}>
      <Card>
        <BlockStack gap="400">
          <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={["Product", "SEO Description", "Status", "Action"]}
            rows={rows}
          />
        </BlockStack>
      </Card>
    </Page>
  );
}
```

## Step 7: Update Environment Variables

Add to `apps/dashboard/.env`:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES=read_products,write_products,read_inventory,write_inventory
HOST=https://your-ngrok-url.ngrok.io

# Keep existing
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
PRODUCT_AI_URL=http://localhost:3001
INVENTORY_AI_URL=http://localhost:3002
WORKFLOW_ENGINE_URL=http://localhost:3003
```

## Step 8: Update package.json Scripts

Update `apps/dashboard/package.json`:

```json
{
  "scripts": {
    "dev": "shopify app dev",
    "build": "shopify app build",
    "deploy": "shopify app deploy",
    "config:link": "shopify app config link",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  }
}
```

## Step 9: Start Development

```bash
# Terminal 1: Start microservices
cd services/product-ai && pnpm dev

# Terminal 2: Start Inventory AI
cd services/inventory-ai && pnpm dev

# Terminal 3: Start Workflow Engine
cd services/workflow-engine && pnpm dev

# Terminal 4: Start Shopify app
cd apps/dashboard
shopify app dev
```

## Step 10: Test in Shopify

1. Install the app in a development store
2. Navigate to the app from Shopify admin
3. Test product optimization feature
4. Verify microservices are called correctly

## Benefits of This Approach

✅ **Keep your advanced architecture**
✅ **Add official Shopify integration**
✅ **Use all your AI microservices**
✅ **Get Shopify OAuth and App Bridge**
✅ **Access to Polaris UI components**

## Next Steps

1. Create more app routes for other features
2. Add webhook handlers
3. Implement bulk operations
4. Add real-time notifications
5. Deploy to production

---

**This gives you the best of both worlds:**
- Your custom AI microservices
- Official Shopify app integration
- Professional UI with Polaris
- Scalable architecture
