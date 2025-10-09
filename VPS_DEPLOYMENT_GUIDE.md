# 🚀 TrustBridge Backend VPS Deployment Guide

Complete guide to deploy the TrustBridge backend API to a VPS with domain and SSL.

## 📋 Prerequisites

### 1. VPS Requirements
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: 2 cores minimum
- **Storage**: 20GB minimum
- **Ports**: 80 (HTTP), 443 (HTTPS), 3000 (Node.js - internal)

### 2. Domain Setup
- Domain name pointed to VPS IP (A record)
- Example: `api.trustbridge.com` → `123.456.789.0`

### 3. Required Services
- PostgreSQL database (Supabase or self-hosted)
- Redis instance (local or managed)
- Blockfrost API key (Cardano)
- WhatsApp Business API credentials

---

## 🔧 Step 1: VPS Initial Setup

### SSH into your VPS
```bash
ssh root@your-vps-ip
# Or with key: ssh -i ~/.ssh/your-key.pem root@your-vps-ip
```

### Update system packages
```bash
apt update && apt upgrade -y
```

### Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Should show v20.x
npm -v
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
pm2 --version
```

### Install Nginx (Reverse Proxy)
```bash
apt install -y nginx
systemctl status nginx
```

### Install Certbot (SSL Certificates)
```bash
apt install -y certbot python3-certbot-nginx
```

### Install Redis (if not using managed Redis)
```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
redis-cli ping  # Should return "PONG"
```

---

## 📂 Step 2: Deploy Backend Application

### Create app user (security best practice)
```bash
adduser --disabled-password --gecos "" trustbridge
usermod -aG sudo trustbridge
su - trustbridge
```

### Clone/Upload your code
**Option A: Using Git**
```bash
cd ~
git clone https://github.com/your-username/TrustBridge.git
cd TrustBridge/backend-trustbridge
```

**Option B: Using SCP (from local machine)**
```bash
# From your local machine
scp -r /home/fabian/Code/web3/cardano/TrustBridge/backend-trustbridge root@your-vps-ip:/home/trustbridge/
```

### Install dependencies
```bash
cd ~/TrustBridge/backend-trustbridge
# or cd ~/backend-trustbridge

npm install --production
```

### Build TypeScript
```bash
npm run build
# This creates the dist/ folder
```

---

## 🔐 Step 3: Environment Configuration

### Create production .env file
```bash
cd ~/TrustBridge/backend-trustbridge
nano .env
```

### Add your production environment variables
```bash
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"

# Database Connection
DATABASE_URL="postgresql://username:password@host:5432/database"

# Redis
REDIS_URL="redis://localhost:6379"
# Or if using managed Redis: redis://user:password@redis-host:6379

# JWT
JWT_SECRET="your-super-secret-jwt-production-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-production-key-min-32-chars"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Cardano Blockchain
CARDANO_NETWORK="Preprod"
# For mainnet: CARDANO_NETWORK="Mainnet"
BLOCKFROST_API_KEY="preprodYourBlockfrostAPIKey"
BLOCKFROST_URL="https://cardano-preprod.blockfrost.io/api/v0"
# For mainnet: BLOCKFROST_URL="https://cardano-mainnet.blockfrost.io/api/v0"

# IPFS (if using local IPFS)
IPFS_API_URL="http://localhost:5001"

# WhatsApp Business API
WHATSAPP_API_URL="https://graph.facebook.com/v17.0"
WHATSAPP_ACCESS_TOKEN="your-production-whatsapp-token"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"

# Indodax API
INDODAX_API_URL="https://indodax.com/api"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-prod-key"

# Server
PORT=3000
NODE_ENV="production"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Secure the .env file
```bash
chmod 600 .env
```

---

## 🎯 Step 4: Configure PM2 Process Manager

### Create PM2 ecosystem file
```bash
cd ~/TrustBridge/backend-trustbridge
nano ecosystem.config.js
```

### Add PM2 configuration
```javascript
module.exports = {
  apps: [{
    name: 'trustbridge-api',
    script: './dist/index.js',
    instances: 2,  // or 'max' for all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    merge_logs: true
  }]
};
```

### Create logs directory
```bash
mkdir -p logs
```

### Start application with PM2
```bash
pm2 start ecosystem.config.js
pm2 status
pm2 logs trustbridge-api --lines 50
```

### Enable PM2 startup on boot
```bash
pm2 startup systemd
# Follow the command it outputs (copy and run it)

pm2 save
```

### Useful PM2 commands
```bash
pm2 status                    # Check status
pm2 logs trustbridge-api      # View logs
pm2 restart trustbridge-api   # Restart app
pm2 stop trustbridge-api      # Stop app
pm2 delete trustbridge-api    # Remove from PM2
pm2 monit                     # Monitor resources
```

---

## 🌐 Step 5: Configure Nginx Reverse Proxy

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/trustbridge-api
```

### Add Nginx config
```nginx
server {
    listen 80;
    server_name api.trustbridge.com;  # Replace with your domain

    # Request size limit for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/trustbridge-api /etc/nginx/sites-enabled/
```

### Test Nginx configuration
```bash
sudo nginx -t
```

### Reload Nginx
```bash
sudo systemctl reload nginx
```

---

## 🔒 Step 6: Setup SSL Certificate (HTTPS)

### Obtain SSL certificate with Certbot
```bash
sudo certbot --nginx -d api.trustbridge.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

### Verify SSL auto-renewal
```bash
sudo certbot renew --dry-run
```

### Check certificate status
```bash
sudo certbot certificates
```

---

## 🔥 Step 7: Configure Firewall

### Enable UFW firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

---

## ✅ Step 8: Verify Deployment

### Test the API
```bash
# Health check
curl https://api.trustbridge.com/health

# Get currencies
curl https://api.trustbridge.com/api/exchange/currencies

# Get exchange rate
curl "https://api.trustbridge.com/api/exchange/rate?from=USD&to=IDR"
```

### Check PM2 status
```bash
pm2 status
pm2 logs trustbridge-api --lines 100
```

### Monitor logs in real-time
```bash
pm2 logs trustbridge-api
```

---

## 🔄 Step 9: Setup Continuous Deployment (Optional)

### Create deployment script
```bash
cd ~/TrustBridge/backend-trustbridge
nano deploy.sh
```

### Add deployment script
```bash
#!/bin/bash

echo "🚀 Deploying TrustBridge Backend..."

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Restart PM2
pm2 restart trustbridge-api

echo "✅ Deployment completed!"
pm2 status
```

### Make it executable
```bash
chmod +x deploy.sh
```

### Deploy updates
```bash
./deploy.sh
```

---

## 📊 Step 10: Monitoring & Maintenance

### View application logs
```bash
# PM2 logs
pm2 logs trustbridge-api

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Monitor resources
```bash
# CPU and Memory
pm2 monit

# Disk usage
df -h

# Memory usage
free -h

# System resources
htop
```

### Database backup (if self-hosted PostgreSQL)
```bash
# Create backup
pg_dump -U username -h localhost database_name > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U username -h localhost database_name < backup_20251009.sql
```

---

## 🔗 Step 11: Update WhatsApp & Website Configuration

### WhatsApp Bot Configuration
Update your WhatsApp bot to use the production API:
```javascript
const API_BASE_URL = 'https://api.trustbridge.com';
```

### Website Configuration
Update your frontend environment variables:
```bash
# In CardanoPay/.env.local
NEXT_PUBLIC_API_URL=https://api.trustbridge.com
```

### Configure WhatsApp Webhook
1. Go to Meta Developer Console
2. Update webhook URL to: `https://api.trustbridge.com/api/whatsapp/webhook`
3. Use your `WHATSAPP_VERIFY_TOKEN` from .env

---

## 🛠️ Troubleshooting

### Issue: PM2 app crashes
```bash
pm2 logs trustbridge-api --err
pm2 restart trustbridge-api
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check if Node app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart trustbridge-api
sudo systemctl restart nginx
```

### Issue: Database connection fails
```bash
# Test Supabase connection
curl -X GET 'https://your-project.supabase.co/rest/v1/' \
  -H "apikey: your-anon-key"

# Check database URL in .env
cat .env | grep DATABASE_URL
```

### Issue: Redis connection fails
```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server
```

### Issue: SSL certificate not working
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Test Nginx config
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📝 Production Checklist

- [ ] Domain DNS configured (A record)
- [ ] VPS ports 80, 443 open
- [ ] Node.js 20.x installed
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] Production .env file configured
- [ ] Database connection tested
- [ ] Redis connection tested
- [ ] Application built (`npm run build`)
- [ ] PM2 startup enabled
- [ ] Firewall configured
- [ ] API endpoints tested
- [ ] WhatsApp webhook configured
- [ ] Website API URL updated
- [ ] Monitoring setup
- [ ] Backup strategy in place

---

## 🚀 Quick Deploy Commands

```bash
# On VPS as trustbridge user
cd ~/TrustBridge/backend-trustbridge

# Update code
git pull origin main

# Install & build
npm install --production && npm run build

# Restart
pm2 restart trustbridge-api

# Check status
pm2 status && pm2 logs trustbridge-api --lines 50
```

---

## 📞 API Endpoints for Testing

Once deployed, your API will be available at:

- **Health Check**: `GET https://api.trustbridge.com/health`
- **Currencies**: `GET https://api.trustbridge.com/api/exchange/currencies`
- **Exchange Rate**: `GET https://api.trustbridge.com/api/exchange/rate?from=USD&to=IDR`
- **Conversion Path**: `GET https://api.trustbridge.com/api/exchange/path?from=USD&to=IDR`
- **Transfer History**: `GET https://api.trustbridge.com/api/transfer/history`
- **Transfer Details**: `GET https://api.trustbridge.com/api/transfer/details/:transferId`
- **WhatsApp Webhook**: `POST https://api.trustbridge.com/api/whatsapp/webhook`

---

## 🎉 Congratulations!

Your TrustBridge backend is now deployed and ready for production use by:
- ✅ WhatsApp Bot
- ✅ Website/Frontend
- ✅ Mobile Apps

**Next Steps:**
1. Update Postman collection baseUrl to production domain
2. Configure monitoring alerts (optional: UptimeRobot, Sentry)
3. Setup automated backups
4. Deploy frontend to Vercel/Netlify
