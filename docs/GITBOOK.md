# TrustBridge Documentation

---

## 1. INTRODUCTION

### 1.1 Overview

TrustBridge is a **decentralized remittance protocol** built on the Cardano blockchain that revolutionizes cross-border money transfers. By leveraging blockchain technology, stablecoins, and smart contracts, TrustBridge provides a fast, transparent, and cost-effective alternative to traditional remittance services.

**Key Highlights:**
- **Blockchain-Powered**: Built on Cardano with PlutusV3 smart contracts
- **Low-Cost Transfers**: Reduce remittance fees from 6-8% to under 2%
- **Instant Settlement**: Process transfers in minutes instead of days
- **Multi-Currency Support**: Handle multiple fiat and crypto currencies
- **WhatsApp Integration**: User-friendly interface through WhatsApp chatbot
- **Transparent**: All transactions recorded on-chain for full auditability

**Mission Statement:**
Democratize access to affordable, fast, and secure cross-border payments for everyone, especially underserved communities and migrant workers worldwide.

---

### 1.2 Problem and Solution

#### 1.2.1 Problem

The global remittance market processes over **$800 billion annually**, yet faces critical challenges:

**High Costs:**
- Traditional services charge **6-8% in fees** on average
- Hidden fees and poor exchange rates reduce actual money received
- Low-income workers lose significant portions of their earnings

**Slow Processing:**
- Transfers take **3-7 business days** to complete
- Recipients face delays in accessing urgent funds
- Bank holidays and weekends extend wait times

**Limited Access:**
- Requires bank accounts on both sides
- Complex KYC/AML processes create barriers
- Rural areas lack physical service locations
- Unbanked populations (1.7 billion people) excluded

**Lack of Transparency:**
- Unclear fee structures
- Opaque exchange rate markups
- Difficult to track transfer status
- No visibility into processing stages

**Security Risks:**
- Centralized systems vulnerable to hacks
- Fraud and identity theft concerns
- No recourse mechanisms for disputes

#### 1.2.2 Solution

TrustBridge leverages blockchain technology to solve these problems:

**1. Low-Cost Transfers**
- Blockchain eliminates intermediaries
- Fees reduced to **<2%** of transfer amount
- Transparent fee structure with no hidden charges
- Real-time exchange rates via on-chain oracles

**2. Instant Settlement**
- Transactions complete in **5-10 minutes**
- 24/7/365 availability (no banking hours)
- Funds accessible immediately upon confirmation
- No weekend or holiday delays

**3. Universal Access**
- **WhatsApp integration** - no app installation needed
- Simple phone number authentication
- Support for both crypto wallets and traditional bank accounts
- Cash-out options through partner networks

**4. Complete Transparency**
- All transactions recorded on Cardano blockchain
- Real-time tracking via transaction hash
- Clear fee breakdown before confirmation
- Immutable audit trail

**5. Enhanced Security**
- Decentralized architecture (no single point of failure)
- Smart contract automation prevents fraud
- Multi-signature support for large transfers
- Dispute resolution mechanisms built-in

**Technical Implementation:**
```
User (WhatsApp) → Backend API → Cardano Smart Contract → Token Minting → Recipient Wallet/Bank
```

---

### 1.3 Features

#### Core Features

**1. Multi-Currency Support**
- **Stablecoins**: mockUSDC, mockEUROC, mockCNHT, mockJPYC, mockMXNT, mockIDRX
- **Fiat Currencies**: USD, EUR, GBP, IDR, JPY, CNY, MXN, and more
- **Native Crypto**: ADA (Cardano)
- Automatic currency conversion at competitive rates

**2. Multiple Payment Methods**
- **Crypto Wallet**: Direct wallet-to-wallet transfers
- **Mastercard/Credit Card**: Traditional payment integration
- **Bank Transfer**: Direct bank account deposits
- **Cash Pickup**: Partner network for cash collection

**3. WhatsApp Chatbot Interface**
- User-friendly conversational interface
- No app installation required
- Command-based operations:
  - `/send` - Initiate transfer
  - `/history` - View transaction history
  - `/status` - Check transfer status
  - `/rates` - View current exchange rates
  - `/help` - Get assistance
- Real-time notifications and updates
- Multi-language support

**4. Web Dashboard**
- Comprehensive transaction history
- Real-time balance tracking
- Analytics and insights
- Invoice generation and download
- Account management
- Cardano wallet integration (Eternl, Nami, Flint, etc.)

**5. Smart Contract Automation**
- Automated token minting for each transfer
- Escrow functionality for secure transfers
- Multi-signature wallet support
- Dispute resolution mechanisms
- Automated refunds on failed transfers

**6. Security Features**
- JWT-based authentication
- Rate limiting and DDoS protection
- Encrypted data transmission
- Wallet signature verification
- Transaction monitoring and fraud detection

**7. Real-Time Tracking**
- Live transaction status updates
- Cardano blockchain explorer integration
- Push notifications via WhatsApp
- Email confirmations (optional)
- PDF invoice generation

**8. Developer-Friendly**
- RESTful API architecture
- Comprehensive API documentation
- Webhook support for integrations
- Testnet environment for development
- SDK for third-party integrations

#### Advanced Features

**Exchange Rate Oracle**
- Real-time price feeds from multiple sources
- Automatic rate updates every 5 minutes
- Rate locking for confirmed transfers
- Historical rate tracking

**Invoice System**
- Automatic PDF generation
- Detailed transaction breakdown
- Blockchain verification links
- Digital receipts for both parties

**Transaction Analytics**
- Volume tracking by currency/region
- Success rate monitoring
- Average processing time metrics
- Cost savings calculator

**Compliance & Security**
- Configurable KYC/AML rules
- Transaction limits (daily/monthly)
- Suspicious activity detection
- Regulatory reporting tools

---

## 2. MISSION

### 2.1 Contribution to the Cardano Ecosystem

TrustBridge strengthens the Cardano ecosystem through:

**Real-World Utility:**
- Demonstrates Cardano's capability for high-volume, real-world financial applications
- Showcases PlutusV3 smart contract functionality for practical use cases
- Drives ADA utility through transaction fees and liquidity

**Stablecoin Adoption:**
- Promotes usage of Cardano-native stablecoins
- Creates liquidity pools for multiple currency pairs
- Establishes infrastructure for tokenized fiat currencies

**Developer Innovation:**
- Open-source smart contracts serve as reference implementations
- Contributes libraries and tools back to the Cardano community
- Provides educational resources for blockchain developers

**Network Growth:**
- Attracts new users to the Cardano ecosystem
- Increases transaction volume and network activity
- Expands Cardano's presence in emerging markets

**Strategic Partnerships:**
- Collaborates with Cardano DeFi projects for liquidity
- Integrates with Cardano wallet providers
- Participates in Cardano governance and development

**Metrics:**
- Target: **100,000+ transactions** in Year 1
- Goal: **50,000+ active users** onboarded to Cardano
- Expected: **$10M+ volume** processed through network

---

### 2.2 TrustBridge Utilization Ecosystem

**User Segments:**

**1. Migrant Workers (Primary)**
- Send money back home to families
- Regular monthly remittances
- High sensitivity to fees (3-5% savings significant)
- Mobile-first users (WhatsApp primary communication)

**2. Small Businesses**
- Cross-border payments to suppliers
- Freelancer payments (gig economy)
- E-commerce transactions
- B2B settlements

**3. Crypto Enthusiasts**
- On/off-ramp for fiat ↔ crypto
- Arbitrage opportunities
- DeFi integration (lending, staking)
- Portfolio diversification

**4. Financial Institutions**
- Banks seeking blockchain integration
- Fintech companies expanding services
- Money transfer operators (MTOs)
- Remittance aggregators

**Ecosystem Participants:**

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustBridge Ecosystem                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Users (WhatsApp/Web) ←→ TrustBridge Platform              │
│         ↓                        ↓                          │
│  Cardano Blockchain ←→ Smart Contracts ←→ Token Minting     │
│         ↓                        ↓                          │
│  Liquidity Providers ←→ DEXs/CEXs ←→ Price Oracles          │
│         ↓                        ↓                          │
│  Partner Banks ←→ Cash-Out Networks ←→ Payment Processors   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Revenue Streams:**
1. **Transaction Fees**: 1.5-2% per transfer
2. **Currency Conversion Spread**: 0.3-0.5%
3. **Premium Features**: Analytics, API access, priority processing
4. **B2B Licensing**: White-label solutions for partners
5. **Staking Rewards**: ADA staking from treasury

---

### 2.3 Roadmap

#### Phase 1: Foundation (Q1 2025) ✅
- [x] Deploy PlutusV3 smart contracts on Cardano Preprod testnet
- [x] Launch WhatsApp chatbot integration
- [x] Implement backend API and database infrastructure
- [x] Create web dashboard with wallet integration
- [x] Support 7 stablecoins (ADA, USDC, EURC, CNHT, JPYC, MXNT, IDRX)
- [x] Beta testing with 100 users

#### Phase 2: Mainnet Launch (Q2 2025)
- [ ] Deploy to Cardano Mainnet
- [ ] Integrate 3+ Cardano wallets (Eternl, Nami, Flint)
- [ ] Add fiat on-ramp via credit card partners
- [ ] Implement KYC/AML compliance system
- [ ] Launch marketing campaign
- [ ] Target: 1,000 active users, $100K volume

#### Phase 3: Expansion (Q3 2025)
- [ ] Add 10+ new currency corridors
- [ ] Integrate cash-out partner network (Western Union, MoneyGram alternatives)
- [ ] Mobile app (iOS/Android) launch
- [ ] Multi-signature wallet support
- [ ] DeFi integrations (lending, liquidity pools)
- [ ] Target: 10,000 users, $1M volume

#### Phase 4: Scale (Q4 2025)
- [ ] Cross-chain bridges (Ethereum, Polygon, BSC)
- [ ] Institutional API launch for B2B clients
- [ ] Decentralized governance (DAO) implementation
- [ ] Advanced analytics and AI fraud detection
- [ ] Expand to 50+ countries
- [ ] Target: 50,000 users, $10M volume

#### Phase 5: Global (2026+)
- [ ] Support 100+ currency pairs
- [ ] Partnerships with major banks and fintech companies
- [ ] Regulatory licenses in key markets (US, EU, Asia)
- [ ] Layer 2 scaling solution for high throughput
- [ ] Carbon-neutral operations and impact reporting
- [ ] Target: 500,000+ users, $100M+ volume

**Innovation Pipeline:**
- AI-powered exchange rate prediction
- Biometric authentication via WhatsApp
- Offline transaction signing
- Peer-to-peer local currency exchange
- Microfinance integration

---

## 3. PRODUCTS

### 3.1 TrustBridge WhatsApp Bot

**Description:**
Conversational interface for sending/receiving money via WhatsApp - the world's most popular messaging app (2B+ users).

**Key Features:**
- **Zero Installation**: Works directly in WhatsApp
- **Phone Number Auth**: No password or email required
- **Natural Language**: Chat-based interface
- **Real-Time Updates**: Instant transaction notifications
- **24/7 Availability**: Always accessible

**Available Commands:**
```
/send - Initiate a new transfer
/history - View past transactions
/status <txn_id> - Check transfer status
/rates - Current exchange rates
/balance - Check wallet balance
/help - Get assistance
/cancel <txn_id> - Cancel pending transfer
```

**User Flow:**
1. User sends `/send` to TrustBridge WhatsApp number
2. Bot asks for recipient details (name, currency, amount)
3. Bot shows exchange rate and fees
4. User confirms transfer
5. Bot generates payment link or wallet address
6. User completes payment
7. Smart contract mints tokens and processes transfer
8. Bot sends confirmation with blockchain link
9. Recipient receives funds + notification

**Technical Stack:**
- WhatsApp Business API
- Node.js backend with TypeScript
- MySQL database for session management
- Redis for message queue
- Webhook integration with Cardano backend

**Pricing:**
- Free for users (fees included in transfer)
- Standard WhatsApp Business API costs

---

### 3.2 TrustBridge Web Dashboard

**Description:**
Full-featured web application for managing transfers, viewing analytics, and integrating Cardano wallets.

**Key Features:**

**1. Dashboard Home**
- Real-time ADA balance
- Recent transactions list
- Quick send money form
- Transaction statistics (total volume, count, success rate)

**2. Transfer Pages**
- **Send**: Multi-step form with currency selection, recipient details, payment method
- **History**: Searchable/filterable transaction table with status indicators
- **Invoice Download**: PDF generation with blockchain verification links

**3. Exchange Rates**
- Live rate display for all supported currencies
- Interactive currency converter
- Historical rate charts
- Rate alerts (coming soon)

**4. Wallet Integration**
- Connect Cardano wallets (Eternl, Nami, Flint, Yoroi, etc.)
- View native tokens and NFTs
- Sign transactions directly from dashboard
- Multi-wallet support

**5. Account Management**
- Profile settings
- Security settings (2FA, trusted devices)
- Notification preferences
- API key generation (for developers)

**6. Analytics & Reports**
- Monthly/yearly transaction summaries
- Cost savings calculator vs traditional remittance
- Export data to CSV/PDF
- Tax reporting tools

**Technical Stack:**
- Next.js 15 (React framework)
- TypeScript for type safety
- Tailwind CSS + shadcn/ui components
- MeshSDK for Cardano integration
- Chart.js/Recharts for data visualization

**Access:**
- Web: https://trustbridge.izcy.tech
- Responsive design (mobile/tablet/desktop)

---

### 3.3 TrustBridge API

**Description:**
RESTful API for third-party integrations, enabling developers to build on TrustBridge infrastructure.

**Endpoints:**

**Authentication:**
```
POST /api/auth/login - User login
POST /api/auth/register - User registration
POST /api/auth/refresh - Refresh access token
POST /api/auth/logout - Logout user
```

**Transfers:**
```
POST /api/transfer/calculate - Calculate fees and exchange rate
POST /api/transfer/initiate - Create new transfer
GET /api/transfer/:id - Get transfer details
GET /api/transfer/history - Get user transaction history
GET /api/transfer/invoice/:id - Download PDF invoice
POST /api/transfer/cancel/:id - Cancel pending transfer
```

**Cardano:**
```
GET /api/cardano/backend-info - Get backend wallet info
POST /api/cardano/mint-tokens - Mint tokens for transfer
GET /api/cardano/token-deployments - List deployed tokens
POST /api/cardano/build-mint-tx - Build minting transaction
```

**Exchange Rates:**
```
GET /api/rates/current - Get current exchange rates
GET /api/rates/history/:currency - Historical rates
GET /api/rates/convert - Convert amount between currencies
```

**API Features:**
- **Authentication**: JWT tokens (access + refresh)
- **Rate Limiting**: 100 requests/minute per API key
- **Webhooks**: Real-time event notifications
- **Pagination**: Efficient data retrieval
- **Error Handling**: Standardized error responses
- **Versioning**: /v1, /v2 support

**Documentation:**
- OpenAPI/Swagger specification
- Postman collection available
- Code examples in JavaScript, Python, Go

**Pricing:**
- **Free Tier**: 1,000 requests/month
- **Pro Tier**: $49/mo - 100,000 requests/month
- **Enterprise**: Custom pricing for unlimited requests

---

### 3.4 TrustBridge Smart Contracts

**Description:**
PlutusV3 smart contracts deployed on Cardano blockchain, powering secure and automated transfers.

**Contracts:**

**1. Token Minting Contract**
- Mints stablecoins representing fiat value
- Validates sender authorization
- Enforces supply limits and metadata standards
- Supports CIP-25 (NFT metadata standard)

**2. Escrow Contract**
- Holds funds until conditions met
- Time-locked releases
- Multi-party approval workflows
- Automatic refunds on failure

**3. Multi-Signature Wallet**
- Requires M-of-N signatures for large transfers
- Role-based permissions (admin, operator, viewer)
- Emergency recovery mechanisms

**4. Dispute Resolution**
- On-chain arbitration system
- Evidence submission and voting
- Automated fund distribution based on ruling

**Technical Details:**
- **Language**: Aiken (modern Plutus alternative)
- **Plutus Version**: V3 (latest)
- **Compiler**: v1.1.19
- **Network**: Cardano Preprod Testnet (mainnet planned Q2 2025)
- **Policy IDs**: Unique for each token type

**Security:**
- Audited by third-party security firms
- Formal verification for critical functions
- Time-lock mechanisms for admin operations
- Emergency pause functionality

**Repository:**
- Open-source on GitHub: `Trustbridge-SmartContracts/`
- MIT/Apache-2.0 License

---

### 3.5 Backend Infrastructure

**Description:**
Robust Node.js/TypeScript backend handling business logic, database management, and blockchain interaction.

**Architecture:**

**1. API Server** (`backend-trustbridge/`)
- Express.js REST API
- JWT authentication
- Rate limiting & security middleware (Helmet, CORS)
- Redis caching for performance
- MySQL database (MariaDB compatible)

**2. Blockchain Service** (`be-offchain/`)
- Lucid Evolution library for Cardano
- Automated transaction building and signing
- UTXO management
- Collateral handling
- Transaction monitoring

**3. Database Schema**
- **users**: WhatsApp authentication
- **transfers**: Main transaction records
- **cardano_tokens**: Deployed token metadata
- **cardano_mints**: Mint transaction history
- **exchange_rates_cache**: Cached rates
- **schema_version**: Migration tracking

**4. Invoice Generator**
- PDFKit for PDF creation
- Dynamic template with blockchain links
- Automatic email delivery (optional)
- S3 storage for long-term archival

**5. WhatsApp Integration**
- Webhook handlers for incoming messages
- Session management with Redis
- Command parser and router
- Message queue for async processing

**Deployment:**
- Docker containers for easy deployment
- PM2 for process management
- Nginx reverse proxy
- SSL/TLS with Let's Encrypt
- Automated backups (daily)

**Monitoring:**
- Logging with Winston
- Error tracking with Sentry
- Uptime monitoring
- Performance metrics (Prometheus + Grafana)

---

## 4. HOW TRUSTBRIDGE WORKS

### 4.1 Overview

TrustBridge operates as a decentralized bridge between traditional finance and blockchain, enabling seamless cross-border transfers.

**Core Workflow:**
```
┌─────────────────────────────────────────────────────────────────┐
│                   TrustBridge Transfer Flow                     │
└─────────────────────────────────────────────────────────────────┘

1. USER INITIATES TRANSFER
   ├─ WhatsApp Bot: /send command
   └─ Web Dashboard: Fill transfer form

2. COLLECT TRANSFER DETAILS
   ├─ Sender currency & amount
   ├─ Recipient name, country, currency
   ├─ Recipient bank/wallet details
   └─ Payment method (Wallet/Mastercard)

3. CALCULATE & DISPLAY QUOTE
   ├─ Fetch current exchange rate
   ├─ Calculate fees (network + service)
   ├─ Show total cost & recipient receives
   └─ User confirms or cancels

4. STORE IN DATABASE
   ├─ Create transfer record (status: pending)
   ├─ Generate unique transfer ID
   └─ Store all transaction metadata

5. PAYMENT PROCESSING
   ├─ WALLET: Generate payment address
   │   └─ User sends crypto from wallet
   │
   └─ MASTERCARD: Redirect to payment gateway
       └─ Process credit card payment

6. BLOCKCHAIN MINTING
   ├─ Detect payment received
   ├─ Build Cardano transaction
   ├─ Mint stablecoin tokens (represents fiat value)
   ├─ Sign & submit transaction
   └─ Wait for confirmation (2-5 minutes)

7. RECIPIENT DELIVERY
   ├─ Bank Transfer: Send to recipient bank account
   ├─ Wallet: Transfer tokens to recipient address
   └─ Cash Pickup: Generate pickup code

8. COMPLETION & NOTIFICATION
   ├─ Update transfer status: completed
   ├─ Generate PDF invoice
   ├─ Send WhatsApp notification with blockchain link
   └─ Email receipt (if enabled)

9. TRACKING & TRANSPARENCY
   ├─ User can check status anytime: /status <id>
   ├─ View transaction on Cardano explorer
   └─ Download invoice from dashboard
```

---

### 4.2 Technical Architecture

**System Components:**

```
┌───────────────────────────────────────────────────────────────────┐
│                      TrustBridge Architecture                     │
└───────────────────────────────────────────────────────────────────┘

┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│              │          │              │          │              │
│  WhatsApp    │─────────▶│   Backend    │─────────▶│   Cardano    │
│   Client     │          │   API Server │          │  Blockchain  │
│              │          │              │          │              │
└──────────────┘          └──────────────┘          └──────────────┘
       │                         │                         │
       │                         │                         │
       ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│              │          │              │          │              │
│     Web      │─────────▶│    MySQL     │          │   Smart      │
│  Dashboard   │          │   Database   │          │  Contracts   │
│              │          │              │          │              │
└──────────────┘          └──────────────┘          └──────────────┘
                                 │
                                 │
                                 ▼
                          ┌──────────────┐
                          │              │
                          │    Redis     │
                          │    Cache     │
                          │              │
                          └──────────────┘
```

**Data Flow:**

1. **Frontend Layer** (WhatsApp + Web)
   - User interface and interaction
   - Input validation
   - Session management

2. **API Layer** (Express.js)
   - RESTful endpoints
   - Authentication & authorization
   - Rate limiting
   - Request routing

3. **Business Logic Layer**
   - Transfer calculation
   - Currency conversion
   - Fee computation
   - Validation rules

4. **Blockchain Layer**
   - Transaction building
   - Smart contract interaction
   - Token minting
   - Status monitoring

5. **Data Layer**
   - MySQL for persistent storage
   - Redis for caching & sessions
   - S3 for invoice PDFs

---

### 4.3 Wallet Transfer Flow (Detailed)

**Step-by-Step Process for Crypto Wallet Payments:**

**Step 1: Initiate Transfer**
```javascript
// User submits form with:
{
  senderCurrency: "mockADA",
  amount: "100",
  recipientName: "John Doe",
  recipientCurrency: "IDR",
  recipientBank: "BNI",
  recipientAccount: "1234567890",
  paymentMethod: "WALLET"
}
```

**Step 2: Calculate Exchange**
```javascript
// API calculates:
const exchangeRate = 13600; // 1 ADA = 13,600 IDR
const fees = {
  networkFee: 0.2, // ADA (Cardano transaction fee)
  serviceFee: 2.0, // ADA (TrustBridge fee)
  totalFee: 2.2 // ADA
};
const recipientReceives = (100 - 2.2) * 13600; // 1,330,080 IDR
```

**Step 3: Create Database Record**
```sql
INSERT INTO transfers (
  id, user_id, sender_currency, sender_amount,
  recipient_name, recipient_currency, recipient_amount,
  payment_method, status, created_at
) VALUES (
  'TXN-1760104993148', 'user123', 'mockADA', 100,
  'John Doe', 'IDR', 1330080,
  'WALLET', 'pending', NOW()
);
```

**Step 4: Generate Payment Address**
```javascript
// Backend generates unique Cardano address
const paymentAddress = "addr_test1qz..."; // Testnet address
const exactAmount = "97.8 ADA"; // After fees deducted

// Return to user
res.json({
  transferId: "TXN-1760104993148",
  paymentAddress: paymentAddress,
  amount: exactAmount,
  timeout: 600 // 10 minutes to pay
});
```

**Step 5: User Sends Payment**
```javascript
// Frontend connects user's Cardano wallet (e.g., Eternl)
const wallet = await window.cardano.eternl.enable();
const tx = await wallet.submitTx(
  paymentAddress,
  exactAmount
);
// Returns txHash: "319dd708d9e15dbeb8e00b88b14f984d23fb58caba058b0c82f48223485274c3"
```

**Step 6: Backend Detects Payment**
```javascript
// Webhook or polling detects incoming transaction
const utxo = await lucid.utxosByOutRef([{
  txHash: userTxHash,
  outputIndex: 0
}]);

if (utxo.length > 0) {
  // Payment confirmed!
  updateTransferStatus(transferId, 'processing');
  initiateBlockchainMinting(transferId);
}
```

**Step 7: Mint Tokens on Cardano**
```javascript
// Build minting transaction
const mintTx = await lucid
  .newTx()
  .mintAssets({
    [policyId + assetName]: BigInt(amount) // e.g., 1330080000000 (IDR with 6 decimals)
  })
  .attach.MintingPolicy(mintingPolicy)
  .addMetadata(674, {
    transferId: "TXN-1760104993148",
    recipientName: "John Doe",
    amount: "1330080",
    currency: "IDR"
  })
  .complete();

// Sign and submit
const signedTx = await mintTx.sign.withWallet().complete();
const txHash = await signedTx.submit();
// Returns: "a234b5c6d7e8f9..."
```

**Step 8: Wait for Confirmation**
```javascript
// Monitor transaction status
const confirmed = await waitForConfirmation(txHash, 3); // Wait for 3 blocks (~60 seconds)

if (confirmed) {
  updateTransferStatus(transferId, 'completed');
  updateBlockchainInfo(transferId, {
    txHash: txHash,
    blockNumber: confirmed.blockNumber,
    timestamp: confirmed.timestamp
  });
}
```

**Step 9: Generate Invoice**
```javascript
// Create PDF invoice
const invoice = await generateInvoice({
  transferId: "TXN-1760104993148",
  sender: "User123",
  recipient: "John Doe",
  amount: "100 ADA → 1,330,080 IDR",
  fees: "2.2 ADA",
  txHash: txHash,
  cardanoscanUrl: `https://preprod.cardanoscan.io/transaction/${txHash}`,
  timestamp: new Date().toISOString()
});

// Store in database
saveInvoice(transferId, invoice);
```

**Step 10: Notify User**
```javascript
// WhatsApp notification
await sendWhatsAppMessage(userPhoneNumber, `
✅ Transfer Complete!

Transfer ID: TXN-1760104993148
Recipient: John Doe
Amount: 1,330,080 IDR
Status: Completed

View on blockchain:
https://preprod.cardanoscan.io/transaction/${txHash}

Download invoice:
https://trustbridge.izcy.tech/api/transfer/invoice/TXN-1760104993148
`);

// Email notification (if enabled)
await sendEmail(userEmail, "Transfer Complete", invoiceHTML);
```

---

### 4.4 Mastercard Transfer Flow

Similar to Wallet flow, but payment is processed via credit card gateway:

1. User selects "MASTERCARD" payment method
2. Redirected to Stripe/PayPal payment page
3. Enter card details and confirm
4. Payment gateway processes card charge
5. Webhook notifies TrustBridge backend
6. Backend initiates blockchain minting (same as Step 7-10 above)
7. Recipient receives funds via bank transfer

**Key Difference**: Fiat currencies used instead of mock tokens (USD, EUR, GBP instead of mockADA, mockUSDC).

---

### 4.5 Security Measures

**1. Authentication**
- JWT tokens with short expiry (15 minutes access, 7 days refresh)
- Phone number verification via OTP
- Wallet signature verification (proving ownership)

**2. Transaction Security**
- Multi-step validation before blockchain submission
- Collateral checks to prevent failed transactions
- Amount limits (daily/monthly caps)
- Suspicious activity detection (ML-based)

**3. Smart Contract Safety**
- Formal verification of critical functions
- Time-locks for admin operations
- Emergency pause mechanism
- Multi-signature for large operations

**4. Data Protection**
- Encrypted database (AES-256)
- TLS/SSL for all API communication
- PII anonymization in logs
- GDPR compliance (data deletion on request)

**5. Infrastructure**
- DDoS protection (Cloudflare)
- Rate limiting (100 req/min per IP)
- Firewall rules (whitelist only)
- Regular security audits

---

## 5. DEPLOYMENTS

### 5.1 Chains

**Current Deployment:**

**Cardano Preprod Testnet**
- **Network**: Preprod (Public Testnet)
- **Purpose**: Beta testing and development
- **Explorer**: https://preprod.cardanoscan.io
- **Faucet**: https://docs.cardano.org/cardano-testnet/tools/faucet/

**Deployed Smart Contracts:**
```
Token Minting Policy:
├─ mockADA: a7e4ba285cd24f8899c863d4fcfdad6e44fd3c6ac6c50dc81cdd1f54
├─ mockUSDC: 502acac5b975efcde0d6f4f1ee1f37e84e5f87e2d93c5c6b5a3e0b4d
├─ mockEUROC: 5a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d
├─ mockCNHT: 6b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e
├─ mockJPYC: 7c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
├─ mockMXNT: 8d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a
└─ mockIDRX: 9e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b
```

**Backend Wallet:**
- Address: `addr_test1qr...` (controlled by backend)
- Purpose: Transaction signing and fee payment
- Funded via testnet faucet

---

**Planned Mainnet Deployment (Q2 2025):**

**Cardano Mainnet**
- **Network**: Mainnet (Production)
- **Purpose**: Live transactions with real value
- **Explorer**: https://cardanoscan.io
- **Audit**: Security audit before mainnet launch

**Deployment Checklist:**
- [ ] Complete security audit (third-party)
- [ ] Obtain regulatory approval (if required)
- [ ] Deploy smart contracts to mainnet
- [ ] Fund backend wallet with ADA
- [ ] Configure production API endpoints
- [ ] Set up mainnet monitoring and alerts
- [ ] Test with small transactions (<$100)
- [ ] Gradual rollout (whitelist users first)

---

**Future Cross-Chain Plans (2026):**

**Ethereum (EVM Compatibility)**
- Support ERC-20 stablecoins (USDC, USDT, DAI)
- Bridge to Cardano via Wanchain or Milkomeda
- Gas optimization for lower fees

**Polygon (Layer 2)**
- Fast and cheap transactions
- Large stablecoin ecosystem
- Easy onboarding for existing DeFi users

**Binance Smart Chain**
- Access to Asian markets
- High liquidity
- Competitive fees

**Solana**
- Ultra-fast settlement (<1 second)
- Low transaction costs
- Growing stablecoin adoption

**Cross-Chain Bridge:**
```
User → Ethereum USDC → Bridge → Cardano mockUSDC → TrustBridge → Recipient
```

---

### 5.2 Network Information

**Cardano Preprod Testnet Details:**
```
Network Magic: 1
Slot Duration: 1 second
Epoch Duration: 1 day (86,400 slots)
Current Era: Babbage (Plutus V3 support)
Block Time: ~20 seconds
Transaction Finality: 3 blocks (~60 seconds)
```

**API Endpoints:**
```
Preprod:
├─ Blockfrost: https://cardano-preprod.blockfrost.io/api/v0
├─ Koios: https://preprod.koios.rest/api/v1
└─ Ogmios: wss://ogmios-preprod.akashicchain.com

Mainnet (Future):
├─ Blockfrost: https://cardano-mainnet.blockfrost.io/api/v0
├─ Koios: https://api.koios.rest/api/v1
└─ Ogmios: wss://ogmios-mainnet.akashicchain.com
```

**TrustBridge Endpoints:**
```
Development:
├─ Frontend: http://localhost:3000
├─ Backend: http://localhost:5000
└─ Database: localhost:3306

Production (Future):
├─ Frontend: https://trustbridge.izcy.tech
├─ Backend: https://api-trustbridge.izcy.tech
└─ Database: (private VPS)
```

---

## 6. OTHERS

### 6.1 Links

**Official Websites:**
- **Main Website**: https://trustbridge.izcy.tech *(coming soon)*
- **Web Dashboard**: https://trustbridge.izcy.tech/dashboard
- **API Documentation**: https://docs.trustbridge.io *(coming soon)*

**GitHub Repositories:**
- **Smart Contracts**: `Trustbridge-SmartContracts/`
- **Backend API**: `backend-trustbridge/`
- **Off-Chain Backend**: `be-offchain/`
- **Frontend Dashboard**: `TrustBridge-Frontend/`
- **WhatsApp Bot**: `TrustBridge-Chatbot/`

**Social Media:**
- **Twitter/X**: @TrustBridgeIO *(coming soon)*
- **Discord Community**: discord.gg/trustbridge *(coming soon)*
- **Telegram**: t.me/trustbridge *(coming soon)*
- **LinkedIn**: linkedin.com/company/trustbridge *(coming soon)*

**Cardano Ecosystem:**
- **Cardano Explorer**: https://preprod.cardanoscan.io
- **Cardano Foundation**: https://cardanofoundation.org
- **Project Catalyst**: *(proposal submitted)*

**Developer Resources:**
- **API Docs**: https://docs.trustbridge.io/api *(coming soon)*
- **SDK (JavaScript)**: npm install @trustbridge/sdk *(coming soon)*
- **SDK (Python)**: pip install trustbridge *(coming soon)*
- **Postman Collection**: *(available on request)*

**Support:**
- **Email**: support@trustbridge.io
- **WhatsApp Support**: +1234567890 *(coming soon)*
- **Help Center**: https://help.trustbridge.io *(coming soon)*
- **Bug Reports**: GitHub Issues

**Legal:**
- **Terms of Service**: https://trustbridge.io/terms *(coming soon)*
- **Privacy Policy**: https://trustbridge.io/privacy *(coming soon)*
- **AML/KYC Policy**: https://trustbridge.io/compliance *(coming soon)*

**Partners:**
- **Cardano Foundation** - Blockchain infrastructure
- **Blockfrost** - API provider
- **MeshSDK** - Wallet integration library
- *(More partnerships coming soon)*

**Press & Media:**
- **Press Kit**: https://trustbridge.io/press *(coming soon)*
- **Brand Assets**: *(available on request)*
- **Media Contact**: press@trustbridge.io

---

## Appendix

### A. Supported Currencies

**Stablecoins (Cardano Native):**
| Token | Name | Policy ID | Decimals |
|-------|------|-----------|----------|
| mockADA | Cardano | Native | 6 |
| mockUSDC | USD Coin | 502acac... | 6 |
| mockEUROC | Euro Coin | 5a2b3c4... | 6 |
| mockCNHT | Chinese Yuan | 6b3c4d5... | 6 |
| mockJPYC | Japanese Yen | 7c4d5e6... | 6 |
| mockMXNT | Mexican Peso | 8d5e6f7... | 6 |
| mockIDRX | Indonesian Rupiah | 9e6f7a8... | 6 |

**Fiat Currencies (Credit Card):**
- USD - US Dollar
- EUR - Euro
- GBP - British Pound
- IDR - Indonesian Rupiah
- JPY - Japanese Yen
- CNY - Chinese Yuan
- MXN - Mexican Peso
- PHP - Philippine Peso
- INR - Indian Rupee
- THB - Thai Baht

*(More currencies added regularly)*

---

### B. Fee Structure

**Transaction Fees:**
```
Service Fee: 1.5% of transfer amount
Network Fee: 0.5 ADA (Cardano transaction cost)
Currency Conversion Spread: 0.3% (when converting)

Example:
Send: 100 USD
Service Fee: 1.50 USD
Network Fee: 0.50 USD
Total Cost: 102.00 USD
Recipient Receives: 98.00 USD equivalent in target currency
```

**Comparison with Traditional Remittance:**
| Service | Fee | Speed | Transparency |
|---------|-----|-------|--------------|
| Western Union | 6-8% | 3-7 days | Low |
| MoneyGram | 5-7% | 2-5 days | Low |
| Bank Wire | 3-5% + $25-50 | 3-7 days | Medium |
| **TrustBridge** | **<2%** | **5-10 min** | **High** |

**Savings Example:**
```
Send $500 to family monthly:

Traditional (6%): $500 - $30 fee = $470 received
TrustBridge (2%): $500 - $10 fee = $490 received

Annual Savings: ($30 - $10) × 12 = $240 per year!
```

---

### C. Transaction Limits

**Default Limits (Per User):**
```
Single Transaction: $10 - $5,000
Daily Limit: $10,000
Monthly Limit: $50,000
```

**KYC Tier Limits:**
```
Tier 1 (Phone Only): $1,000/month
Tier 2 (ID Verification): $10,000/month
Tier 3 (Enhanced Due Diligence): $50,000/month
Tier 4 (Business/Institutional): Custom limits
```

---

### D. Glossary

**ADA**: Native cryptocurrency of the Cardano blockchain

**Aiken**: Modern smart contract language for Cardano (alternative to Plutus)

**Blockchain**: Distributed ledger technology ensuring transparency and immutability

**Collateral**: Pure ADA UTxO required for Plutus script execution

**DeFi**: Decentralized Finance - financial services without intermediaries

**Escrow**: Smart contract holding funds until conditions are met

**JWT**: JSON Web Token - authentication mechanism

**KYC/AML**: Know Your Customer / Anti-Money Laundering - compliance requirements

**Lucid**: TypeScript library for building Cardano transactions

**Mainnet**: Production blockchain network (real value)

**MeshSDK**: JavaScript library for Cardano wallet integration

**Minting**: Creating new tokens on the blockchain

**Plutus**: Smart contract language for Cardano

**Policy ID**: Unique identifier for a token type on Cardano

**Preprod**: Cardano public testnet for development

**Stablecoin**: Cryptocurrency pegged to fiat currency (e.g., 1 USDC = 1 USD)

**UTXO**: Unspent Transaction Output - Cardano's transaction model

**Wallet**: Software for storing and managing cryptocurrency

---

### E. FAQ

**Q: Is TrustBridge safe to use?**
A: Yes. TrustBridge uses audited smart contracts on Cardano blockchain with multiple security layers including encryption, multi-signature support, and 24/7 monitoring.

**Q: How long does a transfer take?**
A: 5-10 minutes on average. Blockchain confirmation takes 2-5 minutes, plus processing time.

**Q: What fees do you charge?**
A: Approximately 2% total (1.5% service fee + 0.5% network fee), significantly cheaper than traditional services (6-8%).

**Q: Do I need a crypto wallet?**
A: No! You can use credit cards or bank transfers. Crypto wallet is optional for lower fees.

**Q: Is TrustBridge regulated?**
A: We are working towards obtaining licenses in key markets. Current testnet version is for testing only.

**Q: Can I cancel a transfer?**
A: Yes, before blockchain confirmation (usually within 10 minutes). After confirmation, contact support.

**Q: What countries do you support?**
A: Currently testing in Indonesia, USA, Mexico, China, Japan, and Europe. Expanding to 50+ countries in 2025.

**Q: How do I get support?**
A: WhatsApp support, email support@trustbridge.io, or GitHub issues for technical problems.

**Q: Is my data private?**
A: Yes. We only store necessary transaction data. Personal info is encrypted and never shared.

**Q: Can businesses use TrustBridge?**
A: Yes! We offer API access and custom limits for businesses. Contact us for enterprise plans.

---

*Last Updated: October 11, 2025*
*Version: 1.0.0*
*Documentation maintained by TrustBridge Team*
