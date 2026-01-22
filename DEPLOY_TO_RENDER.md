# Deploy Shopify App to Render (Free Tier)

Render is easier than Google Cloud and has a free tier - perfect for getting your app online quickly!

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Sign up with your GitHub account (or email)
3. No credit card required for free tier!

## Step 2: Push Your Code to GitHub

First, initialize git and push your code:

```bash
cd "/Users/MiguelValor/Documents/prototype 01"

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Shopify Automator app"

# Create a new repository on GitHub (https://github.com/new)
# Name it: shopify-automator

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/shopify-automator.git
git branch -M main
git push -u origin main
```

## Step 3: Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `shopify-automator`
4. Configure the service:
   - **Name**: `automator`
   - **Region**: Oregon (US West) or closest to you
   - **Root Directory**: `apps/dashboard`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Instance Type**: Free

## Step 4: Add Environment Variables

In the Render dashboard, go to **Environment** and add these variables:

```
NODE_ENV=production
DATABASE_URL=file:/opt/render/project/src/prod.db
SHOPIFY_API_KEY=19ac447fb08fb4cb80e350cdaf5b9063
SHOPIFY_API_SECRET=YOUR_SECRET_HERE
SCOPES=read_products,write_products,read_inventory,write_inventory,read_price_rules,write_price_rules
GEMINI_API_KEY=AIzaSyD4okdCU8l_FKBmVqFCtGotEfly_i9brvQ
```

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your app
3. Wait 5-10 minutes for the first deploy

## Step 6: Get Your URL

After deployment completes, you'll get a URL like:
```
https://automator-xxxx.onrender.com
```

## Step 7: Update Shopify App URLs

1. Go to [Shopify Partners Dashboard](https://dev.shopify.com/dashboard/83795960/apps/313967017985/settings)
2. Update these URLs:
   - **App URL**: `https://automator-xxxx.onrender.com`
   - **Allowed redirection URLs**:
     - `https://automator-xxxx.onrender.com/auth/callback`
     - `https://automator-xxxx.onrender.com/auth/shopify/callback`

## Step 8: Test Your App

1. Go to https://admin.shopify.com/store/ultra-instinct-7882/apps
2. Click on **automator**
3. Your app should now load from Render!

## Important Notes

### Free Tier Limitations
- App spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to Starter ($7/month) for always-on

### Database Persistence
The SQLite database will reset on each deploy. For production, you should:
- Upgrade to paid plan with persistent disk
- Or switch to PostgreSQL (free tier available on Render)

### Troubleshooting

**Build Failed?**
- Check the build logs in Render dashboard
- Ensure all dependencies are in package.json

**App Won't Load?**
- Check the logs in Render dashboard
- Verify environment variables are set correctly
- Make sure Shopify URLs are updated

---

**Created**: January 22, 2026
**Easier alternative to Google Cloud Run!**
