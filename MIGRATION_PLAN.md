# 🔄 Migration Plan: Supabase → MySQL + Simplified Backend

## 📋 Summary of Changes

### 1. Database Migration
- ✅ Remove Supabase dependency
- ✅ Use MySQL instead of PostgreSQL
- ✅ Add new tables for Cardano blockchain data (tokens, mints, swaps)

### 2. Remove Unused Services
- ❌ IPFS (not needed)
- ❌ Polygon blockchain (not needed)
- ❌ OpenAI (not needed)
- ❌ WhatsApp Business API (not needed)
- ❌ Indodax API (not needed)

### 3. Add Cardano Blockchain Data Storage
- ✅ Store deployed token information (policy IDs)
- ✅ Store mint transactions
- ✅ Store swap transactions
- ✅ Link to exchange rates and transfers

### 4. Simplified Architecture
```
Backend (backend-trustbridge)
├── MySQL Database
│   ├── users
│   ├── transactions
│   ├── cardano_tokens (NEW)
│   ├── cardano_mints (NEW)
│   └── cardano_swaps (NEW)
├── Exchange Rate API (keep)
├── Transfer API (keep)
└── Cardano Integration (simplified)
```

---

## 🗄️ New MySQL Schema

### Existing Tables (Modified for MySQL)
- `users` - User accounts
- `transactions` - Transfer records

### New Tables for Cardano Data
- `cardano_tokens` - Deployed token information
- `cardano_mints` - Mint transaction records
- `cardano_swaps` - Swap transaction records

---

## 📦 Package Changes

### Remove:
- `@supabase/supabase-js`
- `pg` (PostgreSQL)
- `ipfs-http-client`
- `ethers` (Ethereum/Polygon)
- `openai`

### Add:
- `mysql2` (MySQL driver)

### Keep:
- `express`
- `axios` (for exchange rates)
- `node-cache` (for caching)
- `jsonwebtoken` (auth)
- `helmet`, `cors` (security)
- Cardano libraries (for blockchain)

---

## 🔧 Environment Variables

### Remove from .env:
```bash
# Remove these
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
POLYGON_RPC_URL
POLYGON_TESTNET_RPC_URL
PRIVATE_KEY
OPENAI_API_KEY
IPFS_API_URL
WHATSAPP_API_URL
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
WHATSAPP_PHONE_NUMBER_ID
INDODAX_API_URL
```

### Keep/Add:
```bash
# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=trustbridge

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
ENCRYPTION_KEY=your-32-character-key

# Cardano (keep)
CARDANO_NETWORK=Preprod
BLOCKFROST_API_KEY=your-blockfrost-key
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# Redis (optional - for caching)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚀 Implementation Steps

1. ✅ Install MySQL driver
2. ✅ Create MySQL schema with Cardano tables
3. ✅ Update database connection (database.ts)
4. ✅ Update config (config.ts)
5. ✅ Create Cardano data repositories
6. ✅ Update .env.example
7. ✅ Remove unused dependencies
8. ✅ Update deployment docs

---

## 📊 Data Flow

### Token Deployment (be-offchain → backend database)
```
1. Run: npm run deploy (in be-offchain)
2. Script mints tokens on Cardano
3. Save to MySQL:
   - Token name (mockADA, mockUSDC, etc.)
   - Policy ID
   - Asset unit
   - Decimals
   - Deployment tx hash
   - Timestamp
```

### Mint Transaction (be-offchain → backend database)
```
1. Run: mint script
2. Mint tokens on Cardano
3. Save to MySQL:
   - Token ID (FK)
   - Amount minted
   - Recipient address
   - Tx hash
   - Timestamp
```

### Swap Transaction (be-offchain → backend database)
```
1. Run: swap script
2. Swap on Cardano
3. Save to MySQL:
   - From token ID (FK)
   - To token ID (FK)
   - Amount in
   - Amount out
   - Exchange rate
   - Tx hash
   - Timestamp
```

### Transfer API (backend uses stored data)
```
1. User requests transfer
2. Backend queries cardano_tokens for policy IDs
3. Calculates conversion path
4. Returns response with blockchain details
```

---

## ✅ What This Achieves

1. **Simplified Backend**: Only essential services (MySQL, Exchange Rates, Cardano)
2. **Blockchain Data Storage**: All Cardano operations saved in MySQL
3. **No External Dependencies**: No Supabase, IPFS, WhatsApp, etc.
4. **Easy Deployment**: Just backend-trustbridge with MySQL
5. **API Integration**: Frontend/bots can query blockchain data from MySQL

Ready to implement? I'll start with the changes!
