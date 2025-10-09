# 🚀 TrustBridge VPS Deployment - Quick Reference

## 📋 Essential Commands

### VPS Setup (One-time)
```bash
# 1. Initial VPS setup as root
./setup-vps.sh

# 2. Switch to app user
su - trustbridge

# 3. Clone repository
git clone https://github.com/your-username/TrustBridge.git
cd TrustBridge/backend-trustbridge
```

### Environment Setup
```bash
# Copy and configure .env
cp .env.example .env
nano .env

# Make .env secure
chmod 600 .env
```

### Build & Deploy
```bash
# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Enable PM2 startup
pm2 startup systemd  # Run the command it outputs
pm2 save
```

### Nginx Configuration
```bash
# Copy config (as root/sudo)
sudo cp nginx.conf /etc/nginx/sites-available/trustbridge-api

# Edit domain name
sudo nano /etc/nginx/sites-available/trustbridge-api

# Enable site
sudo ln -s /etc/nginx/sites-available/trustbridge-api /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Setup
```bash
# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Quick Update
```bash
# Use deployment script
./deploy.sh

# Or manually
git pull origin main
npm install --production
npm run build
pm2 restart trustbridge-api
```

---

## 🔍 Monitoring & Logs

```bash
# PM2 status
pm2 status
pm2 logs trustbridge-api
pm2 monit

# Nginx logs
sudo tail -f /var/log/nginx/trustbridge-api-access.log
sudo tail -f /var/log/nginx/trustbridge-api-error.log

# Application logs
tail -f ~/TrustBridge/backend-trustbridge/logs/out.log
tail -f ~/TrustBridge/backend-trustbridge/logs/err.log

# System resources
free -h        # Memory
df -h          # Disk
htop           # CPU
```

---

## 🛠️ Troubleshooting

### Application Issues
```bash
# Restart app
pm2 restart trustbridge-api

# View errors
pm2 logs trustbridge-api --err

# Delete and restart
pm2 delete trustbridge-api
pm2 start ecosystem.config.js
```

### Nginx Issues
```bash
# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Database Issues
```bash
# Test Supabase
curl -X GET 'https://your-project.supabase.co/rest/v1/' \
  -H "apikey: your-anon-key"

# Check .env
cat .env | grep DATABASE_URL
```

### Redis Issues
```bash
# Check status
sudo systemctl status redis-server

# Test connection
redis-cli ping

# Restart
sudo systemctl restart redis-server
```

---

## ✅ Testing Endpoints

```bash
# Base URL
BASE_URL="https://api.yourdomain.com"

# Health check
curl $BASE_URL/health

# Get currencies
curl $BASE_URL/api/exchange/currencies

# Exchange rate
curl "$BASE_URL/api/exchange/rate?from=USD&to=IDR"

# Conversion path
curl "$BASE_URL/api/exchange/path?from=USD&to=IDR"

# Transfer history
curl $BASE_URL/api/transfer/history
```

---

## 📝 Environment Variables (Must Configure)

```bash
# Core
PORT=3000
NODE_ENV=production

# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Cache
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=  # Min 32 chars
JWT_REFRESH_SECRET=  # Min 32 chars
ENCRYPTION_KEY=  # Exactly 32 chars

# Blockchain
CARDANO_NETWORK=Preprod  # or Mainnet
BLOCKFROST_API_KEY=
BLOCKFROST_URL=

# WhatsApp
WHATSAPP_API_URL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# AI
OPENAI_API_KEY=
```

---

## 🔐 Security Checklist

- [ ] UFW firewall enabled (ports 22, 80, 443 only)
- [ ] SSL certificate installed and auto-renewing
- [ ] .env file permissions set to 600
- [ ] Strong JWT secrets (32+ characters)
- [ ] SSH key-based authentication
- [ ] Root login disabled (optional)
- [ ] Regular security updates enabled

---

## 📊 PM2 Commands

```bash
pm2 start ecosystem.config.js    # Start application
pm2 restart trustbridge-api      # Restart app
pm2 stop trustbridge-api         # Stop app
pm2 delete trustbridge-api       # Remove from PM2
pm2 logs trustbridge-api         # View logs
pm2 monit                        # Monitor resources
pm2 status                       # Check status
pm2 save                         # Save PM2 state
pm2 startup systemd              # Enable startup
pm2 list                         # List all apps
```

---

## 🌐 Nginx Commands

```bash
sudo nginx -t                        # Test config
sudo systemctl start nginx           # Start
sudo systemctl stop nginx            # Stop
sudo systemctl restart nginx         # Restart
sudo systemctl reload nginx          # Reload config
sudo systemctl status nginx          # Check status
sudo systemctl enable nginx          # Enable on boot
```

---

## 🔒 Certbot Commands

```bash
sudo certbot --nginx -d api.yourdomain.com    # Get certificate
sudo certbot certificates                     # List certificates
sudo certbot renew                            # Renew certificates
sudo certbot renew --dry-run                  # Test renewal
sudo certbot delete --cert-name api.yourdomain.com  # Delete cert
```

---

## 📁 Important Paths

```bash
# Application
~/TrustBridge/backend-trustbridge/

# Logs
~/TrustBridge/backend-trustbridge/logs/

# Nginx config
/etc/nginx/sites-available/trustbridge-api
/etc/nginx/sites-enabled/trustbridge-api

# Nginx logs
/var/log/nginx/trustbridge-api-access.log
/var/log/nginx/trustbridge-api-error.log

# SSL certificates
/etc/letsencrypt/live/api.yourdomain.com/

# PM2
~/.pm2/
~/.pm2/logs/
```

---

## 🔄 Update Workflow

1. **Test locally first**
   ```bash
   npm run build
   npm start
   ```

2. **Push to Git**
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```

3. **Deploy to VPS**
   ```bash
   ssh trustbridge@your-vps-ip
   cd ~/TrustBridge/backend-trustbridge
   ./deploy.sh
   ```

4. **Verify**
   ```bash
   pm2 status
   curl https://api.yourdomain.com/health
   ```

---

## 🚨 Emergency Commands

### If Everything Fails
```bash
# Restart all services
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart redis-server

# Check all logs
pm2 logs trustbridge-api --lines 100
sudo tail -100 /var/log/nginx/error.log
```

### Database Backup (if self-hosted PostgreSQL)
```bash
# Backup
pg_dump -U username -h localhost dbname > backup_$(date +%Y%m%d).sql

# Restore
psql -U username -h localhost dbname < backup_20251009.sql
```

---

## 📞 Support Resources

- **Documentation**: `VPS_DEPLOYMENT_GUIDE.md`
- **Checklist**: `PRODUCTION_CHECKLIST.md`
- **Architecture**: `DEPLOYMENT_ARCHITECTURE.md`
- **API Collection**: `TrustBridge_API.postman_collection.json`

---

## 🎯 Deployment Files

| File | Purpose |
|------|---------|
| `VPS_DEPLOYMENT_GUIDE.md` | Complete deployment guide |
| `PRODUCTION_CHECKLIST.md` | Deployment checklist |
| `DEPLOYMENT_ARCHITECTURE.md` | System architecture diagram |
| `DEPLOYMENT_README.md` | Quick start guide |
| `ecosystem.config.js` | PM2 configuration |
| `nginx.conf` | Nginx template |
| `deploy.sh` | Update script |
| `setup-vps.sh` | VPS setup script |

---

## ✅ Quick Health Check

```bash
# 1. PM2 running?
pm2 status | grep trustbridge-api

# 2. Port 3000 open?
lsof -i :3000

# 3. Nginx working?
curl -I http://localhost

# 4. API responding?
curl https://api.yourdomain.com/health

# 5. SSL valid?
curl -I https://api.yourdomain.com

# 6. Redis working?
redis-cli ping

# 7. Database connected?
# Check application logs
pm2 logs trustbridge-api --lines 20 | grep -i "connected"
```

---

## 🎉 Success Indicators

✅ **Deployment Successful When:**
- PM2 shows status "online"
- No errors in logs
- API returns 200 OK on /health
- SSL certificate shows valid
- WhatsApp webhook verified
- Frontend can consume API

---

## 📱 Integration URLs

**Update these in your applications:**

```javascript
// WhatsApp Bot
const API_BASE_URL = 'https://api.yourdomain.com';

// Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

// Postman
"baseUrl": "https://api.yourdomain.com"

// WhatsApp Webhook (Meta Console)
https://api.yourdomain.com/api/whatsapp/webhook
```

---

**Keep this reference handy!** 📌
