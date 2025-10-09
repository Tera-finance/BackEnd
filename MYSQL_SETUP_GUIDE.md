# MySQL Setup and be-offchain Integration Guide

## 📋 Overview

This guide explains how to set up MySQL database and integrate the be-offchain scripts to save Cardano blockchain data (token deployments, mints, and swaps) into the backend database.

## 🗄️ MySQL Database Setup

### 1. Install MySQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Docker:**
```bash
docker run --name trustbridge-mysql \
  -e MYSQL_ROOT_PASSWORD=your_root_password \
  -e MYSQL_DATABASE=trustbridge \
  -e MYSQL_USER=trustbridge \
  -e MYSQL_PASSWORD=your_password \
  -p 3306:3306 \
  -d mysql:8.0
```

### 2. Create Database and User

```sql
-- Login to MySQL as root
sudo mysql -u root -p

-- Create database
CREATE DATABASE trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user and grant privileges
CREATE USER 'trustbridge'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON trustbridge.* TO 'trustbridge'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Import Schema

```bash
# Navigate to backend directory
cd backend-trustbridge

# Import the schema
mysql -u trustbridge -p trustbridge < sql/mysql-schema.sql

# Verify tables were created
mysql -u trustbridge -p trustbridge -e "SHOW TABLES;"
```

Expected output:
```
+----------------------------+
| Tables_in_trustbridge      |
+----------------------------+
| cardano_mints              |
| cardano_swaps              |
| cardano_tokens             |
| exchange_rates_cache       |
| schema_version             |
| transactions               |
| users                      |
+----------------------------+
```

### 4. Configure Backend Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env
```

Update MySQL configuration:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=your_secure_password
DB_NAME=trustbridge
```

### 5. Install Dependencies and Start Backend

```bash
# Install dependencies
npm install

# Start backend in development mode
npm run dev
```

Expected output:
```
✅ Connected to MySQL database
✅ Connected to Redis
🚀 TrustBridge Backend running on port 3000
🌍 Environment: development
🔗 Cardano Network: Preprod
💾 Database: MySQL
```

## 🔗 be-offchain Integration

The `be-offchain` scripts need to save blockchain data to the backend database. Here's how to integrate them:

### Method 1: Direct Database Connection (Recommended)

Create a shared database module in `be-offchain/`:

**be-offchain/database.ts:**
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

export async function saveMintTransaction(data: {
  policyId: string;
  amount: bigint;
  recipientAddress: string;
  txHash: string;
}) {
  // Get token ID from policy ID
  const [rows] = await pool.execute(
    'SELECT id FROM cardano_tokens WHERE policy_id = ?',
    [data.policyId]
  ) as any;
  
  if (rows.length === 0) {
    throw new Error(`Token with policy ID ${data.policyId} not found`);
  }
  
  const tokenId = rows[0].id;
  const cardanoScanUrl = `https://preprod.cardanoscan.io/transaction/${data.txHash}`;
  
  const sql = `
    INSERT INTO cardano_mints 
    (token_id, amount, recipient_address, tx_hash, cardano_scan_url)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  await pool.execute(sql, [
    tokenId,
    data.amount.toString(),
    data.recipientAddress,
    data.txHash,
    cardanoScanUrl
  ]);
  
  // Update total supply
  await pool.execute(
    'UPDATE cardano_tokens SET total_supply = total_supply + ? WHERE id = ?',
    [data.amount.toString(), tokenId]
  );
  
  console.log(`✅ Saved mint transaction to database`);
}

export async function saveSwapTransaction(data: {
  fromPolicyId: string;
  toPolicyId: string;
  fromAmount: bigint;
  toAmount: bigint;
  exchangeRate: number;
  senderAddress: string;
  recipientAddress: string;
  txHash: string;
  swapType: 'DIRECT' | 'VIA_HUB';
  hubPolicyId?: string;
}) {
  // Get token IDs
  const [fromRows] = await pool.execute(
    'SELECT id FROM cardano_tokens WHERE policy_id = ?',
    [data.fromPolicyId]
  ) as any;
  
  const [toRows] = await pool.execute(
    'SELECT id FROM cardano_tokens WHERE policy_id = ?',
    [data.toPolicyId]
  ) as any;
  
  if (fromRows.length === 0 || toRows.length === 0) {
    throw new Error('Token not found');
  }
  
  let hubTokenId = null;
  if (data.swapType === 'VIA_HUB' && data.hubPolicyId) {
    const [hubRows] = await pool.execute(
      'SELECT id FROM cardano_tokens WHERE policy_id = ?',
      [data.hubPolicyId]
    ) as any;
    hubTokenId = hubRows[0]?.id || null;
  }
  
  const cardanoScanUrl = `https://preprod.cardanoscan.io/transaction/${data.txHash}`;
  
  const sql = `
    INSERT INTO cardano_swaps 
    (from_token_id, to_token_id, from_amount, to_amount, exchange_rate, 
     sender_address, recipient_address, tx_hash, cardano_scan_url, swap_type, hub_token_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  await pool.execute(sql, [
    fromRows[0].id,
    toRows[0].id,
    data.fromAmount.toString(),
    data.toAmount.toString(),
    data.exchangeRate,
    data.senderAddress,
    data.recipientAddress,
    data.txHash,
    cardanoScanUrl,
    data.swapType,
    hubTokenId
  ]);
  
  console.log(`✅ Saved swap transaction to database`);
}
```

### Method 2: HTTP API Integration

Alternatively, call backend API endpoints from be-offchain scripts:

**be-offchain/api-client.ts:**
```typescript
import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function saveTokenDeployment(data: any) {
  try {
    const response = await axios.post(`${API_URL}/cardano/tokens`, data);
    console.log('✅ Token saved to database:', response.data);
  } catch (error) {
    console.error('❌ Failed to save token:', error);
  }
}

export async function saveMint(data: any) {
  try {
    const response = await axios.post(`${API_URL}/cardano/mints`, data);
    console.log('✅ Mint saved to database:', response.data);
  } catch (error) {
    console.error('❌ Failed to save mint:', error);
  }
}

export async function saveSwap(data: any) {
  try {
    const response = await axios.post(`${API_URL}/cardano/swaps`, data);
    console.log('✅ Swap saved to database:', response.data);
  } catch (error) {
    console.error('❌ Failed to save swap:', error);
  }
}
```

### Update be-offchain Scripts

**Example: mint-tokens.ts**
```typescript
import { saveDeployedToken, saveMintTransaction } from './database';
// ... existing imports

async function mintTokens() {
  // ... existing mint logic
  
  const txHash = await submitTx(/* ... */);
  
  // Save to database
  await saveMintTransaction({
    policyId: 'your-policy-id',
    amount: BigInt(1000000),
    recipientAddress: recipientAddr,
    txHash: txHash
  });
  
  console.log(`✅ Minted tokens and saved to database`);
}
```

**Example: swap-tokens.ts**
```typescript
import { saveSwapTransaction } from './database';
// ... existing imports

async function swapTokens() {
  // ... existing swap logic
  
  const txHash = await submitTx(/* ... */);
  
  // Save to database
  await saveSwapTransaction({
    fromPolicyId: 'policy-id-1',
    toPolicyId: 'policy-id-2',
    fromAmount: BigInt(100),
    toAmount: BigInt(95),
    exchangeRate: 0.95,
    senderAddress: senderAddr,
    recipientAddress: recipientAddr,
    txHash: txHash,
    swapType: 'VIA_HUB',
    hubPolicyId: 'mockADA-policy-id'
  });
  
  console.log(`✅ Swapped tokens and saved to database`);
}
```

## 📊 Verify Data Storage

### Query Stored Tokens
```bash
mysql -u trustbridge -p trustbridge -e "SELECT * FROM cardano_tokens;"
```

### Query Mint Transactions
```bash
mysql -u trustbridge -p trustbridge -e "SELECT * FROM cardano_mints ORDER BY created_at DESC LIMIT 5;"
```

### Query Swap Transactions
```bash
mysql -u trustbridge -p trustbridge -e "SELECT * FROM cardano_swaps ORDER BY created_at DESC LIMIT 5;"
```

### Using Views
```bash
# View active tokens
mysql -u trustbridge -p trustbridge -e "SELECT * FROM v_active_tokens;"

# View recent swaps
mysql -u trustbridge -p trustbridge -e "SELECT * FROM v_recent_swaps LIMIT 10;"

# View transaction history
mysql -u trustbridge -p trustbridge -e "SELECT * FROM v_transaction_history LIMIT 10;"
```

## 🔧 Troubleshooting

### Connection Errors

**Error:** `ER_ACCESS_DENIED_ERROR: Access denied for user`
- Check username/password in `.env`
- Verify user privileges: `SHOW GRANTS FOR 'trustbridge'@'localhost';`

**Error:** `ECONNREFUSED: Connection refused`
- MySQL not running: `sudo systemctl status mysql`
- Start MySQL: `sudo systemctl start mysql`

**Error:** `ER_BAD_DB_ERROR: Unknown database`
- Database not created: `CREATE DATABASE trustbridge;`
- Check database name in `.env`

### Migration from Supabase

If you have existing data in Supabase:

```bash
# Export from Supabase (PostgreSQL)
pg_dump -h your-supabase-host -U postgres -d postgres --table=users --data-only > users.sql
pg_dump -h your-supabase-host -U postgres -d postgres --table=transactions --data-only > transactions.sql

# Convert PostgreSQL SQL to MySQL format
# (adjust SERIAL, TIMESTAMP, BOOLEAN, UUID types)

# Import to MySQL
mysql -u trustbridge -p trustbridge < users.sql
mysql -u trustbridge -p trustbridge < transactions.sql
```

## 📝 Environment Variables Checklist

**be-offchain/.env:**
```env
# Database connection (if using direct connection)
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=your_secure_password
DB_NAME=trustbridge

# Or backend API URL (if using HTTP)
BACKEND_URL=http://localhost:3000/api

# Cardano configuration
CARDANO_NETWORK=Preprod
BLOCKFROST_API_KEY=your-blockfrost-api-key
```

**backend-trustbridge/.env:**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=your_secure_password
DB_NAME=trustbridge

# Redis
REDIS_URL=redis://localhost:6379

# Cardano
CARDANO_NETWORK=Preprod
BLOCKFROST_API_KEY=your-blockfrost-api-key
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
```

## 🚀 Next Steps

1. ✅ MySQL installed and configured
2. ✅ Database schema imported
3. ✅ Backend connected to MySQL
4. ✅ be-offchain scripts updated to save data
5. [ ] Test complete flow: deploy → mint → swap
6. [ ] Verify data in database
7. [ ] Deploy to production VPS

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [mysql2 Node.js Driver](https://github.com/sidorares/node-mysql2)
- [Cardano Developer Portal](https://developers.cardano.org/)
- [Backend API Documentation](./API_DOCUMENTATION.md)
