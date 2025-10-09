#!/bin/bash

# Quick Setup Script for TrustBridge Backend on VPS
# Run this script on a fresh Ubuntu VPS to set up the environment

set -e

echo "🎯 TrustBridge Backend VPS Quick Setup"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run as root or with sudo"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install Redis (optional - if not using managed Redis)
echo "📦 Installing Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install Git (if not already installed)
echo "📦 Installing Git..."
apt install -y git

# Create application user
echo "👤 Creating application user 'trustbridge'..."
if id "trustbridge" &>/dev/null; then
    echo "User 'trustbridge' already exists"
else
    adduser --disabled-password --gecos "" trustbridge
    echo "User 'trustbridge' created"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# Create logs directory
echo "📁 Creating application directories..."
mkdir -p /home/trustbridge/logs
chown -R trustbridge:trustbridge /home/trustbridge

echo ""
echo "✅ System setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Switch to trustbridge user: su - trustbridge"
echo "2. Clone your repository: git clone <your-repo-url>"
echo "3. Navigate to backend: cd TrustBridge/backend-trustbridge"
echo "4. Copy .env.example to .env and configure"
echo "5. Run: npm install && npm run build"
echo "6. Start with PM2: pm2 start ecosystem.config.js"
echo "7. Setup PM2 startup: pm2 startup systemd"
echo "8. Copy nginx.conf to /etc/nginx/sites-available/trustbridge-api"
echo "9. Enable site: ln -s /etc/nginx/sites-available/trustbridge-api /etc/nginx/sites-enabled/"
echo "10. Setup SSL: certbot --nginx -d api.yourdomain.com"
echo ""
echo "📖 See VPS_DEPLOYMENT_GUIDE.md for detailed instructions"
