# TrustBridge API Documentation

## Base URL
```
http://localhost:3000/api
```

## Table of Contents
1. [Exchange API](#exchange-api)
2. [Transfer API](#transfer-api)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)

---

## Exchange API

### Get All Supported Currencies
Get list of all supported currencies categorized by payment method.

**Endpoint:** `GET /exchange/currencies`

**Response:**
```json
{
  "success": true,
  "data": {
    "mastercard": [
      {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "flag": "🇺🇸",
        "type": "fiat"
      }
    ],
    "wallet": [
      {
        "code": "ADA",
        "name": "Cardano",
        "symbol": "₳",
        "type": "crypto"
      }
    ],
    "recipient": [
      {
        "code": "IDR",
        "name": "Indonesian Rupiah",
        "symbol": "Rp",
        "flag": "🇮🇩",
        "region": "APAC",
        "mockToken": "mockIDRX"
      }
    ]
  }
}
```

---

### Get Exchange Rate
Get real-time exchange rate between two currencies.

**Endpoint:** `GET /exchange/rate?from=USD&to=IDR`

**Query Parameters:**
- `from` (string, required): Source currency code
- `to` (string, required): Target currency code

**Response:**
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "IDR",
    "rate": 15629.60,
    "timestamp": "2025-10-09T10:30:00.000Z"
  }
}
```

---

### Convert Currency
Convert amount between currencies.

**Endpoint:** `POST /exchange/convert`

**Request Body:**
```json
{
  "amount": 100,
  "from": "USD",
  "to": "IDR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalAmount": 100,
    "originalCurrency": "USD",
    "convertedAmount": 1562960,
    "convertedCurrency": "IDR",
    "exchangeRate": 15629.60,
    "timestamp": "2025-10-09T10:30:00.000Z"
  }
}
```

---

### Get Transfer Quote
Get complete transfer quote including fees and conversion details.

**Endpoint:** `POST /exchange/quote`

**Request Body:**
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
    },
    "timestamp": "2025-10-09T10:30:00.000Z"
  }
}
```

---

### Get ADA Prices
Get current ADA price in multiple fiat currencies.

**Endpoint:** `GET /exchange/ada-price`

**Response:**
```json
{
  "success": true,
  "data": {
    "prices": {
      "usd": 0.67,
      "eur": 0.62,
      "jpy": 98.0,
      "cny": 4.85,
      "idr": 10500,
      "gbp": 0.54,
      "mxn": 13.2
    },
    "timestamp": "2025-10-09T10:30:00.000Z"
  }
}
```

---

### Get Crypto Price
Get specific cryptocurrency price in USD.

**Endpoint:** `GET /exchange/crypto-price/:symbol`

**Example:** `GET /exchange/crypto-price/USDT`

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "USDT",
    "price": 1.0,
    "currency": "USD",
    "timestamp": "2025-10-09T10:30:00.000Z"
  }
}
```

---

## Transfer API

### Initiate Transfer
Start a new cross-border transfer.

**Endpoint:** `POST /transfer/initiate`

**Request Body (MASTERCARD):**
```json
{
  "paymentMethod": "MASTERCARD",
  "senderCurrency": "USD",
  "senderAmount": 300,
  "recipientName": "July",
  "recipientCurrency": "IDR",
  "recipientBank": "BNI",
  "recipientAccount": "1234567890",
  "cardDetails": {
    "number": "4532********1234",
    "cvc": "123",
    "expiry": "12/26"
  }
}
```

**Request Body (WALLET):**
```json
{
  "paymentMethod": "WALLET",
  "senderCurrency": "USDT",
  "senderAmount": 300,
  "recipientName": "July",
  "recipientCurrency": "IDR",
  "recipientBank": "BNI",
  "recipientAccount": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "TXN-1696848000000-abc123",
    "status": "pending",
    "paymentMethod": "MASTERCARD",
    "sender": {
      "currency": "USD",
      "amount": 300,
      "totalAmount": 304.50
    },
    "recipient": {
      "name": "July",
      "currency": "IDR",
      "expectedAmount": 4688880,
      "bank": "BNI",
      "account": "1234567890"
    },
    "conversion": {
      "adaAmount": 447.76,
      "exchangeRate": 15629.60,
      "path": ["USD", "ADA", "IDR"]
    },
    "fees": {
      "percentage": 1.5,
      "amount": 4.50
    },
    "blockchain": {
      "usesMockToken": true,
      "mockToken": "mockIDRX",
      "policyId": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9",
      "txHash": null
    },
    "createdAt": "2025-10-09T10:30:00.000Z"
  },
  "message": "Transfer initiated successfully. Awaiting payment confirmation."
}
```

---

### Confirm Transfer
Confirm payment and process blockchain transaction.

**Endpoint:** `POST /transfer/confirm`

**Request Body:**
```json
{
  "transferId": "TXN-1696848000000-abc123",
  "paymentProof": "payment_intent_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "TXN-1696848000000-abc123",
    "status": "processing",
    "message": "Payment confirmed. Processing blockchain transaction...",
    "estimatedTime": "2-5 minutes"
  }
}
```

---

### Get Transfer Status
Check status of a transfer.

**Endpoint:** `GET /transfer/status/:transferId`

**Example:** `GET /transfer/status/TXN-1696848000000-abc123`

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "TXN-1696848000000-abc123",
    "status": "completed",
    "blockchainTx": "https://preprod.cardanoscan.io/transaction/d9a26cc6...",
    "completedAt": "2025-10-09T10:35:00.000Z"
  }
}
```

**Status Values:**
- `pending` - Transfer initiated, awaiting payment
- `processing` - Payment received, processing blockchain transaction
- `completed` - Transfer completed successfully
- `failed` - Transfer failed
- `cancelled` - Transfer cancelled by user

---

### Calculate Transfer
Calculate transfer amounts without initiating (preview).

**Endpoint:** `POST /transfer/calculate`

**Request Body:**
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
    "senderAmount": 300,
    "senderCurrency": "USD",
    "recipientAmount": 4688880,
    "recipientCurrency": "IDR",
    "exchangeRate": 15629.60,
    "adaAmount": 447.76,
    "fee": {
      "percentage": 1.5,
      "amount": 4.50
    },
    "totalAmount": 304.50
  }
}
```

---

### Get Transfer History
Get user's transfer history.

**Endpoint:** `GET /transfer/history?userId=user123&limit=10&offset=0`

**Query Parameters:**
- `userId` (string, optional): User ID
- `limit` (number, optional): Number of records (default: 10)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "transfers": [],
    "total": 0,
    "limit": 10,
    "offset": 0
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

### Common Errors

**Missing Required Fields:**
```json
{
  "success": false,
  "error": "Missing required fields: amount, from, to"
}
```

**Invalid Currency:**
```json
{
  "success": false,
  "error": "Currency XYZ is not supported"
}
```

**API Rate Limit:**
```json
{
  "success": false,
  "error": "Exchange rate API temporarily unavailable. Using cached rates."
}
```

---

## Usage Examples

### WhatsApp Bot Integration

```javascript
// Get available currencies
const currencies = await fetch('http://localhost:3000/api/exchange/currencies');
const { data } = await currencies.json();

// Calculate transfer
const quote = await fetch('http://localhost:3000/api/transfer/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderCurrency: 'USD',
    recipientCurrency: 'IDR',
    amount: 300,
    paymentMethod: 'MASTERCARD',
  }),
});

const calculation = await quote.json();

// Initiate transfer
const transfer = await fetch('http://localhost:3000/api/transfer/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentMethod: 'MASTERCARD',
    senderCurrency: 'USD',
    senderAmount: 300,
    recipientName: 'July',
    recipientCurrency: 'IDR',
    recipientBank: 'BNI',
    recipientAccount: '1234567890',
    cardDetails: { ... },
  }),
});
```

### Frontend Website Integration

```javascript
// Get real-time exchange rate
const rate = await fetch('http://localhost:3000/api/exchange/rate?from=USD&to=IDR');

// Get transfer quote with fees
const quote = await fetch('http://localhost:3000/api/exchange/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderCurrency: 'USD',
    recipientCurrency: 'IDR',
    amount: 100,
    paymentMethod: 'WALLET',
  }),
});
```

---

## Rate Limiting & Caching

- Exchange rates are cached for **5 minutes**
- After 5 minutes, fresh rates are fetched from APIs
- If external APIs fail, cached/fallback rates are used
- Clear cache manually: `POST /exchange/clear-cache`

---

## External APIs Used

1. **CoinGecko API**
   - Free tier: 10-50 calls/minute
   - Used for: ADA, USDT, USDC prices

2. **ExchangeRate-API**
   - Free tier: 1,500 requests/month
   - Used for: Fiat currency rates

---

For questions or issues, contact the development team.
