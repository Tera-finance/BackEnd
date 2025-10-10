# TrustBridge Backend API

> Cross-border payment system with Cardano blockchain integration, WhatsApp bot, and automated mockADA hub token architecture.

## 🌉 Overview

TrustBridge enables seamless international money transfers using:
- **mockADA Hub Token Architecture** - Universal intermediary for all currency conversions
- **Automated Blockchain Processing** - Mint mockADA → Swap to recipient mock tokens
- **WhatsApp Bot Integration** - Send money via WhatsApp messages
- **Frontend Wallet Support** - Connect Cardano wallets (Eternl, Nami, Flint)
- **MySQL Database** - Persistent storage for transfers and transactions
- **Real-time Exchange Rates** - Live currency conversion with CoinGecko & ExchangeRate-API

## 🏗️ Architecture

### Payment Flow

```
User Initiates Transfer (WhatsApp Bot / Frontend Wallet)
         ↓
Backend Receives Request (/api/transfer/initiate)
         ↓
Create Transfer Record (status: pending)
         ↓
Background Processing Starts (non-blocking)
         ↓
┌──────────────────────────────────────────┐
│ 1. Mint mockADA (Hub Token)             │
│    - USD/USDT/EUR → mockADA              │
│    - Status: processing                  │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 2. Swap to Recipient Mock Token         │
│    - mockADA → mockIDRX (if IDR)         │
│    - mockADA → mockEUROC (if EUR)        │
│    - Status: completed                   │
└──────────────────────────────────────────┘
         ↓
Generate PDF Invoice
         ↓
Send WhatsApp Summary (if WhatsApp delivery)
OR
Download PDF (if website-only delivery)
```

### Mock Tokens Supported

| Fiat Currency | Mock Token | Policy ID |
|---------------|------------|-----------|
| IDR (Indonesian Rupiah) | mockIDRX | `5c9a67cc...` |
| EUR (Euro) | mockEUROC | `f766f151...` |
| USD (US Dollar) | mockUSDC | `4cbb15ff...` |
| JPY (Japanese Yen) | mockJPYC | `7725300e...` |
| CNY (Chinese Yuan) | mockCNHT | `c7bdad55...` |
| MXN (Mexican Peso) | mockMXNT | `c7368265...` |

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0+ or MariaDB 10.5+
- **Redis** (optional, for rate limiting)
- **Cardano Wallet** with Preprod testnet ADA (for testing blockchain features)

## ⚙️ Environment Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd TrustBridge/backend-trustbridge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=trustbridge
DB_PASSWORD=your-mysql-password
DB_NAME=trustbridge

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-64-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-64-chars

# Cardano Blockchain
CARDANO_NETWORK=Preprod
BLOCKFROST_API_KEY=your-blockfrost-api-key
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# Seed Phrase (for automated blockchain operations)
SEED_PHRASE="your 24-word seed phrase here"

# Exchange Rate APIs
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Set Up MySQL Database

#### Option A: Local MySQL

```bash
# Create database
mysql -u root -p

CREATE DATABASE trustbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trustbridge'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON trustbridge.* TO 'trustbridge'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u trustbridge -p trustbridge < sql/mysql-schema.sql

# Import transfers table
mysql -u trustbridge -p trustbridge < sql/add-transfers-table.sql
```

#### Option B: Docker MySQL

```bash
docker run --name trustbridge-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=trustbridge \
  -e MYSQL_USER=trustbridge \
  -e MYSQL_PASSWORD=your-password \
  -p 3306:3306 \
  -d mysql:8.0

sleep 10

# Import schemas
docker exec -i trustbridge-mysql mysql -u trustbridge -pyour-password trustbridge < sql/mysql-schema.sql
docker exec -i trustbridge-mysql mysql -u trustbridge -pyour-password trustbridge < sql/add-transfers-table.sql
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

**Expected Output:**
```
✅ Connected to MySQL database
✅ Connected to Redis
🚀 TrustBridge Backend running on port 3000
🌍 Environment: development
🔗 Cardano Network: Preprod
💾 Database: MySQL
```

Server will be available at: `http://localhost:3000`

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### POST `/auth/login`
Login or register user with WhatsApp number.

**Request:**
```json
{
  "whatsappNumber": "+6281234567890",
  "countryCode": "ID"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "whatsappNumber": "+6281234567890",
    "status": "PENDING_KYC"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Exchange Rates

#### GET `/exchange/currencies`
Get all supported currencies.

#### GET `/exchange/rate?from=USD&to=IDR`
Get exchange rate between two currencies.

#### POST `/exchange/quote`
Get complete transfer quote with fees.

**Request:**
```json
{
  "senderCurrency": "USD",
  "recipientCurrency": "IDR",
  "amount": 300,
  "paymentMethod": "MASTERCARD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sender": {
      "currency": "USD",
      "amount": 300,
      "symbol": "$"
    },
    "recipient": {
      "currency": "IDR",
      "amount": 4688880,
      "symbol": "Rp"
    },
    "conversion": {
      "adaAmount": 447.76,
      "exchangeRate": 15629.60,
      "path": ["USD", "ADA", "IDR"]
    },
    "fees": {
      "percentage": 1.5,
      "amount": 4.50,
      "totalAmount": 304.50
    },
    "blockchain": {
      "usesMockToken": true,
      "mockToken": "mockIDRX"
    }
  }
}
```

### Transfers

#### POST `/transfer/initiate`
Initiate a new transfer (from WhatsApp bot or frontend wallet).

**Request (WhatsApp/Mastercard):**
```json
{
  "paymentMethod": "MASTERCARD",
  "senderCurrency": "USD",
  "senderAmount": 300,
  "recipientName": "July",
  "recipientCurrency": "IDR",
  "recipientBank": "BNI",
  "recipientAccount": "1234567890",
  "whatsappNumber": "+6281234567890",
  "cardDetails": {
    "number": "4532********1234",
    "cvc": "123",
    "expiry": "12/26"
  }
}
```

**Request (Wallet):**
```json
{
  "paymentMethod": "WALLET",
  "senderCurrency": "ADA",
  "senderAmount": 500,
  "recipientName": "July",
  "recipientCurrency": "IDR",
  "recipientBank": "BNI",
  "recipientAccount": "1234567890",
  "whatsappNumber": "+6281234567890",
  "deliveryMethod": "whatsapp",
  "walletTxHash": "abc123...",
  "walletAddress": "addr_test1..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "TXN-1696848000000-abc123",
    "status": "pending",
    "paymentMethod": "WALLET",
    "blockchain": {
      "usesMockToken": true,
      "mockToken": "mockIDRX",
      "policyId": "5c9a67cc...",
      "txHash": null
    }
  },
  "message": "Transfer initiated successfully. Blockchain processing started."
}
```

**Background Processing:**
- Automatically mints mockADA from source currency
- Swaps mockADA to recipient mock token (if available)
- Updates transfer status: `pending` → `processing` → `completed`
- Sends WhatsApp notification (if WhatsApp delivery)

#### GET `/transfer/status/:transferId`
Get transfer status and blockchain transaction details.

#### GET `/transfer/invoice/:transferId`
Download PDF invoice for completed transfer.

#### GET `/transfer/history?userId=xxx&limit=10`
Get transfer history for user.

### Cardano Blockchain

#### GET `/cardano/tokens`
Get all deployed Cardano tokens.

#### GET `/cardano/tokens/symbol/:symbol`
Get token by symbol (e.g., `mockIDRX`).

#### GET `/cardano/mints/:policyId`
Get mint history for a token.

#### GET `/cardano/swaps`
Get all swap transactions.

## 🔐 WhatsApp Bot Integration

The backend works seamlessly with the `TrustBridge-Chatbot` WhatsApp bot.

### Bot Commands

**Transfer Money:**
```
kirim 100 USD ke +6281234567890
transfer 50 ke July
send 25.5 to +6281234567890
```

**Check Balance:**
```
balance
saldo
dana
```

**Exchange Rate:**
```
rate USD to IDR
kurs
harga USDC
```

**Transaction History:**
```
history
riwayat
transaksi
```

### Polling Service

The WhatsApp bot polls the backend every 15 seconds to check for transfer status updates and sends beautiful transaction summaries when completed:

```
✅ Transfer Completed Successfully!

━━━━━━━━━━━━━━━━━━━━

📤 You Sent
   $300.00

📥 Recipient Receives
   Rp 4,688,880.00
   July
   BNI - 1234567890

━━━━━━━━━━━━━━━━━━━━

💳 Transaction Details
   Fee: $4.50 (1.5%)
   Rate: 1 USD = 15,629.60 IDR

⛓️ Blockchain
   Via mockADA Hub
   447.76 mockADA used

✨ Your money is on the way!
Thank you for using TrustBridge! 🌉
```

## 🎨 Frontend Wallet Integration

The backend supports the `TrustBridge-Frontend` wallet transfer page.

### Supported Wallets
- **Eternl**
- **Nami**
- **Flint**

### Delivery Modes
1. **WhatsApp Delivery** - Sends PDF invoice to recipient's WhatsApp
2. **Website-Only** - Download invoice from success page

### Integration Example

```javascript
// Connect wallet
const wallet = await cardano.eternl.enable();

// Send mockADA to backend address
const tx = new Transaction({ initiator: wallet });
tx.sendLovelace(backendAddress, "500000000"); // 500 ADA
const signedTx = await wallet.signTx(await tx.build());
const txHash = await wallet.submitTx(signedTx);

// Notify backend
const response = await fetch('http://localhost:3000/api/transfer/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentMethod: 'WALLET',
    senderCurrency: 'ADA',
    senderAmount: 500,
    recipientName: 'July',
    recipientCurrency: 'IDR',
    recipientBank: 'BNI',
    recipientAccount: '1234567890',
    deliveryMethod: 'website',
    walletTxHash: txHash,
    walletAddress: address
  })
});

// Backend automatically processes: mint mockADA → swap to mockIDRX → complete
```

## 📊 Database Schema

### Main Tables

- **`users`** - User accounts with KYC status
- **`transfers`** - Transfer records with blockchain tracking
- **`cardano_tokens`** - Deployed Cardano tokens
- **`cardano_mints`** - Mint transaction history
- **`cardano_swaps`** - Swap transaction history
- **`transactions`** - Legacy transaction records
- **`kyc_data`** - KYC verification documents

### Transfers Table Structure

```sql
CREATE TABLE transfers (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(36),
  whatsapp_number VARCHAR(50) NOT NULL,
  status ENUM('pending', 'paid', 'processing', 'completed', 'failed', 'cancelled'),

  payment_method ENUM('WALLET', 'MASTERCARD'),

  sender_currency VARCHAR(10),
  sender_amount DECIMAL(20, 8),
  total_amount DECIMAL(20, 8),

  recipient_name VARCHAR(255),
  recipient_currency VARCHAR(10),
  recipient_expected_amount DECIMAL(20, 8),
  recipient_bank VARCHAR(100),
  recipient_account VARCHAR(100),

  ada_amount DECIMAL(20, 8),
  exchange_rate DECIMAL(20, 8),
  conversion_path TEXT,

  uses_mock_token BOOLEAN DEFAULT FALSE,
  mock_token VARCHAR(50),
  policy_id VARCHAR(56),
  tx_hash VARCHAR(64),
  blockchain_tx_url VARCHAR(300),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);
```

## 🔧 Services & Architecture

### TransferProcessorService
Orchestrates automated blockchain operations:
- Calculates mockADA amount from source currency
- Mints mockADA (hub token)
- Swaps mockADA to recipient mock token
- Updates transfer status automatically

**Location:** `src/services/transfer-processor.service.ts`

### InvoiceGeneratorService
Generates professional PDF invoices using PDFKit:
- TrustBridge branding
- Complete transfer details
- Blockchain transaction info

**Location:** `src/services/invoice-generator.service.ts`

### CardanoWalletService
Manages Cardano blockchain interactions:
- Token minting (mockADA, mockIDRX, etc.)
- Token swapping (mockADA ↔ mock tokens)
- Transaction submission via Blockfrost

**Location:** `src/services/cardano-wallet.service.ts`

### ExchangeRateService
Fetches real-time exchange rates:
- CoinGecko API for crypto prices (ADA, USDT, USDC)
- ExchangeRate-API for fiat currencies
- 5-minute caching to reduce API calls

**Location:** `src/services/exchange-rate.service.ts`

## 🛡️ Security Features

- **JWT Authentication** - Access & refresh tokens
- **Card Data Encryption** - AES-256 encryption for sensitive data
- **Rate Limiting** - 100 requests per 15 minutes
- **Input Validation** - Request body validation
- **SQL Injection Protection** - Parameterized queries
- **CORS** - Configurable cross-origin policies

## 📈 Production Deployment

### VPS Deployment (Recommended)

1. **Set up VPS** (Ubuntu 20.04+)
```bash
sudo apt update
sudo apt install nodejs npm mysql-server redis-server nginx certbot
```

2. **Clone and build**
```bash
git clone <your-repo>
cd TrustBridge/backend-trustbridge
npm install --production
npm run build
```

3. **Configure PM2**
```bash
npm install -g pm2
pm2 start dist/index.js --name trustbridge-api
pm2 save
pm2 startup
```

4. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable SSL**
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Environment Variables (Production)

Make sure to set:
- `NODE_ENV=production`
- Strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Valid `BLOCKFROST_API_KEY`
- Secure `DB_PASSWORD`

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/
```

### Test Transfer Flow
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"whatsappNumber": "+6281234567890", "countryCode": "ID"}'

# 2. Get quote
curl -X POST http://localhost:3000/api/exchange/quote \
  -H "Content-Type: application/json" \
  -d '{"senderCurrency": "USD", "recipientCurrency": "IDR", "amount": 100, "paymentMethod": "WALLET"}'

# 3. Initiate transfer
curl -X POST http://localhost:3000/api/transfer/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "WALLET",
    "senderCurrency": "USD",
    "senderAmount": 100,
    "recipientName": "Test User",
    "recipientCurrency": "IDR",
    "recipientBank": "BNI",
    "recipientAccount": "1234567890"
  }'

# 4. Check status
curl http://localhost:3000/api/transfer/status/TXN-xxx
```

### Test Cardano Endpoints
```bash
# Get all tokens
curl http://localhost:3000/api/cardano/tokens

# Get specific token
curl http://localhost:3000/api/cardano/tokens/symbol/mockIDRX

# Get mint history
curl http://localhost:3000/api/cardano/mints/5c9a67cc...

# Get swap history
curl http://localhost:3000/api/cardano/swaps
```

## 📚 Documentation

- **API_DOCUMENTATION.md** - Complete API reference
- **sql/mysql-schema.sql** - Database schema
- **sql/add-transfers-table.sql** - Transfers table migration

## 🐛 Troubleshooting

### MySQL Connection Error
```bash
# Check MySQL status
sudo systemctl status mysql

# Reset MySQL password
sudo mysql -u root -p
ALTER USER 'trustbridge'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;

# Update .env with new password
```

### Blockchain Transaction Fails
- Check Blockfrost API key is valid
- Ensure wallet has sufficient Preprod ADA
- Verify seed phrase is correct (24 words)
- Check Cardano network status

### WhatsApp Bot Not Connecting
- Verify `BACKEND_API_URL` in chatbot `.env`
- Check backend is accessible from chatbot server
- Ensure no firewall blocking port 3000

## 🤝 Integration Points

### With TrustBridge-Chatbot
- Backend URL: `http://localhost:3000` or `https://api-trustbridge.izcy.tech`
- Authentication: WhatsApp number-based login
- Polling interval: 15 seconds
- Status updates: Automatic via polling service

### With TrustBridge-Frontend
- API Base URL: `http://localhost:3000/api`
- Wallet connection: Mesh SDK (@meshsdk/core)
- Transfer endpoint: `/api/transfer/initiate`
- Invoice download: `/api/transfer/invoice/:transferId`

## 📄 License

ISC License

## 🙏 Credits

Built with:
- Express.js - Web framework
- TypeScript - Type safety
- MySQL - Database
- Cardano - Blockchain
- Lucid-Cardano - Cardano SDK
- PDFKit - PDF generation
- Redis - Caching
- Blockfrost - Cardano API
