# 🏗️ TrustBridge Backend Deployment Architecture

## 📊 Deployment Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  WhatsApp    │    │   Website    │    │  Mobile App  │      │
│  │     Bot      │    │  (Frontend)  │    │              │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                    │                    │              │
│         └────────────────────┼────────────────────┘              │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ HTTPS (api.yourdomain.com)
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                         YOUR VPS                                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Nginx (Port 80/443)                   │    │
│  │                    - Reverse Proxy                       │    │
│  │                    - SSL Termination                     │    │
│  │                    - Load Balancing                      │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │                                       │
│  ┌────────────────────────▼─────────────────────────────────┐    │
│  │                   PM2 Cluster Mode                        │    │
│  │                                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │  Node.js     │  │  Node.js     │  │  Node.js     │  │    │
│  │  │  Instance 1  │  │  Instance 2  │  │  Instance N  │  │    │
│  │  │  (Port 3000) │  │  (Port 3000) │  │  (Port 3000) │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                           │    │
│  │         Backend API (backend-trustbridge)                │    │
│  └────────────────────────┬──────────────────────────────────┘    │
│                           │                                       │
│  ┌────────────────────────▼─────────────────────────────────┐    │
│  │                    Redis (Port 6379)                      │    │
│  │                    - Caching Layer                        │    │
│  │                    - Session Storage                      │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                               │
                               │ External Connections
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐     ┌───────────────┐
│   Supabase    │      │  Blockfrost   │     │   WhatsApp    │
│  (PostgreSQL) │      │  Cardano API  │     │  Business API │
│               │      │               │     │               │
└───────────────┘      └───────────────┘     └───────────────┘
```

---

## 🚀 What Gets Deployed

### ✅ Deploy to VPS: `backend-trustbridge`

```
backend-trustbridge/
├── dist/                    # Compiled TypeScript → JavaScript
├── src/                     # Source code (not used in production)
├── .env                     # Production environment variables
├── ecosystem.config.js      # PM2 configuration
├── package.json            # Dependencies
└── node_modules/           # Installed packages
```

**Why deploy this?**
- REST API for all business logic
- WhatsApp webhook endpoint
- Exchange rate services
- Transfer management
- Authentication & authorization

---

### ❌ Do NOT Deploy: `be-offchain`

```
be-offchain/
├── deploy-all-tokens.ts    # Run manually when needed
├── mint-tokens.ts          # Run manually when needed
├── swap-tokens.ts          # Run manually when needed
└── check-balance.ts        # Run manually when needed
```

**Why not deploy?**
- One-time deployment scripts (already deployed to Cardano Preprod)
- Run on-demand from local machine or CI/CD
- Not needed for API operations

**When to run:**
- Initial token deployment: `npm run deploy` (once)
- Mint tokens: Run manually when testing
- Swap operations: Run manually when testing

---

### ❌ Do NOT Deploy: `CardanoPay` (Frontend)

```
CardanoPay/                  # Deploy separately to Vercel/Netlify
├── src/
├── public/
└── next.config.ts
```

**Deploy separately to:**
- Vercel (recommended)
- Netlify
- AWS Amplify
- GitHub Pages

**Configuration:**
```bash
# In CardanoPay/.env.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

### ❌ Do NOT Deploy: `Trustbridge-SmartContracts`

```
Trustbridge-SmartContracts/  # Already compiled and on blockchain
├── validators/
├── plutus.json              # Already has policy IDs
└── aiken.toml
```

**Why not deploy?**
- Smart contracts already deployed to Cardano Preprod
- Policy IDs already generated
- Validators compiled and on-chain

---

## 🔄 Data Flow

### 1. User Request (WhatsApp or Website)
```
User → WhatsApp/Website → HTTPS → Nginx → PM2 → Node.js API
```

### 2. API Processing
```
Node.js API → Exchange Rate Service → Calculate → Cache in Redis
           → Database (Supabase) → Store Transaction
           → Blockchain (Blockfrost) → Query Policy IDs
```

### 3. Response
```
Node.js API → JSON Response → PM2 → Nginx → HTTPS → User
```

---

## 📡 External Service Dependencies

### Required Services (Must be configured)

1. **Supabase (Database)**
   - User accounts
   - Transfer records
   - Transaction history
   - KYC documents

2. **Redis (Caching)**
   - Exchange rate caching
   - Session management
   - Rate limiting

3. **Blockfrost (Cardano API)**
   - Query blockchain data
   - Get token information
   - Verify transactions

4. **WhatsApp Business API**
   - Receive messages
   - Send responses
   - Webhook verification

5. **Exchange Rate APIs**
   - CoinGecko (crypto rates)
   - ExchangeRate-API (fiat rates)

---

## 🌍 Production URLs

### After Deployment:

**API Base URL:**
```
https://api.yourdomain.com
```

**Key Endpoints:**
```
GET  https://api.yourdomain.com/health
GET  https://api.yourdomain.com/api/exchange/currencies
GET  https://api.yourdomain.com/api/exchange/rate?from=USD&to=IDR
GET  https://api.yourdomain.com/api/transfer/history
POST https://api.yourdomain.com/api/transfer/calculate
POST https://api.yourdomain.com/api/whatsapp/webhook
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│  1. UFW Firewall (Port 22, 80, 443)     │
│  ↓                                       │
│  2. Nginx SSL/TLS (Let's Encrypt)       │
│  ↓                                       │
│  3. Helmet.js (Security Headers)        │
│  ↓                                       │
│  4. Rate Limiting (Express)             │
│  ↓                                       │
│  5. JWT Authentication                  │
│  ↓                                       │
│  6. Input Validation                    │
│  ↓                                       │
│  7. Database Row Level Security (RLS)   │
└─────────────────────────────────────────┘
```

---

## 📊 Monitoring Stack

```
┌─────────────────────────────────────────┐
│  Application Logs (PM2)                 │
│  - /home/trustbridge/logs/out.log       │
│  - /home/trustbridge/logs/err.log       │
│  ↓                                       │
│  Web Server Logs (Nginx)                │
│  - /var/log/nginx/access.log            │
│  - /var/log/nginx/error.log             │
│  ↓                                       │
│  Process Monitoring (PM2)               │
│  - pm2 monit                             │
│  - pm2 status                            │
│  ↓                                       │
│  External Monitoring (Optional)         │
│  - UptimeRobot                           │
│  - Pingdom                               │
│  - Sentry (Error tracking)              │
└─────────────────────────────────────────┘
```

---

## ⚡ Performance Optimization

### PM2 Cluster Mode
- Multiple Node.js instances
- Load balanced across CPU cores
- Zero-downtime restarts
- Automatic process recovery

### Nginx Caching
- Static asset caching
- Response compression
- Connection pooling

### Redis Caching
- Exchange rate caching (5 min TTL)
- Session management
- Rate limit tracking

### Database Optimization
- Connection pooling (pg)
- Supabase automatic scaling
- Indexed queries

---

## 🔄 CI/CD Workflow (Optional Future Enhancement)

```
┌─────────────────────────────────────────┐
│  1. Push code to GitHub                 │
│  ↓                                       │
│  2. GitHub Actions triggered            │
│  ↓                                       │
│  3. Run tests & build                   │
│  ↓                                       │
│  4. SSH to VPS                          │
│  ↓                                       │
│  5. Run deploy.sh script                │
│  ↓                                       │
│  6. PM2 restarts with zero downtime     │
│  ↓                                       │
│  7. Notify team (Slack/Discord)         │
└─────────────────────────────────────────┘
```

---

## 📦 Deployment Summary

### What You Need to Deploy:
1. **VPS** with Ubuntu 20.04/22.04
2. **Domain** pointed to VPS IP
3. **Environment Variables** configured
4. **External Services** ready (Supabase, Blockfrost, etc.)

### What Gets Deployed:
- ✅ `backend-trustbridge` → VPS (PM2 + Nginx)

### What Stays Local/Separate:
- ❌ `be-offchain` → Run manually when needed
- ❌ `CardanoPay` → Deploy to Vercel separately
- ❌ `Trustbridge-SmartContracts` → Already on blockchain

### Who Consumes the API:
- WhatsApp Bot
- Website (CardanoPay)
- Mobile Apps (future)
- Admin Dashboard (future)

---

## 🎯 Quick Deployment Command Summary

```bash
# 1. Setup VPS (one-time)
./setup-vps.sh

# 2. Clone & configure
git clone <repo>
cd backend-trustbridge
cp .env.example .env
nano .env

# 3. Build & deploy
npm install --production
npm run build
pm2 start ecosystem.config.js

# 4. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/trustbridge-api
sudo ln -s /etc/nginx/sites-available/trustbridge-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Setup SSL
sudo certbot --nginx -d api.yourdomain.com

# 6. Future updates
./deploy.sh
```

**You're all set!** 🚀
