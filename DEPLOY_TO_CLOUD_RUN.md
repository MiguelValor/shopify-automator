# Deploy Shopify App to Google Cloud Run

## Prerequisites

✅ Google Cloud SDK installed
✅ Authenticated with gcloud

## Step 1: Set up Google Cloud Project

Choose ONE of the following options:

### Option A: Use Existing Project (Recommended if billing is already enabled)

```bash
# List your projects to find one with billing enabled
gcloud projects list

# Set the project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID
```

### Option B: Create New Project (Requires billing setup)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project called "shopify-automator"
3. **Enable billing** for the project ([Billing Setup](https://console.cloud.google.com/billing))
4. Then run:
```bash
gcloud config set project YOUR_NEW_PROJECT_ID
```

## Step 2: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iam.googleapis.com
```

Wait 2-3 minutes for APIs to activate.

## Step 3: Deploy to Cloud Run

```bash
cd "/Users/MiguelValor/Documents/prototype 01/apps/dashboard"

gcloud run deploy automator \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=file:/app/prod.db"
```

The deployment will take 5-10 minutes.

## Step 4: Get Your App URL

After deployment completes, you'll see output like:

```
Service [automator] revision [automator-00001-xyz] has been deployed
Service URL: https://automator-xxxxx-uc.a.run.app
```

**Copy this URL** - you'll need it for the next step.

## Step 5: Set Environment Variables (After First Deploy)

```bash
gcloud run services update automator \
  --region us-central1 \
  --update-env-vars SHOPIFY_API_KEY=19ac447fb08fb4cb80e350cdaf5b9063,\
SHOPIFY_API_SECRET=YOUR_SECRET_HERE,\
SCOPES=read_products,write_products,read_inventory,write_inventory,read_price_rules,write_price_rules,\
GEMINI_API_KEY=AIzaSyD4okdCU8l_FKBmVqFCtGotEfly_i9brvQ
```

## Step 6: Update Shopify App URLs

1. Go to [Shopify Partners Dashboard](https://dev.shopify.com/dashboard/83795960/apps/313967017985)
2. Click on your **automator** app
3. Go to **Settings**
4. Update these URLs with your Cloud Run URL:
   - **App URL**: `https://automator-xxxxx-uc.a.run.app`
   - **Allowed redirection URLs**:
     - `https://automator-xxxxx-uc.a.run.app/auth/callback`
     - `https://automator-xxxxx-uc.a.run.app/auth/shopify/callback`

## Step 7: Test Your App

1. Go to https://admin.shopify.com/store/ultra-instinct-7882/apps
2. Find **automator** in your apps list
3. Click it - it should now load from your Cloud Run deployment!

## Troubleshooting

### Billing Required Error
- Enable billing at https://console.cloud.google.com/billing
- Link a billing account to your project

### API Not Enabled Error
- Run the enable commands in Step 2
- Wait 2-3 minutes before deploying

### Build Failed Error
- Check Cloud Build logs: `gcloud builds list --limit=5`
- View detailed logs: `gcloud builds log BUILD_ID`

## View Logs

```bash
# View recent logs
gcloud run services logs read automator --region us-central1

# Stream live logs
gcloud run services logs tail automator --region us-central1
```

## Update After Code Changes

```bash
cd "/Users/MiguelValor/Documents/prototype 01/apps/dashboard"
gcloud run deploy automator --source . --region us-central1
```

---

**Created**: January 22, 2026
**App Version**: automator-3
