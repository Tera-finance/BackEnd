# 🔄 Updated Flow: Direct to mockADA + Transaction History

## Summary of Changes

### 1. **Simplified Flow - Direct to mockADA**

**Old Flow:**
```
USD → mockUSDC → mockADA → mockIDRX → IDR
```

**New Flow:**
```
USD → mockADA → mockIDRX → IDR
      ↑
   Direct mint (no intermediate sender token)
```

### 2. **New API Endpoints Added**

#### GET `/api/transfer/history`
Get transaction history with blockchain details

**Query Parameters:**
- `userId` - Filter by user ID
- `limit` - Number of records (default: 10)
- `offset` - Pagination offset (default: 0)
- `status` - Filter by status (completed, processing, pending)
- `paymentMethod` - Filter by payment method (MASTERCARD, WALLET)

**Response:**
```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "transferId": "TXN-20251009-ABC123",
        "status": "completed",
        "paymentMethod": "MASTERCARD",
        "sender": {
          "currency": "USD",
          "amount": 100,
          "symbol": "$"
        },
        "recipient": {
          "name": "John Doe",
          "currency": "IDR",
          "amount": 1562960,
          "symbol": "Rp",
          "bank": "Bank BNI",
          "account": "****7890"
        },
        "blockchain": {
          "path": ["USD", "mockADA", "mockIDRX", "IDR"],
          "mockADAAmount": 149.25,
          "hubToken": "mockADA",
          "recipientToken": "mockIDRX",
          "txHash": "8c6af18b...",
          "cardanoScanUrl": "https://preprod.cardanoscan.io/transaction/8c6af18b...",
          "policyIds": {
            "mockADA": "1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93",
            "mockIDRX": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9"
          }
        },
        "fees": {
          "percentage": 1.5,
          "amount": 1.5
        },
        "createdAt": "2025-10-08T10:30:00.000Z",
        "completedAt": "2025-10-08T10:35:00.000Z"
      }
    ],
    "total": 3,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET `/api/transfer/details/:transferId`
Get complete transfer details with all blockchain transactions

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "TXN-20251009-ABC123",
    "status": "completed",
    "paymentMethod": "MASTERCARD",
    "sender": {
      "currency": "USD",
      "amount": 100,
      "symbol": "$",
      "totalCharged": 101.5
    },
    "recipient": {
      "name": "John Doe",
      "currency": "IDR",
      "amount": 1562960,
      "symbol": "Rp",
      "bank": "Bank BNI",
      "account": "1234567890"
    },
    "blockchain": {
      "path": ["USD", "mockADA", "mockIDRX", "IDR"],
      "mockADAAmount": 149.25,
      "hubToken": "mockADA",
      "recipientToken": "mockIDRX",
      "policyIds": {
        "mockADA": "1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93",
        "mockIDRX": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9"
      },
      "transactions": [
        {
          "step": 1,
          "action": "Mint mockADA",
          "amount": "149.25 mockADA",
          "txHash": "8c6af18b5d96d8de5cd5acb6e3e3b90ddea5eb90d9d69f4084e1ee85ec12acf0",
          "cardanoScanUrl": "https://preprod.cardanoscan.io/transaction/8c6af18b...",
          "timestamp": "2025-10-09T07:45:30.000Z"
        },
        {
          "step": 2,
          "action": "Swap mockADA to mockIDRX",
          "from": "149.25 mockADA",
          "to": "1,562,960 mockIDRX",
          "txHash": "c6e9e0d32f73f7eb6cc26dd1e0b73e58da2a6d8c2ebfb7a11285b2db7b31e5ff",
          "cardanoScanUrl": "https://preprod.cardanoscan.io/transaction/c6e9e0d...",
          "timestamp": "2025-10-09T07:46:00.000Z"
        }
      ]
    },
    "fees": {
      "percentage": 1.5,
      "amount": 1.5
    },
    "timeline": [
      {
        "status": "INITIATED",
        "timestamp": "2025-10-09T07:45:00.000Z"
      },
      {
        "status": "PAYMENT_CONFIRMED",
        "timestamp": "2025-10-09T07:45:30.000Z"
      },
      {
        "status": "MINTED_MOCKADA",
        "timestamp": "2025-10-09T07:45:35.000Z"
      },
      {
        "status": "SWAPPED_TO_RECIPIENT_TOKEN",
        "timestamp": "2025-10-09T07:46:00.000Z"
      },
      {
        "status": "BANK_PAYOUT_INITIATED",
        "timestamp": "2025-10-09T07:46:30.000Z"
      },
      {
        "status": "COMPLETED",
        "timestamp": "2025-10-09T07:50:00.000Z"
      }
    ],
    "createdAt": "2025-10-09T07:45:00.000Z",
    "completedAt": "2025-10-09T07:50:00.000Z"
  }
}
```

## 3. **Updated Flow Diagram**

### Direct mockADA Flow (Mastercard)

```
Step 1: User Payment
USD $100 (Mastercard)
   ↓
Step 2: Mint mockADA directly
149.25 mockADA minted
Policy: 1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93
Tx: 8c6af18b5d96d8de5cd5acb6e3e3b90ddea5eb90d9d69f4084e1ee85ec12acf0
   ↓
Step 3: Swap mockADA → mockIDRX
149.25 mockADA → 1,562,960 mockIDRX
Tx: c6e9e0d32f73f7eb6cc26dd1e0b73e58da2a6d8c2ebfb7a11285b2db7b31e5ff
   ↓
Step 4: Bank Payout
Rp 1,562,960 → Bank BNI
```

### Direct mockADA Flow (Wallet)

```
Step 1: User Payment
100 USDT (Wallet)
   ↓
Step 2: Convert to mockADA
100 USDT → 298.50 mockADA
Policy: 1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93
   ↓
Step 3: Swap mockADA → Recipient Currency
(If stablecoin available)
   ↓
Step 4: Bank Payout
```

## 4. **Postman Collection Updates**

### New Endpoints Added:

1. **GET /api/transfer/history**
   - Query parameters for filtering
   - Returns paginated transaction list
   - Includes blockchain details for each transfer

2. **GET /api/transfer/details/:transferId**
   - Complete transaction details
   - Step-by-step blockchain transactions
   - Full timeline of statuses

### Updated Responses:

All blockchain paths now show direct mockADA flow:
- ✅ `["USD", "mockADA", "mockIDRX", "IDR"]` 
- ❌ ~~`["USD", "mockUSDC", "mockADA", "mockIDRX", "IDR"]`~~ (removed)

## 5. **Key Benefits**

### Simplified Architecture
- **Before:** 3 token operations (mint sender → swap to ADA → swap to recipient)
- **After:** 2 token operations (mint ADA → swap to recipient)

### Reduced Complexity
- No need for sender-specific mock tokens (mockUSDC, mockEUROC, etc.)
- All fiat currencies go directly to mockADA
- Only mockADA and recipient tokens are used

### Cost Savings
- 1 less transaction per transfer
- Lower gas fees
- Faster processing time

## 6. **Implementation Checklist**

### Backend API
- [x] Add `/api/transfer/history` endpoint
- [x] Add `/api/transfer/details/:transferId` endpoint
- [x] Update transfer flow to mint mockADA directly
- [x] Add mock transaction data with blockchain details
- [ ] Connect to database for persistence
- [ ] Implement actual blockchain integration

### Postman Collection
- [x] Add history endpoint with saved responses
- [x] Add transfer details endpoint
- [x] Update all paths to remove mockUSDC
- [x] Add blockchain transaction examples
- [ ] Fix JSON structure (current file has syntax errors)

### Smart Contracts
- [x] mockADA deployed: `1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93`
- [x] All stablecoins deployed
- [ ] Test direct minting of mockADA from fiat
- [ ] Update swap scripts

## 7. **Testing the New Flow**

### Test Direct mockADA Minting

```bash
cd /home/fabian/Code/web3/cardano/TrustBridge/be-offchain

# Edit mint-tokens.ts
# TOKEN='mockADA'
# AMOUNT=149_250000  # 149.25 ADA for $100 USD

npm run mint
```

### Test History Endpoint

```bash
curl http://localhost:3000/api/transfer/history?limit=10&offset=0
```

### Test Transfer Details

```bash
curl http://localhost:3000/api/transfer/details/TXN-20251009-ABC123
```

## 8. **Next Steps**

1. **Fix Postman Collection JSON**
   - Restore from backup or recreate
   - Add history endpoints properly
   - Update all paths to direct mockADA

2. **Database Integration**
   - Create transfers table
   - Store blockchain transactions
   - Implement history queries

3. **Blockchain Integration**
   - Implement direct mockADA minting
   - Update swap logic
   - Add transaction tracking

4. **Frontend Updates**
   - Show simplified flow diagram
   - Display transaction history
   - Add blockchain explorer links

---

**Last Updated:** October 9, 2025  
**mockADA Policy ID:** `1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93`  
**Flow:** Direct USD → mockADA → Stablecoin → Bank
