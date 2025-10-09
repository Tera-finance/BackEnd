# 🚀 VPS Deployment Quick Start

Complete guide to deploy TrustBridge backend to a VPS with your domain.

## 📁 Deployment Files Overview

| File | Purpose |
|------|---------|
| `VPS_DEPLOYMENT_GUIDE.md` | **Complete step-by-step deployment guide** |
| `PRODUCTION_CHECKLIST.md` | **Deployment checklist to ensure nothing is missed** |
| `ecosystem.config.js` | PM2 process manager configuration |
| `nginx.conf` | Nginx reverse proxy configuration template |
| `deploy.sh` | Automated deployment/update script |
| `setup-vps.sh` | VPS initial setup automation script |
| `.env.example` | Environment variables template |

---

## ⚡ Quick Deploy (3 Options)

### Option 1: Deploy Backend Only (Recommended)
**Best for:** WhatsApp bot + Website consuming REST API

✅ **What you deploy:** `backend-trustbridge` only  
✅ **What it provides:** REST API accessible at `https://api.yourdomain.com`  
✅ **Who consumes it:** WhatsApp bot, Website, Mobile apps

### Option 2: Backend + Off-chain Scripts
**Best for:** Automated blockchain operations

✅ **What you deploy:** `backend-trustbridge` + `be-offchain`  
✅ **Use case:** Scheduled token deployments, automated swaps  
⚠️ **Note:** Usually not needed unless automating blockchain ops

### Option 3: Serverless (Vercel)
**Best for:** Quick deployment without VPS management

✅ Already configured in `vercel.json`  
❌ May have limitations with WebSockets and long-running processes

---

## 🎯 Recommended: Deploy Backend Only to VPS

### Prerequisites
1. **VPS**: Ubuntu 20.04/22.04 LTS (2GB RAM minimum)
2. **Domain**: Purchased and DNS configured (A record → VPS IP)
3. **Services Ready**:
   - Supabase account (database)
   - Redis (local or managed)
   - Blockfrost API key
   - WhatsApp Business API credentials

---

## 📋 Step-by-Step Deployment

### 1️⃣ Setup Your VPS (One-time)

**On your VPS as root:**
```bash
# Copy setup script to VPS
scp setup-vps.sh root@your-vps-ip:/root/

# SSH to VPS
ssh root@your-vps-ip

# Run setup script
chmod +x setup-vps.sh
./setup-vps.sh
```

This installs: Node.js, PM2, Nginx, Certbot, Redis, Git

---

### 2️⃣ Deploy Your Application

**Switch to app user:**
```bash
su - trustbridge
```

**Clone your repository:**
```bash
cd ~
git clone https://github.com/your-username/TrustBridge.git
cd TrustBridge/backend-trustbridge
```

**Configure environment:**
```bash
cp .env.example .env
nano .env
```

Fill in your production values:
- Supabase credentials
- Redis URL
- JWT secrets (32+ characters)
- Blockfrost API key
- WhatsApp credentials
- etc.

**Install & Build:**
```bash
npm install --production
npm run build
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd  # Follow the output command
```

---

### 3️⃣ Configure Nginx

**As root/sudo user:**
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/trustbridge-api

# Edit domain name
sudo nano /etc/nginx/sites-available/trustbridge-api
# Replace: api.trustbridge.com with YOUR domain

# Enable site
sudo ln -s /etc/nginx/sites-available/trustbridge-api /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### 4️⃣ Setup SSL Certificate

**Get free SSL from Let's Encrypt:**
```bash
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose option 2 (redirect HTTP to HTTPS)

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

### 5️⃣ Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

### 6️⃣ Verify Deployment

**Test your API:**
```bash
# Health check
curl https://api.yourdomain.com/health

# Get currencies
curl https://api.yourdomain.com/api/exchange/currencies

# Exchange rate
curl "https://api.yourdomain.com/api/exchange/rate?from=USD&to=IDR"
```

**Check PM2 status:**
```bash
pm2 status
pm2 logs trustbridge-api
```

---

## 🔄 Updating Your Deployment

**Quick update script:**
```bash
cd ~/TrustBridge/backend-trustbridge
./deploy.sh
```

**Or manual update:**
```bash
git pull origin main
npm install --production
npm run build
pm2 restart trustbridge-api
```

---

## 🔗 Configure Your Integrations

### Update WhatsApp Bot
```javascript
// In your WhatsApp bot code
const API_BASE_URL = 'https://api.yourdomain.com';
```

### Update Website/Frontend
```bash
# In CardanoPay/.env.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Configure WhatsApp Webhook
1. Go to Meta Developer Console
2. Set webhook URL: `https://api.yourdomain.com/api/whatsapp/webhook`
3. Use your `WHATSAPP_VERIFY_TOKEN` from .env

### Update Postman Collection
```json
{
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.yourdomain.com"
    }
  ]
}
```

---

## 📊 Monitoring

### View Logs
```bash
# PM2 logs
pm2 logs trustbridge-api

# Nginx access logs
sudo tail -f /var/log/nginx/trustbridge-api-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/trustbridge-api-error.log
```

### Monitor Resources
```bash
# PM2 monitoring
pm2 monit

# Disk usage
df -h

# Memory usage
free -h
```

---

## 🛠️ Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs trustbridge-api --err

# Restart
pm2 restart trustbridge-api

# Check environment
cat .env | grep -v "^#" | grep -v "^$"
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check port 3000
lsof -i :3000

# Restart services
pm2 restart trustbridge-api
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test Supabase connection
curl -X GET 'https://your-project.supabase.co/rest/v1/' \
  -H "apikey: your-anon-key"

# Check .env
cat .env | grep DATABASE_URL
```

### Redis Connection Issues
```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server
```

---

## 📚 Documentation Links

1. **[VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)** - Complete deployment guide
2. **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre/post deployment checklist
3. **[TrustBridge_API.postman_collection.json](./TrustBridge_API.postman_collection.json)** - API testing collection

---

## 🎯 What Gets Deployed

### Backend API (`backend-trustbridge`)
- ✅ REST API endpoints
- ✅ WhatsApp webhook
- ✅ Exchange rate services
- ✅ Transfer management
- ✅ Database integration
- ✅ Redis caching
- ✅ Authentication & security

### NOT Deployed (Run separately when needed)
- ❌ `be-offchain` scripts (deploy/mint/swap) - Run manually or schedule
- ❌ Frontend (`CardanoPay`) - Deploy to Vercel/Netlify separately
- ❌ Smart contracts (`Trustbridge-SmartContracts`) - Already on blockchain

---

## 🚀 Production Endpoints

Once deployed, your API will be available at:

**Exchange API:**
- `GET /api/exchange/currencies` - List supported currencies
- `GET /api/exchange/rate?from=USD&to=IDR` - Get exchange rate
- `GET /api/exchange/path?from=USD&to=IDR` - Get conversion path

**Transfer API:**
- `POST /api/transfer/calculate` - Calculate transfer cost
- `POST /api/transfer/initiate` - Initiate transfer
- `POST /api/transfer/confirm` - Confirm transfer
- `GET /api/transfer/status/:transferId` - Get transfer status
- `GET /api/transfer/details/:transferId` - Get detailed transfer info
- `GET /api/transfer/history` - Get transfer history

**WhatsApp API:**
- `POST /api/whatsapp/webhook` - WhatsApp webhook endpoint
- `GET /api/whatsapp/webhook` - Webhook verification

**Health Check:**
- `GET /health` - API health status

---

## 📞 Need Help?

1. **Check logs first:** `pm2 logs trustbridge-api`
2. **Review deployment guide:** `VPS_DEPLOYMENT_GUIDE.md`
3. **Verify checklist:** `PRODUCTION_CHECKLIST.md`
4. **Test with Postman:** Import `TrustBridge_API.postman_collection.json`

---

## ✅ Deployment Success Criteria

- [ ] API accessible at `https://api.yourdomain.com`
- [ ] All endpoints return 200/201 status codes
- [ ] SSL certificate valid and auto-renewing
- [ ] PM2 running with no errors
- [ ] Database connected successfully
- [ ] Redis connected successfully
- [ ] WhatsApp webhook verified
- [ ] Frontend/bot consuming API successfully

---

## 🎉 You're Ready!

Your TrustBridge backend is now production-ready and can be consumed by:
- ✅ WhatsApp Bot
- ✅ Website/Frontend
- ✅ Mobile Apps
- ✅ Any HTTP client

**Happy deploying!** 🚀
