# TrustBridge Backend Deployment Guide

Complete guide for deploying TrustBridge backend to VPS (Ubuntu/Debian).

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ VPS
- Root or sudo access
- Domain name (optional but recommended)
- At least 2GB RAM, 2 CPU cores

## 1. Install Required Software

### 1.1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be v18.x or higher
```

### 1.3. Install MySQL/MariaDB
```bash
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```

Follow the prompts:
- Set root password: `Yes`
- Remove anonymous users: `Yes`
- Disallow root login remotely: `Yes`
- Remove test database: `Yes`
- Reload privilege tables: `Yes`

### 1.4. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.5. Install Git
```bash
sudo apt install -y git
```

## 2. Setup Database

### 2.1. Create Database and User
```bash
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'trustbridge'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON trustbridge.* TO 'trustbridge'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
exit;
```

### 2.2. Import Database Schema
```bash
# Navigate to SQL directory
cd /path/to/backend-trustbridge/sql

# Import complete schema
mysql -u trustbridge -p trustbridge < complete-setup.sql

# Import initial data (tokens)
mysql -u trustbridge -p trustbridge < initial-data.sql

# Verify
mysql -u trustbridge -p trustbridge -e "SHOW TABLES;"
mysql -u trustbridge -p trustbridge -e "SELECT COUNT(*) FROM cardano_tokens;"
```

## 3. Deploy Backend Application

### 3.1. Clone Repository
```bash
cd /var/www  # or your preferred directory
sudo git clone <your-repo-url> trustbridge-backend
cd trustbridge-backend
```

### 3.2. Install Dependencies
```bash
npm install
```

### 3.3. Copy plutus.json
```bash
# Copy from TrustBridge-SmartContracts deployment
cp /path/to/TrustBridge-SmartContracts/be-offchain/plutus.json .
```

### 3.4. Create .env File
```bash
nano .env
```

Paste this configuration:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=trustbridge

# Redis Configuration (optional - uses mock in development)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=

# Cardano Blockchain Configuration
CARDANO_NETWORK=Preprod
WALLET_SEED=your wallet seed phrase here (24 words)
BLOCKFROST_API_KEY=preprodYOUR_BLOCKFROST_API_KEY_HERE
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# API Keys (Optional)
COINGECKO_API_KEY=
EXCHANGERATE_API_KEY=

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRES_IN=30d
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important Notes:**
- Replace `YOUR_STRONG_PASSWORD_HERE` with your actual database password
- Get your Blockfrost API key from https://blockfrost.io (Preprod network)
- Generate secure random strings for JWT_SECRET and ENCRYPTION_KEY:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Use your Cardano wallet seed phrase (24 words) that has testnet ADA

### 3.5. Build Application
```bash
npm run build
```

### 3.6. Test Run
```bash
npm start
```

If successful, you should see:
```
✅ Connected to MySQL database
✅ Connected to Redis
🚀 TrustBridge Backend running on port 5000
```

Press `Ctrl+C` to stop.

## 4. Setup PM2 for Production

### 4.1. Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'trustbridge-backend',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4.2. Create Logs Directory
```bash
mkdir -p logs
```

### 4.3. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy and run the command that PM2 outputs to enable auto-start on boot.

### 4.4. Manage PM2
```bash
# View logs
pm2 logs trustbridge-backend

# Monitor
pm2 monit

# Restart
pm2 restart trustbridge-backend

# Stop
pm2 stop trustbridge-backend

# View status
pm2 status
```

## 5. Setup Nginx Reverse Proxy (Recommended)

### 5.1. Install Nginx
```bash
sudo apt install -y nginx
```

### 5.2. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/trustbridge-api
```

```nginx
server {
    listen 80;
    server_name api.your-domain.com;  # Change this

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }
}
```

### 5.3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/trustbridge-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.4. Install SSL with Certbot (Recommended)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

## 6. Setup Firewall

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
sudo ufw status
```

## 7. Database Backup Setup

### 7.1. Create Backup Script
```bash
sudo nano /usr/local/bin/backup-trustbridge-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/trustbridge"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/trustbridge_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
mysqldump -u trustbridge -pYOUR_PASSWORD trustbridge > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "trustbridge_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 7.2. Make Executable
```bash
sudo chmod +x /usr/local/bin/backup-trustbridge-db.sh
```

### 7.3. Setup Cron Job (Daily at 2 AM)
```bash
sudo crontab -e
```

Add:
```
0 2 * * * /usr/local/bin/backup-trustbridge-db.sh >> /var/log/trustbridge-backup.log 2>&1
```

## 8. Monitoring & Maintenance

### 8.1. View Application Logs
```bash
pm2 logs trustbridge-backend --lines 100
```

### 8.2. View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 8.3. Monitor System Resources
```bash
htop
pm2 monit
```

### 8.4. Database Monitoring
```bash
mysql -u trustbridge -p trustbridge -e "
SELECT
  COUNT(*) as total_transfers,
  SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending
FROM transfers;
"
```

## 9. Updating the Application

```bash
cd /var/www/trustbridge-backend

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart trustbridge-backend

# Verify
pm2 status
pm2 logs trustbridge-backend --lines 50
```

## 10. Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mariadb

# Test connection
mysql -u trustbridge -p trustbridge -e "SELECT 1;"

# Check database exists
mysql -u trustbridge -p -e "SHOW DATABASES;"
```

### Application Not Starting
```bash
# Check logs
pm2 logs trustbridge-backend

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Verify .env file
cat .env | grep -v "PASSWORD\|SECRET\|KEY"
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

## 11. Security Checklist

- [x] Strong database password
- [x] Firewall configured (UFW)
- [x] SSL certificate installed (Let's Encrypt)
- [x] Environment variables secured
- [x] Database backups automated
- [x] PM2 auto-restart enabled
- [x] Rate limiting configured
- [x] CORS properly configured
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Monitor logs regularly

## 12. API Endpoints

Once deployed, your API will be available at:

- **Base URL**: `https://api.your-domain.com`
- **Health Check**: `GET /health`
- **Transfer API**: `POST /api/transfer/initiate`
- **History**: `GET /api/transactions/history`
- **Rates**: `GET /api/exchange/rates`

## Support

For issues or questions:
1. Check logs: `pm2 logs trustbridge-backend`
2. Review this guide
3. Check backend README.md
4. Verify .env configuration
5. Test database connection

---

**Deployment Checklist:**
- [ ] VPS ready (2GB+ RAM)
- [ ] Domain configured
- [ ] MySQL/MariaDB installed
- [ ] Database created and populated
- [ ] Node.js installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Application built
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy setup
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring enabled

**Production URL:** https://api-trustbridge.izcy.tech
