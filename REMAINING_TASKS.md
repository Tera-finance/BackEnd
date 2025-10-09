# Remaining Migration Tasks

## ⚠️ Status: Migration 80% Complete

The core infrastructure has been migrated to MySQL, but several service files still reference the old Supabase implementation and need to be updated.

---

## ✅ Completed Tasks

1. ✅ **package.json** - Removed Supabase/unused dependencies, added mysql2
2. ✅ **src/utils/config.ts** - MySQL configuration, removed unused services
3. ✅ **src/utils/database.ts** - Complete MySQL implementation
4. ✅ **src/index.ts** - MySQL connection test
5. ✅ **.env.example** - New environment variables
6. ✅ **sql/mysql-schema.sql** - Complete MySQL schema
7. ✅ **src/repositories/cardano.repository.ts** - Cardano data operations
8. ✅ **Documentation** - MIGRATION_PLAN.md, MYSQL_SETUP_GUIDE.md, MIGRATION_SUMMARY.md

---

## 🔧 Remaining Tasks

The following files still contain Supabase references and need to be updated to use MySQL:

### **1. Routes**

- **src/routes/auth.routes.ts**
  - Line 5: `import { supabase } from '../utils/database'`
  - Action: Replace Supabase queries with MySQL queries using `query()` and `queryOne()`

- **src/routes/cardano.routes.ts** (if exists)
  - May contain Supabase references
  - Action: Update to use MySQL

- **src/routes/kyc.routes.ts** (if exists)
  - May contain Supabase references
  - Action: Update to use MySQL

- **src/routes/transaction.routes.ts** (if exists)
  - May contain Supabase references
  - Action: Update to use MySQL

### **2. Services**

- **src/services/wallet.service.ts**
  - Lines 2, 16, 27, 45, 73, 88, 102, 108, 133, 149, 176, 188, 194, 211
  - Multiple Supabase queries for wallet operations
  - Action: Rewrite using MySQL queries

- **src/services/transaction.service.ts**
  - Lines 2, 28, 66, 100, 121, 139, 162
  - Multiple Supabase queries for transaction operations
  - Action: Rewrite using MySQL queries

- **src/services/auth.service.ts** (if exists)
  - May contain Supabase Auth references
  - Action: Rewrite with JWT-based authentication

- **src/services/kyc.service.ts** (if exists)
  - May contain Supabase and IPFS references
  - Action: Simplify or remove (KYC integration removed)

- **src/services/whatsapp.service.ts**
  - WhatsApp Business API integration
  - Action: **DELETE** (service removed from architecture)

- **src/services/blockchain.service.ts** (if exists with Polygon)
  - May contain Polygon/Ethereum blockchain references
  - Action: **DELETE** or replace with Cardano-only implementation

- **src/services/ipfs.service.ts** (if exists)
  - IPFS integration for file storage
  - Action: **DELETE** (service removed from architecture)

- **src/services/ai.service.ts** (if exists with OpenAI)
  - May contain OpenAI API references
  - Action: **DELETE** (service removed from architecture)

### **3. Middleware**

- **src/middleware/auth.ts** (if exists)
  - May contain Supabase Auth references
  - Action: Ensure uses JWT-only authentication

### **4. Models/Types**

- **src/models/** (if exists)
  - May contain Prisma or Supabase type definitions
  - Action: Update to match new MySQL types in `database.ts`

---

## 🎯 Recommended Approach

### **Option 1: Manual Update (Recommended for Learning)**

Update each file individually:

1. Read the file to understand current Supabase usage
2. Rewrite queries using MySQL helper functions:
   - `query<T>(sql, params)` - For multiple rows
   - `queryOne<T>(sql, params)` - For single row
3. Update imports to use MySQL types
4. Test each service after updating

**Example transformation:**

**Before (Supabase):**
```typescript
import { supabase } from '../utils/database';

const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

**After (MySQL):**
```typescript
import { queryOne, User } from '../utils/database';

const user = await queryOne<User>(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
```

### **Option 2: Gradual Migration**

Keep services that work with Supabase for now, only update critical paths:

1. Focus on Cardano-related functionality first
2. Use new `cardano.repository.ts` for blockchain data
3. Gradually update other services as needed

### **Option 3: Simplified Backend**

Since many services were removed (WhatsApp, IPFS, OpenAI, Polygon), you might want to:

1. **Delete unused service files completely**
2. **Keep only essential services:**
   - `auth.service.ts` (JWT authentication)
   - `transaction.service.ts` (transfer operations)
   - `cardano-wallet.service.ts` (Cardano wallets)
   - `cardano-contract.service.ts` (smart contracts)
   - `exchange.service.ts` (exchange rates)

3. **Rewrite kept services with MySQL**

---

## 📝 Conversion Pattern Reference

### **Supabase SELECT → MySQL SELECT**

```typescript
// BEFORE: Supabase
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('whatsapp_number', phone);

if (error) throw error;
const user = data[0];

// AFTER: MySQL
const user = await queryOne<User>(
  'SELECT * FROM users WHERE whatsapp_number = ?',
  [phone]
);
```

### **Supabase INSERT → MySQL INSERT**

```typescript
// BEFORE: Supabase
const { data: newUser, error } = await supabase
  .from('users')
  .insert({
    whatsapp_number: phone,
    country_code: countryCode,
    status: 'PENDING_KYC'
  })
  .select()
  .single();

if (error) throw error;

// AFTER: MySQL
await query(
  `INSERT INTO users (id, whatsapp_number, country_code, status) 
   VALUES (UUID(), ?, ?, 'PENDING_KYC')`,
  [phone, countryCode]
);

const newUser = await queryOne<User>(
  'SELECT * FROM users WHERE whatsapp_number = ?',
  [phone]
);
```

### **Supabase UPDATE → MySQL UPDATE**

```typescript
// BEFORE: Supabase
const { data, error } = await supabase
  .from('transactions')
  .update({ 
    status: 'COMPLETED',
    blockchain_tx_hash: txHash 
  })
  .eq('id', transactionId)
  .select()
  .single();

// AFTER: MySQL
await query(
  `UPDATE transactions 
   SET status = 'COMPLETED', 
       blockchain_tx_hash = ?,
       completed_at = NOW()
   WHERE id = ?`,
  [txHash, transactionId]
);

const updatedTransaction = await queryOne<Transaction>(
  'SELECT * FROM transactions WHERE id = ?',
  [transactionId]
);
```

### **Supabase DELETE → MySQL DELETE**

```typescript
// BEFORE: Supabase
const { error } = await supabase
  .from('wallets')
  .delete()
  .eq('id', walletId);

// AFTER: MySQL
await query(
  'DELETE FROM wallets WHERE id = ?',
  [walletId]
);
```

---

## 🧪 Testing After Updates

After updating each service:

```bash
# 1. Check for TypeScript errors
npm run build

# 2. Start the server
npm run dev

# 3. Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/cardano/tokens

# 4. Check database
mysql -u trustbridge -p trustbridge -e "SELECT * FROM users;"
```

---

## ⏭️ Next Steps

Choose one of the following approaches:

### **Approach A: Complete Full Migration Now**
1. Update all services to MySQL (2-4 hours of work)
2. Delete unused services
3. Full testing
4. Production deployment

### **Approach B: Phased Migration**
1. Delete unused services immediately
2. Update critical services (auth, transaction)
3. Leave wallet service for later
4. Gradually complete migration

### **Approach C: Fresh Start (Fastest)**
1. Keep `src/utils/`, `src/repositories/`, `src/routes/cardano.routes.ts`
2. Delete all Supabase-dependent services
3. Rewrite only essential services from scratch
4. Focus on Cardano functionality

---

## 🚀 When Migration is Complete

After all Supabase references are removed:

1. ✅ All TypeScript compilation errors fixed
2. ✅ Server starts without errors
3. ✅ MySQL connection successful
4. ✅ Cardano blockchain data can be saved and retrieved
5. ✅ API endpoints working
6. ✅ be-offchain integration complete
7. ✅ Ready for production deployment

---

## 📋 Quick Command Summary

```bash
# Find remaining Supabase references
grep -r "supabase" src/

# Find remaining IPFS references
grep -r "ipfs" src/

# Find remaining OpenAI references
grep -r "openai" src/

# Find remaining Polygon/Ethers references
grep -r "ethers\|polygon" src/

# Test backend compilation
npm run build

# Start backend
npm run dev

# Check MySQL connection
mysql -u trustbridge -p -e "USE trustbridge; SHOW TABLES;"
```

---

## 💡 Recommendation

**I recommend Approach C: Fresh Start** for the fastest path forward:

1. Your current backend has a lot of services you don't need
2. Starting fresh with only MySQL + Cardano will be cleaner
3. You can reuse the working parts (utils, repositories, cardano routes)
4. Less time debugging old code
5. Cleaner codebase for production

Would you like me to help implement Approach C?
