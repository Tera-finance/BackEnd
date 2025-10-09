# 🔄 Postman Collection Updates - mockADA Hub Architecture

## Summary of Changes

The Postman collection has been updated to reflect the new **USD → mockADA → Stablecoin** hub architecture.

## ✅ Updated Responses

### 1. **Get Conversion Path** (USD to IDR via mockADA)
**Endpoint:** `GET /api/exchange/path?from=USD&to=IDR`

**Updated Response:**
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "IDR",
    "path": ["USD", "mockUSDC", "mockADA", "mockIDRX", "IDR"],
    "usesMockToken": true,
    "mockTokens": {
      "sender": "mockUSDC",
      "hub": "mockADA",        ← ADDED
      "recipient": "mockIDRX"
    },
    "policyIds": {
      "mockUSDC": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
      "mockADA": "1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93",  ← ADDED
      "mockIDRX": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9"
    }
  }
}
```

**Changes:**
- ✅ Added `hub: "mockADA"` to mockTokens
- ✅ Added mockADA policy ID: `1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93`

---

### 2. **Calculate Transfer** (Mastercard Payment)
**Endpoint:** `POST /api/transfer/calculate`

**Request:**
```json
{
  "senderCurrency": "USD",
  "recipientCurrency": "IDR",
  "amount": 100,
  "paymentMethod": "MASTERCARD"
}
```

**Updated Blockchain Section:**
```json
"blockchain": {
  "usesMockToken": true,
  "senderToken": "mockUSDC",
  "hubToken": "mockADA",           ← Already existed in path, now explicit
  "recipientToken": "mockIDRX",
  "path": ["USD", "mockUSDC", "mockADA", "mockIDRX", "IDR"],
  "policyIds": {                   ← Added in future update
    "mockUSDC": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
    "mockADA": "1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93",
    "mockIDRX": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9"
  }
}
```

---

### 3. **Calculate Transfer** (Wallet Payment)
**Endpoint:** `POST /api/transfer/calculate`

**Request:**
```json
{
  "senderCurrency": "USDT",
  "recipientCurrency": "IDR",
  "amount": 100,
  "paymentMethod": "WALLET"
}
```

**Updated Blockchain Section:**
```json
"blockchain": {
  "usesMockToken": true,
  "senderToken": null,              // USDT is real, no mock needed
  "hubToken": "mockADA",            ← Already existed in path
  "recipientToken": "mockIDRX",
  "path": ["USDT", "mockADA", "mockIDRX", "IDR"],
  "policyIds": {                    ← Added in future update
    "mockADA": "1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93",
    "mockIDRX": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9"
  }
}
```

---

### 4. **Initiate Transfer** (Mastercard)
**Endpoint:** `POST /api/transfer/initiate`

**Updated Response:**
```json
"blockchain": {
  "mockADAAmount": 149.25,
  "senderToken": "mockUSDC",
  "hubToken": "mockADA",            ← ADDED
  "recipientToken": "mockIDRX",
  "policyIds": {
    "mockUSDC": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
    "mockADA": "1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93",  ← ADDED
    "mockIDRX": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9"
  }
}
```

---

### 5. **Initiate Transfer** (Wallet)
**Endpoint:** `POST /api/transfer/initiate`

**Updated Response:**
```json
"blockchain": {
  "mockADAAmount": 149.25,
  "hubToken": "mockADA",            ← ADDED
  "recipientToken": null,
  "walletAddress": "addr1...",
  "policyIds": {
    "mockADA": "1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93"  ← ADDED
  }
}
```

---

## 📋 Key Policy IDs

All mock tokens with their policy IDs for reference:

| Token | Policy ID | CardanoScan |
|-------|-----------|-------------|
| **mockADA** | `1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93` | [View](https://preprod.cardanoscan.io/tokenPolicy/1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93) |
| mockUSDC | `4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d` | [View](https://preprod.cardanoscan.io/tokenPolicy/4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d) |
| mockCNHT | `c7bdad55621e968c6ccb0967493808c9ab50601b3b9aec77b2ba6888` | [View](https://preprod.cardanoscan.io/tokenPolicy/c7bdad55621e968c6ccb0967493808c9ab50601b3b9aec77b2ba6888) |
| mockEUROC | `f766f151787a989166869375f4c57cfa36c533241033c8000a5481c1` | [View](https://preprod.cardanoscan.io/tokenPolicy/f766f151787a989166869375f4c57cfa36c533241033c8000a5481c1) |
| mockIDRX | `5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9` | [View](https://preprod.cardanoscan.io/tokenPolicy/5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9) |
| mockJPYC | `7725300e8d414e0fccad0a562e3a9c585970e84e7e92d422111e1e29` | [View](https://preprod.cardanoscan.io/tokenPolicy/7725300e8d414e0fccad0a562e3a9c585970e84e7e92d422111e1e29) |
| mockMXNT | `c73682653bd1ff615e54a3d79c00068e1f4977a7a9628f39add50dc3` | [View](https://preprod.cardanoscan.io/tokenPolicy/c73682653bd1ff615e54a3d79c00068e1f4977a7a9628f39add50dc3) |

---

## 🔄 Updated Flow Visualization

### Before (Direct Swap):
```
USD → mockUSDC → mockIDRX → IDR
```

### After (Hub-Spoke Model):
```
USD → mockUSDC → mockADA → mockIDRX → IDR
              ↗           ↘
         (Step 1)      (Step 2)
         Swap to       Swap to
         hub token     recipient token
```

---

## 🧪 Testing the Updated Collection

### Import to Postman
1. Open Postman
2. Click **Import**
3. Select `TrustBridge_API.postman_collection.json`
4. Collection will be updated with new responses

### Test Endpoints

#### 1. Test Conversion Path
```bash
GET {{baseUrl}}/api/exchange/path?from=USD&to=IDR
```

**Expected:** Shows mockADA in path and policy IDs

#### 2. Test Transfer Calculation
```bash
POST {{baseUrl}}/api/transfer/calculate
{
  "senderCurrency": "USD",
  "recipientCurrency": "IDR",
  "amount": 100,
  "paymentMethod": "MASTERCARD"
}
```

**Expected:** Blockchain section includes:
- `hubToken: "mockADA"`
- mockADA policy ID
- mockADAAmount calculation

#### 3. Test Transfer Initiation
```bash
POST {{baseUrl}}/api/transfer/initiate
{
  "senderCurrency": "USD",
  "recipientCurrency": "IDR",
  "amount": 100,
  "paymentMethod": "MASTERCARD",
  "recipient": {...}
}
```

**Expected:** Transfer created with mockADA hub token info

---

## 📝 Changes Summary

### What Changed:
1. ✅ Added `mockADA` as hub token in all conversion paths
2. ✅ Added mockADA policy ID to all blockchain responses
3. ✅ Updated token flow to show hub-spoke architecture
4. ✅ Maintained backward compatibility with existing fields

### What Stayed the Same:
- ✅ All API endpoints (no breaking changes)
- ✅ Request formats
- ✅ Response structure (only additions, no removals)
- ✅ Test scripts and validations

---

## 🔜 Next Steps for Backend API

To fully implement the hub architecture, the backend API services should:

1. **Update Exchange Service** (`exchange.service.ts`)
   - Add mockADA to conversion path calculations
   - Return hub token in responses

2. **Update Transfer Service** (`transfer.service.ts`)
   - Include mockADA policy ID in blockchain data
   - Calculate mockADA intermediate amounts

3. **Update Blockchain Service** (`blockchain.service.ts`)
   - Implement two-step swap: Token → mockADA → Token
   - Use mockADA policy ID for transactions

---

## 📚 Related Documentation

- [mockADA Hub Architecture](../MOCKADA_HUB_ARCHITECTURE.md)
- [Testing Guide - New Flow](../TESTING_GUIDE_NEW_flow.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Postman Guide](./POSTMAN_GUIDE.md)

---

**Last Updated:** October 9, 2025  
**Collection Version:** 1.0.0  
**mockADA Policy ID:** `1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93`
