# Deploy TrustBridge Backend to Vercel (GitHub Integration)

## 🚀 Quick Deployment Steps

### 1. Push Your Code to GitHub

```bash
# If you haven't already, commit your changes
git add .
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `Tera-Finance/Tera-Backend`
4. Click **"Import"**

### 3. Configure Project Settings

Vercel will auto-detect the configuration from `vercel.json`. You'll see:

- **Framework Preset**: Other
- **Root Directory**: `./`
- **Build Command**: (leave empty - serverless functions don't need build)
- **Output Directory**: (leave empty)

Click **"Deploy"** - but it will fail without environment variables. That's OK!

### 4. Add Environment Variables

Go to **Settings** → **Environment Variables** and add these:

#### Database Configuration (Aiven MySQL)
```
DB_HOST=your-aiven-host.aivencloud.com
DB_PORT=10280
DB_USER=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD
DB_NAME=defaultdb
DB_SSL=true
```

**Get your actual values from:**
- Your local `.env` file
- Aiven dashboard: https://console.aiven.io/

#### Redis Configuration
⚠️ **Important**: Get a FREE Redis from Upstash:
1. Go to https://upstash.com/
2. Create account and new Redis database
3. Copy the Redis URL
4. Add to Vercel:
```
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

**Get your actual Redis URL from:**
- Your local `.env` file
- Upstash dashboard: https://console.upstash.com/

#### JWT & Security
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key
```

**Generate secure keys:**
```bash
# JWT Secret
openssl rand -hex 32

# JWT Refresh Secret
openssl rand -hex 32

# Encryption Key (must be exactly 32 characters)
openssl rand -hex 16
```

**Or get from your local `.env` file**

#### Blockchain Configuration (Base Sepolia)
```
RPC_URL=https://sepolia.base.org
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

⚠️ **Important**: Use your actual private key from `.env` file

#### Smart Contract Addresses
```
REMITTANCE_SWAP_ADDRESS=0x9354839fba186309fd2c32626e424361f57233d2
MULTI_TOKEN_SWAP_ADDRESS=0x2c7f17bc795be548a0b1da28d536d57f78df0543
```

#### Token Addresses (Base Sepolia)
```
USDC_ADDRESS=0x886664e1707b8e013a4242ee0dbfe753c68bf7d4
IDRX_ADDRESS=0x67cacfe96ca874ec7a78ee0d6f7044e878ba9c4c
CNHT_ADDRESS=0x993f00d791509cfab774e3b97dab1f0470ffc9cf
EUROC_ADDRESS=0x76c9d8f6eb862d4582784d7e2848872f83a64c1b
JPYC_ADDRESS=0x5246818cdeccf2a5a08267f27ad76dce8239eaec
MXNT_ADDRESS=0x83d1214238dd4323bd165170cf9761a4718ae1db
```

#### Exchange Rate API (Optional)
```
EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest
```

#### Rate Limiting
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Node Environment
```
NODE_ENV=production
```

**💡 Tip**: For each variable, select **"Production", "Preview", and "Development"** environments.

### 5. Redeploy

1. Go to **Deployments** tab
2. Click the three dots `...` on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete ✅

### 6. Test Your Deployment

```bash
# Get your Vercel URL from the dashboard (e.g., https://tera-backend.vercel.app)

# Test health endpoint
curl https://your-project.vercel.app/health

# Or visit in browser
https://your-project.vercel.app
```

Expected response:
```json
{
  "status": "healthy",
  "network": "base-sepolia",
  "chainId": 84532,
  "timestamp": "2025-10-17T..."
}
```

---

## 🔄 Auto-Deploy on Push

Once connected to GitHub, Vercel automatically deploys:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull Requests** → Preview deployment

Just push your code:
```bash
git add .
git commit -m "update feature"
git push origin main
```

Vercel will automatically build and deploy! 🎉

---

## 🛠️ Troubleshooting

### Deployment fails with "Module not found"
- Check that all dependencies are in `package.json`
- Run `npm install` locally to verify

### Database connection timeout
- Verify Aiven MySQL credentials
- Check that `DB_SSL=true` is set
- Verify Aiven firewall allows connections

### Redis connection error
- Get Upstash Redis (free tier): https://upstash.com/
- Update `REDIS_URL` in Vercel environment variables
- Redeploy

### Function timeout (10s limit)
- Check slow database queries
- Consider optimizing heavy operations
- Increase timeout in `vercel.json` if needed (max 60s on Pro plan)

---

## 📊 Monitoring

### View Logs
1. Go to your project in Vercel dashboard
2. Click **Deployments**
3. Click on a deployment
4. Click **"View Function Logs"**

### View Analytics
- **Vercel Dashboard** → Your Project → **Analytics**
- See request counts, errors, and performance

---

## 🎯 Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `api.trustbridge.com`)
3. Update DNS as instructed by Vercel
4. Wait for SSL certificate (automatic)

---

## 📝 Environment Variables Quick Copy

See `vercel-env-template.txt` for a complete list you can paste into Vercel dashboard.

---

## ✅ Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected to GitHub
- [ ] All environment variables added
- [ ] Upstash Redis configured
- [ ] Deployment successful
- [ ] Health endpoint returns `200 OK`
- [ ] API endpoints tested
- [ ] Custom domain configured (optional)

---

Need help? Check the logs or visit https://vercel.com/docs
