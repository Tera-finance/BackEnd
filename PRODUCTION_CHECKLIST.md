# 🚀 TrustBridge Production Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## 📋 Pre-Deployment

### Infrastructure
- [ ] VPS provisioned (2GB RAM minimum, 4GB recommended)
- [ ] Ubuntu 20.04 LTS or 22.04 LTS installed
- [ ] Domain name purchased and configured
- [ ] DNS A record pointing domain to VPS IP
- [ ] SSH access configured with key-based authentication

### Services & Accounts
- [ ] Supabase project created (or PostgreSQL database ready)
- [ ] Redis instance ready (local or managed)
- [ ] Blockfrost account created & API key obtained
- [ ] WhatsApp Business API credentials ready
- [ ] OpenAI API key obtained (for AI features)

### Code Preparation
- [ ] Code pushed to Git repository (GitHub/GitLab)
- [ ] All dependencies listed in package.json
- [ ] TypeScript build tested locally (`npm run build`)
- [ ] Environment variables documented
- [ ] Production .env.example updated

---

## 🔧 VPS Setup

### System Configuration
- [ ] System packages updated (`apt update && apt upgrade`)
- [ ] Node.js 20.x installed
- [ ] PM2 process manager installed globally
- [ ] Nginx web server installed
- [ ] Certbot SSL certificate manager installed
- [ ] Redis server installed (if using local Redis)
- [ ] Git installed
- [ ] Application user created (`trustbridge`)

### Security
- [ ] SSH key-based authentication enabled
- [ ] Password authentication disabled (optional but recommended)
- [ ] UFW firewall enabled
- [ ] Only ports 22, 80, 443 open
- [ ] Fail2ban installed and configured (optional)

---

## 📦 Application Deployment

### Code Setup
- [ ] Repository cloned to `/home/trustbridge/TrustBridge`
- [ ] Navigated to `backend-trustbridge` directory
- [ ] Dependencies installed (`npm install --production`)
- [ ] TypeScript compiled successfully (`npm run build`)
- [ ] `dist/` folder created with compiled code

### Environment Configuration
- [ ] Production `.env` file created
- [ ] All environment variables configured correctly:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] DATABASE_URL
  - [ ] REDIS_URL
  - [ ] JWT_SECRET (strong, min 32 characters)
  - [ ] JWT_REFRESH_SECRET (strong, min 32 characters)
  - [ ] OPENAI_API_KEY
  - [ ] CARDANO_NETWORK (Preprod or Mainnet)
  - [ ] BLOCKFROST_API_KEY
  - [ ] BLOCKFROST_URL
  - [ ] WHATSAPP_API_URL
  - [ ] WHATSAPP_ACCESS_TOKEN
  - [ ] WHATSAPP_VERIFY_TOKEN
  - [ ] WHATSAPP_PHONE_NUMBER_ID
  - [ ] ENCRYPTION_KEY (32 characters)
  - [ ] PORT=3000
  - [ ] NODE_ENV=production
- [ ] `.env` file permissions set to 600
- [ ] `.env` added to `.gitignore`

### PM2 Configuration
- [ ] `ecosystem.config.js` configured
- [ ] Logs directory created (`mkdir logs`)
- [ ] Application started with PM2 (`pm2 start ecosystem.config.js`)
- [ ] PM2 startup script configured (`pm2 startup systemd`)
- [ ] PM2 configuration saved (`pm2 save`)
- [ ] Application running without errors (`pm2 status`)

---

## 🌐 Web Server Configuration

### Nginx Setup
- [ ] Nginx configuration created at `/etc/nginx/sites-available/trustbridge-api`
- [ ] Domain name updated in config file
- [ ] Symbolic link created to sites-enabled
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded (`systemctl reload nginx`)
- [ ] API accessible via HTTP (before SSL)

### SSL Certificate
- [ ] Certbot SSL certificate obtained (`certbot --nginx -d api.yourdomain.com`)
- [ ] HTTPS working correctly
- [ ] HTTP to HTTPS redirect enabled
- [ ] Auto-renewal tested (`certbot renew --dry-run`)
- [ ] Certificate expiry in 90 days

---

## ✅ Testing & Validation

### API Endpoints
- [ ] Health check: `curl https://api.yourdomain.com/health`
- [ ] Get currencies: `curl https://api.yourdomain.com/api/exchange/currencies`
- [ ] Get exchange rate: `curl "https://api.yourdomain.com/api/exchange/rate?from=USD&to=IDR"`
- [ ] Get conversion path: `curl "https://api.yourdomain.com/api/exchange/path?from=USD&to=IDR"`
- [ ] Transfer history: `curl https://api.yourdomain.com/api/transfer/history`

### Database Connectivity
- [ ] Supabase connection successful (check logs)
- [ ] Database queries working
- [ ] Tables accessible

### Redis Connectivity
- [ ] Redis connection successful (check logs)
- [ ] Cache operations working

### WhatsApp Integration
- [ ] Webhook URL configured in Meta Developer Console
- [ ] Webhook endpoint accessible: `https://api.yourdomain.com/api/whatsapp/webhook`
- [ ] Verify token matches configuration
- [ ] Test message received and processed

### Blockchain Integration
- [ ] Blockfrost API accessible
- [ ] Cardano network connection working (Preprod or Mainnet)
- [ ] Mock tokens policy IDs configured

---

## 📊 Monitoring & Logs

### Application Monitoring
- [ ] PM2 monitoring dashboard (`pm2 monit`)
- [ ] Application logs accessible (`pm2 logs trustbridge-api`)
- [ ] Error logs being written to `logs/err.log`
- [ ] Output logs being written to `logs/out.log`
- [ ] No critical errors in logs

### Server Monitoring
- [ ] Nginx access logs: `/var/log/nginx/trustbridge-api-access.log`
- [ ] Nginx error logs: `/var/log/nginx/trustbridge-api-error.log`
- [ ] System resource monitoring (htop, free -h, df -h)
- [ ] Disk space sufficient (>20% free)
- [ ] Memory usage normal (<80%)

### Uptime Monitoring (Optional)
- [ ] UptimeRobot configured
- [ ] Pingdom configured
- [ ] Status page created
- [ ] Alert notifications configured (email, Slack, etc.)

---

## 🔗 Integration Configuration

### Frontend/Website
- [ ] API base URL updated to production domain
- [ ] Environment variable: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- [ ] CORS configured in backend to allow frontend domain
- [ ] Frontend deployed and tested

### WhatsApp Bot
- [ ] Bot code updated with production API URL
- [ ] Webhook verified and active
- [ ] Test messages sent successfully
- [ ] Automated responses working

### Postman Collection
- [ ] Base URL updated to production domain
- [ ] Collection imported and tested
- [ ] All endpoints returning expected responses
- [ ] Saved responses updated with production data

---

## 🔐 Security Hardening

### Application Security
- [ ] JWT secrets are strong and unique
- [ ] Encryption keys are 32+ characters
- [ ] API keys not exposed in logs or responses
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers enabled
- [ ] CORS properly configured

### Server Security
- [ ] SSH root login disabled
- [ ] SSH password authentication disabled
- [ ] UFW firewall active with minimal open ports
- [ ] Fail2ban configured (optional)
- [ ] Automatic security updates enabled
- [ ] Regular backup schedule configured

---

## 💾 Backup Strategy

### Database Backups
- [ ] Supabase automatic backups enabled
- [ ] Or manual PostgreSQL backup script configured
- [ ] Backup retention policy set (7 days minimum)
- [ ] Backup restoration tested

### Application Backups
- [ ] Code repository backed up (Git)
- [ ] Environment variables documented securely
- [ ] PM2 ecosystem config backed up
- [ ] Nginx configuration backed up

### Recovery Plan
- [ ] Disaster recovery procedure documented
- [ ] Restoration steps tested
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined

---

## 📱 Post-Deployment

### Documentation
- [ ] Production URLs documented
- [ ] API endpoints documented
- [ ] Deployment procedure documented
- [ ] Troubleshooting guide created
- [ ] Team members trained

### Maintenance
- [ ] Update schedule defined
- [ ] Deployment script tested (`./deploy.sh`)
- [ ] Rollback procedure documented
- [ ] On-call rotation established (if applicable)

### Performance
- [ ] Response times acceptable (<200ms for most endpoints)
- [ ] No memory leaks observed
- [ ] PM2 cluster mode utilizing all cores
- [ ] Database queries optimized

---

## 🎯 Go-Live Checklist

### Final Validation
- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] All integrations working
- [ ] SSL certificate valid
- [ ] DNS propagated globally
- [ ] Monitoring alerts configured

### Communication
- [ ] Stakeholders notified of go-live
- [ ] Support team briefed
- [ ] Documentation shared
- [ ] Maintenance window scheduled

### Launch
- [ ] Traffic redirected to production
- [ ] Monitor logs for first 30 minutes
- [ ] Test critical user flows
- [ ] Confirm all services operational

---

## 📞 Support Contacts

- **VPS Provider Support**: _________________
- **Domain Registrar Support**: _________________
- **Supabase Support**: support@supabase.io
- **Blockfrost Support**: support@blockfrost.io
- **Meta WhatsApp Support**: _________________

---

## 🚨 Emergency Procedures

### If Application Crashes
```bash
pm2 restart trustbridge-api
pm2 logs trustbridge-api --lines 100
```

### If Nginx Fails
```bash
sudo systemctl restart nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### If Database Connection Lost
- Check Supabase status page
- Verify DATABASE_URL in .env
- Check network connectivity
- Restart application: `pm2 restart trustbridge-api`

### If Redis Fails
```bash
sudo systemctl restart redis-server
redis-cli ping
```

---

## ✨ Deployment Complete!

Once all items are checked, your TrustBridge backend is production-ready! 🎉

**Remember:**
- Monitor logs for the first 24 hours
- Set up automated alerts
- Keep this checklist updated
- Document any issues and resolutions

**Good luck with your launch!** 🚀
