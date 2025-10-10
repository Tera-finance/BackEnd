# TrustBridge Database Summary

Complete database structure and deployment information for VPS setup.

## 📊 Database Overview

**Database Name:** `trustbridge`
**Character Set:** `utf8mb4`
**Collation:** `utf8mb4_unicode_ci`
**Schema Version:** 2.0

---

## 📁 Database Files

### SQL Files Location: `sql/`

1. **`complete-setup.sql`** - Full database schema
   - All table definitions
   - Indexes and foreign keys
   - Views for easy querying
   - Ready for fresh installation

2. **`initial-data.sql`** - Token and test data
   - 7 Cardano tokens (mockADA, mockIDRX, etc.)
   - Actual policy IDs and asset units
   - Run after complete-setup.sql

3. **`useful-queries.sql`** - Common queries
   - Statistics and monitoring
   - Debugging queries
   - Maintenance scripts

---

## 🗂️ Database Structure

### Tables (8 main tables)

#### 1. **users**
User accounts from WhatsApp authentication
```
id (UUID) | whatsapp_number | country_code | status | kyc_nft_token_id | created_at | updated_at
```
- **Primary Key:** id
- **Unique:** whatsapp_number
- **Status:** PENDING_KYC, VERIFIED, SUSPENDED

#### 2. **transfers** ⭐ Main table
Transfer records from WhatsApp bot and frontend
```
id | user_id | whatsapp_number | status | payment_method | sender_currency | sender_amount |
recipient_name | recipient_currency | recipient_expected_amount | recipient_bank | recipient_account |
ada_amount | exchange_rate | fee_percentage | fee_amount | uses_mock_token | mock_token |
policy_id | tx_hash | blockchain_tx_url | card_number_encrypted | card_last4 | payment_link |
created_at | updated_at | paid_at | completed_at
```
- **Primary Key:** id (VARCHAR 50) - e.g., TXN-1760104993148-in6w5vusm
- **Status:** pending, paid, processing, completed, failed, cancelled
- **Payment Methods:** WALLET, MASTERCARD
- **Indexes:** whatsapp_number, user_id, status, tx_hash

#### 3. **transactions** (Legacy)
Old transaction table - kept for compatibility
```
id | sender_id | recipient_phone | source_currency | target_currency | source_amount |
target_amount | exchange_rate | fee_amount | total_amount | status | blockchain_tx_hash |
recipient_bank_account | created_at | completed_at
```

#### 4. **cardano_tokens**
Deployed Cardano tokens information
```
id | token_name | token_symbol | policy_id | asset_unit | decimals | total_supply |
deployment_tx_hash | cardano_network | deployed_at | is_active | description
```
- **Contains:** mockADA, mockIDRX, mockUSDC, mockCNHT, mockEUROC, mockJPYC, mockMXNT
- **Network:** Preprod (testnet)

#### 5. **cardano_mints**
Mint transaction records
```
id | token_id | amount | recipient_address | tx_hash | cardano_scan_url |
redeemer_data | created_at
```

#### 6. **cardano_swaps**
Swap transaction records
```
id | from_token_id | to_token_id | from_amount | to_amount | exchange_rate |
sender_address | recipient_address | tx_hash | cardano_scan_url | swap_type |
hub_token_id | created_at
```

#### 7. **exchange_rates_cache**
Cached exchange rates
```
id | from_currency | to_currency | rate | source | cached_at | expires_at
```

#### 8. **schema_version**
Database version tracking
```
version | description | applied_at
```

---

## 🔍 Views (3 helpful views)

### 1. **v_active_tokens**
Active tokens with mint statistics
```sql
SELECT * FROM v_active_tokens;
```

### 2. **v_recent_swaps**
Recent token swaps with details
```sql
SELECT * FROM v_recent_swaps LIMIT 10;
```

### 3. **v_transaction_history**
Combined transaction history
```sql
SELECT * FROM v_transaction_history WHERE whatsapp_number = '+6281234567890';
```

---

## 🪙 Token Data

Current tokens in database:

| Token Name | Symbol | Policy ID (first 16 chars) | Decimals | Network |
|-----------|--------|---------------------------|----------|---------|
| mockADA   | ADA    | 1c05bdd719318cef...       | 6        | Preprod |
| mockIDRX  | IDRX   | 5c9a67cc3c085c4a...       | 6        | Preprod |
| mockUSDC  | USDC   | 4cbb15ff52c7459c...       | 6        | Preprod |
| mockCNHT  | CNHT   | c7bdad55621e968c...       | 6        | Preprod |
| mockEUROC | EUROC  | f766f151787a9891...       | 6        | Preprod |
| mockJPYC  | JPYC   | 7725300e8d414e0f...       | 2        | Preprod |
| mockMXNT  | MXNT   | c73682653bd1ff61...       | 6        | Preprod |

**Note:** mockADA is the hub token - all conversions go through it.

---

## 🚀 Quick Start Deployment

### Step 1: Create Database
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trustbridge'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON trustbridge.* TO 'trustbridge'@'localhost';
FLUSH PRIVILEGES;
exit;
```

### Step 2: Import Schema
```bash
cd sql/
mysql -u trustbridge -p trustbridge < complete-setup.sql
mysql -u trustbridge -p trustbridge < initial-data.sql
```

### Step 3: Verify
```bash
mysql -u trustbridge -p trustbridge -e "SHOW TABLES;"
mysql -u trustbridge -p trustbridge -e "SELECT token_name, token_symbol FROM cardano_tokens;"
```

You should see 8 tables and 7 tokens.

---

## 📈 Common Operations

### Check Transfer Statistics
```sql
SELECT
  status,
  COUNT(*) as count,
  payment_method
FROM transfers
GROUP BY status, payment_method;
```

### View Recent Transfers
```sql
SELECT
  id,
  payment_method,
  sender_amount,
  sender_currency,
  recipient_currency,
  status,
  created_at
FROM transfers
ORDER BY created_at DESC
LIMIT 10;
```

### Check Token Balance
```sql
SELECT
  t.token_name,
  COUNT(m.id) as mint_count,
  SUM(m.amount) as total_minted
FROM cardano_tokens t
LEFT JOIN cardano_mints m ON t.id = m.token_id
GROUP BY t.token_name;
```

---

## 🔧 Maintenance

### Daily Backup
```bash
mysqldump -u trustbridge -p trustbridge > backup_$(date +%Y%m%d).sql
gzip backup_$(date +%Y%m%d).sql
```

### Clean Old Cache
```sql
DELETE FROM exchange_rates_cache WHERE expires_at < NOW();
```

### Monitor Pending Transfers
```sql
SELECT id, status, TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_pending
FROM transfers
WHERE status IN ('pending', 'processing')
AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

---

## 🔐 Security Considerations

- ✅ Card numbers are encrypted (card_number_encrypted)
- ✅ Only last 4 digits stored in plain text
- ✅ User passwords not stored (WhatsApp OAuth)
- ✅ Foreign keys with CASCADE/SET NULL
- ✅ Indexes on frequently queried columns
- ⚠️ Ensure strong database password
- ⚠️ Restrict database access to localhost only
- ⚠️ Regular backups required

---

## 📞 Database Credentials

**Development:**
```
Host: localhost
Port: 3306
User: trustbridge
Password: trustbridge123
Database: trustbridge
```

**Production (VPS):**
```
Host: localhost
Port: 3306
User: trustbridge
Password: <use strong password>
Database: trustbridge
```

---

## 🎯 Environment Variables

Required in `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=your-secure-password
DB_NAME=trustbridge
```

---

## 📚 Additional Resources

- **Full Setup Guide:** `DEPLOYMENT.md`
- **Schema File:** `sql/complete-setup.sql`
- **Initial Data:** `sql/initial-data.sql`
- **Query Examples:** `sql/useful-queries.sql`
- **Backend README:** `README.md`

---

## ✅ Deployment Checklist

Before deploying to VPS:

- [ ] MySQL/MariaDB installed
- [ ] Database created with correct charset
- [ ] User created with privileges
- [ ] Schema imported (`complete-setup.sql`)
- [ ] Initial data imported (`initial-data.sql`)
- [ ] Tables verified (8 tables)
- [ ] Tokens verified (7 tokens)
- [ ] `.env` file configured with DB credentials
- [ ] Backup script setup
- [ ] Database accessible from backend

---

## 🐛 Troubleshooting

### Can't connect to database
```bash
# Test connection
mysql -u trustbridge -p trustbridge -e "SELECT 1;"

# Check MySQL is running
sudo systemctl status mariadb
```

### Missing tables
```bash
# Re-import schema
mysql -u trustbridge -p trustbridge < sql/complete-setup.sql
```

### No tokens
```bash
# Import token data
mysql -u trustbridge -p trustbridge < sql/initial-data.sql
```

---

**Database is ready for VPS deployment!** ✨

Follow `DEPLOYMENT.md` for complete VPS setup instructions.
