#!/bin/bash

# Setup script for creating all microservices structure
set -e

echo "Setting up microservices structure..."

# Create directory structures
mkdir -p services/inventory-ai/src/{forecasting,calculators}
mkdir -p services/workflow-engine/src/{engine,executors}
mkdir -p services/pricing-ai/src/strategies
mkdir -p services/image-ai/src/processors
mkdir -p apps/worker/src/{jobs,queue}
mkdir -p apps/dashboard/app/{routes,components,lib/services,graphql}

echo "✅ Directory structure created"

# Create shared tsconfig for services
for service in inventory-ai workflow-engine pricing-ai image-ai; do
  if [ ! -f "services/$service/tsconfig.json" ]; then
    cat > "services/$service/tsconfig.json" << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
TSCONFIG
  fi
done

echo "✅ TypeScript configs created"

# Create .env.example files for each service
echo "PORT=3002
GEMINI_API_KEY=your_gemini_api_key_here" > services/inventory-ai/.env.example

echo "PORT=3003
DATABASE_URL=postgresql://user:password@localhost:5432/shopify_automation" > services/workflow-engine/.env.example

echo "PORT=3004
GEMINI_API_KEY=your_gemini_api_key_here" > services/pricing-ai/.env.example

echo "PORT=3005
GEMINI_API_KEY=your_gemini_api_key_here" > services/image-ai/.env.example

echo "✅ Environment examples created"

echo "
Setup complete! Next steps:

1. Install dependencies:
   pnpm install

2. Set up your .env files in each service

3. Run database migrations:
   cd apps/dashboard && npx prisma migrate dev

4. Build shared packages:
   cd packages/types && pnpm build
   cd packages/ai-core && pnpm build

5. Start services:
   pnpm dev (from root)

   Or individually:
   cd services/product-ai && pnpm dev
   cd services/inventory-ai && pnpm dev
   etc.
"
