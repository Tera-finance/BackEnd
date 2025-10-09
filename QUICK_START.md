# 🚀 Quick Start Guide

## Backend is Ready! Just 3 Steps to Go Live

### ✅ Status
- Backend code: **READY** ✅
- TypeScript compilation: **SUCCESS** ✅
- Server starts: **SUCCESS** ✅
- MySQL connection: **Needs Setup** ⏳

---

## Step 1: Set Up MySQL (5 minutes)

### Option A: Local MySQL

```bash
# Install MySQL
sudo apt install mysql-server  # Ubuntu/Debian
# OR
brew install mysql  # macOS

# Start MySQL
sudo systemctl start mysql

# Create database and user
sudo mysql -u root -p
```

**Run in MySQL:**
```sql
CREATE DATABASE trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trustbridge'@'localhost' IDENTIFIED BY 'mySecurePassword123';
GRANT ALL PRIVILEGES ON trustbridge.* TO 'trustbridge'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Import schema:**
```bash
cd backend-trustbridge
mysql -u trustbridge -p trustbridge < sql/mysql-schema.sql
```

### Option B: Docker MySQL (Faster)

```bash
docker run --name trustbridge-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass123 \
  -e MYSQL_DATABASE=trustbridge \
  -e MYSQL_USER=trustbridge \
  -e MYSQL_PASSWORD=mySecurePassword123 \
  -p 3306:3306 \
  -d mysql:8.0

# Wait 10 seconds for MySQL to start
sleep 10

# Import schema
docker exec -i trustbridge-mysql mysql -u trustbridge -pmySecurePassword123 trustbridge < sql/mysql-schema.sql
```

---

## Step 2: Configure Environment (1 minute)

```bash
cd backend-trustbridge

# Create .env file
cat > .env << 'EOF'
# Server
PORT=3000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=mySecurePassword123
DB_NAME=trustbridge

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too

# Cardano
CARDANO_NETWORK=Preprod
BLOCKFROST_API_KEY=your-blockfrost-api-key
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# Exchange Rates (optional - uses fallback if not set)
EXCHANGE_RATE_API_KEY=
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Make sure to update DB_PASSWORD with your actual MySQL password
nano .env  # or use your favorite editor
```

---

## Step 3: Start Backend (30 seconds)

```bash
# Start the backend
npx nodemon --watch src --exec ts-node src/index.ts
```

**Expected output:**
```
✅ Connected to MySQL database
✅ Connected to Redis
🚀 TrustBridge Backend running on port 3000
🌍 Environment: development
🔗 Cardano Network: Preprod
💾 Database: MySQL
```

---

## ✅ Verify It's Working

### Test 1: Health Check
```bash
curl http://localhost:3000/
```

**Expected:**
```json
{
  "message": "TrustBridge Backend API",
  "version": "1.0.0",
  "status": "healthy",
  "timestamp": "2025-10-09T..."
}
```

### Test 2: Login/Register
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "whatsappNumber": "+6281234567890",
    "countryCode": "ID"
  }'
```

**Expected:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "whatsappNumber": "+6281234567890",
    "status": "PENDING_KYC"
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Test 3: Exchange Rates
```bash
curl http://localhost:3000/api/exchange/rates/USD/IDR
```

**Expected:**
```json
{
  "success": true,
  "rate": {
    "from": "USD",
    "to": "IDR",
    "rate": 15000,
    "timestamp": 1728484800000
  }
}
```

---

## 🔗 Integrate be-offchain Scripts

### Add Database Module to be-offchain

**Create: `be-offchain/database.ts`**
```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'trustbridge',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trustbridge'
});

export async function saveDeployedToken(data: {
  tokenName: string;
  tokenSymbol: string;
  policyId: string;
  assetUnit: string;
  decimals: number;
  totalSupply: bigint;
  deploymentTxHash: string;
}) {
  const sql = `
    INSERT INTO cardano_tokens 
    (token_name, token_symbol, policy_id, asset_unit, decimals, total_supply, 
     deployment_tx_hash, cardano_network)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Preprod')
  `;
  
  await pool.execute(sql, [
    data.tokenName,
    data.tokenSymbol,
    data.policyId,
    data.assetUnit,
    data.decimals,
    data.totalSupply.toString(),
    data.deploymentTxHash
  ]);
  
  console.log(`✅ Saved token ${data.tokenSymbol} to database`);
}

// Add saveMintTransaction and saveSwapTransaction
// See MYSQL_SETUP_GUIDE.md for complete code
```

### Update be-offchain Scripts

**In your deploy/mint/swap scripts:**
```typescript
import { saveDeployedToken, saveMintTransaction, saveSwapTransaction } from './database';

// After successful deployment
await saveDeployedToken({
  tokenName: 'Mock ADA',
  tokenSymbol: 'mockADA',
  policyId: policyId,
  assetUnit: assetUnit,
  decimals: 6,
  totalSupply: 1000000000000n,
  deploymentTxHash: txHash
});
```

---

## 📊 Database Quick Reference

### View Tables
```bash
mysql -u trustbridge -p trustbridge -e "SHOW TABLES;"
```

### View Tokens
```bash
mysql -u trustbridge -p trustbridge -e "SELECT * FROM cardano_tokens;"
```

### View Mints
```bash
mysql -u trustbridge -p trustbridge -e "SELECT * FROM cardano_mints ORDER BY created_at DESC LIMIT 5;"
```

### View Swaps
```bash
mysql -u trustbridge -p trustbridge -e "SELECT * FROM cardano_swaps ORDER BY created_at DESC LIMIT 5;"
```

### Using Views
```bash
mysql -u trustbridge -p trustbridge -e "SELECT * FROM v_active_tokens;"
mysql -u trustbridge -p trustbridge -e "SELECT * FROM v_recent_swaps LIMIT 10;"
```

---

## 🐛 Troubleshooting

### MySQL Connection Error
```
❌ Access denied for user 'trustbridge'@'localhost'
```

**Fix:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Reset password
sudo mysql -u root -p
ALTER USER 'trustbridge'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;

# Update .env
nano .env  # Update DB_PASSWORD
```

### Redis Connection Error
```
❌ Redis connection failed
```

**Fix:**
```bash
# Install Redis
sudo apt install redis-server  # Ubuntu
brew install redis  # macOS

# Start Redis
sudo systemctl start redis
brew services start redis
```

### Port Already in Use
```
❌ Port 3000 already in use
```

**Fix:**
```bash
# Change port in .env
echo "PORT=3001" >> .env

# Or kill existing process
lsof -ti:3000 | xargs kill
```

---

## 📁 Important Files

- **Configuration:** `backend-trustbridge/.env`
- **Database Schema:** `backend-trustbridge/sql/mysql-schema.sql`
- **Main Entry:** `backend-trustbridge/src/index.ts`
- **Routes:** `backend-trustbridge/src/routes/*.ts`
- **Services:** `backend-trustbridge/src/services/*.ts`
- **Cardano Data:** `backend-trustbridge/src/repositories/cardano.repository.ts`

---

## 📚 Full Documentation

- **FRESH_START_COMPLETE.md** - What was done & current status
- **MYSQL_SETUP_GUIDE.md** - Complete MySQL setup & be-offchain integration
- **MIGRATION_SUMMARY.md** - Architecture changes & benefits
- **VPS_DEPLOYMENT_GUIDE.md** - Production deployment

---

## ✅ Ready for Production?

Before deploying:

1. ✅ MySQL database set up
2. ✅ Backend starts without errors
3. ✅ All API endpoints tested
4. ✅ be-offchain scripts integrated
5. ✅ Security: Change all default passwords/secrets
6. ✅ Environment: Set `NODE_ENV=production`
7. ✅ VPS: Follow VPS_DEPLOYMENT_GUIDE.md

---

**Need Help?** Check the documentation files or the error logs!

**Everything Working?** 🎉 You're ready to go! Start deploying tokens and minting!
