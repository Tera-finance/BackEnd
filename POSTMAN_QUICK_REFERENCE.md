# Postman Collection - Quick Reference

## 📥 Import Collection

```bash
# File location
backend-trustbridge/TrustBridge_API.postman_collection.json

# Import in Postman
1. Click Import → Upload Files
2. Select TrustBridge_API.postman_collection.json
3. Click Import
```

## 🎯 Quick Test Flow

### 1️⃣ Check Available Currencies
```http
GET {{baseUrl}}/api/exchange/currencies
```
**Response saves to:** `allCurrencies`

### 2️⃣ Get Exchange Rate  
```http
GET {{baseUrl}}/api/exchange/rate?from=USD&to=IDR
```
**Response saves to:** `exchangeRate`

### 3️⃣ Calculate Transfer Quote
```http
POST {{baseUrl}}/api/transfer/calculate
Content-Type: application/json

{
  "senderCurrency": "USD",
  "recipientCurrency": "IDR",
  "amount": 100,
  "paymentMethod": "MASTERCARD"
}
```
**Response saves to:** `transferCalculation`

### 4️⃣ Initiate Transfer
```http
POST {{baseUrl}}/api/transfer/initiate
Content-Type: application/json

{
  "paymentMethod": "MASTERCARD",
  "senderCurrency": "USD",
  "senderAmount": 100,
  "recipientName": "John Doe",
  "recipientCurrency": "IDR",
  "recipientBank": "Bank BNI",
  "recipientAccount": "1234567890",
  "cardDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2027",
    "cvv": "123"
  }
}
```
**Response saves to:** `transferInitiated`  
**Auto-saves variable:** `transferId`

### 5️⃣ Confirm Transfer
```http
POST {{baseUrl}}/api/transfer/confirm/{{transferId}}
Content-Type: application/json

{
  "paymentConfirmation": {
    "method": "MASTERCARD",
    "transactionId": "pi_123456789"
  }
}
```
**Response saves to:** `transferConfirmed`

### 6️⃣ Check Transfer Status
```http
GET {{baseUrl}}/api/transfer/status/{{transferId}}
```
**Response saves to:** `transferStatus`

## 📊 All Endpoints

| # | Method | Endpoint | Saved Variable | Auto-Test |
|---|--------|----------|----------------|-----------|
| 1 | GET | `/api/exchange/currencies` | ✅ allCurrencies | ✅ |
| 2 | GET | `/api/exchange/currencies/mastercard` | ✅ mastercardCurrencies | ✅ |
| 3 | GET | `/api/exchange/currencies/wallet` | ✅ walletCurrencies | ✅ |
| 4 | GET | `/api/exchange/rate` | ✅ exchangeRate | ✅ |
| 5 | POST | `/api/exchange/convert` | ✅ conversionResult | ✅ |
| 6 | GET | `/api/exchange/conversion-path` | ✅ conversionPath | ✅ |
| 7 | POST | `/api/transfer/calculate` | ✅ transferCalculation | ✅ |
| 8 | POST | `/api/transfer/initiate` | ✅ transferInitiated | ✅ |
| 9 | GET | `/api/transfer/status/:id` | ✅ transferStatus | ✅ |
| 10 | POST | `/api/transfer/confirm/:id` | ✅ transferConfirmed | ✅ |
| 11 | GET | `/health` | - | ✅ |

## 🔑 Key Features

### ✅ Automated Test Scripts
Every endpoint includes:
- Status code validation (200 OK)
- Response structure checks
- Data type validation
- **Automatic response saving to variables**

### ✅ Saved Response Examples
Each endpoint has **15+ pre-saved examples**:
- Success responses
- Different payment methods (Mastercard/Wallet)
- Various currency combinations
- Different transfer statuses

### ✅ Auto-Variables
- `transferId` - Automatically extracted from initiate response
- Collection variables save all responses for reference

### ✅ Complete Documentation
- Request descriptions
- Response examples
- Error scenarios
- Usage notes

## 🧪 Test Scenarios Included

### Scenario 1: Mastercard Payment
```
USD → mockUSDC → mockADA → mockIDRX → IDR Bank
Fee: 2.5%
Status tracking: PENDING → PROCESSING → COMPLETED
```

### Scenario 2: Wallet Payment  
```
USDT → mockADA → mockIDRX → IDR Bank
Fee: 1.5%
Requires wallet confirmation
```

### Scenario 3: Global Remittance
```
Sender: 10 fiat currencies (Mastercard)
Sender: 9 crypto currencies (Wallet)
Recipient: 25+ global currencies (Bank)
```

## 📋 Supported Currencies

### Mastercard (10)
USD, EUR, GBP, JPY, CNY, MXN, AUD, CAD, CHF, SGD

### Wallet (9)
ADA, USDT, USDC, mockUSDC, mockEUROC, mockCNHT, mockJPYC, mockMXNT, mockIDRX

### Recipients (25+)
IDR, PHP, VND, THB, MYR, INR, SGD, JPY, CNY, USD, MXN, BRL, CAD, ARS, EUR, GBP, CHF, PLN, ZAR, NGN, KES, AED, and more...

## 🚀 Quick Commands

### Run Server
```bash
cd backend-trustbridge
npm run dev
```

### Run All Tests (Newman)
```bash
newman run TrustBridge_API.postman_collection.json
```

### Export Collection Variables
```
Collection → Variables → Copy Current Values
```

## 💡 Pro Tips

1. **Run complete flow:** Calculate → Initiate → Confirm → Status
2. **Check saved responses:** Collection Variables tab
3. **Use environment variables:** Create dev/staging/prod environments
4. **Monitor tests:** Set up Postman Monitor for scheduled runs
5. **Generate docs:** Collection → View Documentation → Publish

## 🔗 Documentation Links

- **Full Guide:** [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)
- **API Docs:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Setup Guide:** [README_GLOBAL_REMITTANCE.md](./README_GLOBAL_REMITTANCE.md)

---

**🎯 Ready to Test?**
1. Import collection ✅
2. Start server (`npm run dev`) ✅
3. Run "Get All Currencies" ✅
4. Check response in Variables tab ✅
5. Explore other endpoints! ✅
