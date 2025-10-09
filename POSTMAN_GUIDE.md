# Postman Collection Guide - TrustBridge API

## 📦 Import Collection

### Method 1: Import JSON File
1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files**
4. Choose `TrustBridge_API.postman_collection.json`
5. Click **Import**

### Method 2: Import from URL (if hosted)
1. Click **Import** → **Link**
2. Paste the URL to the collection file
3. Click **Continue** → **Import**

## 🔧 Setup

### 1. Set Base URL
The collection uses a variable `{{baseUrl}}` which defaults to `http://localhost:3000`

To change it:
1. Click on the collection name
2. Go to **Variables** tab
3. Update `baseUrl` value
4. Click **Save**

**Example values:**
- Local: `http://localhost:3000`
- Production: `https://api.trustbridge.io`
- Staging: `https://staging-api.trustbridge.io`

### 2. Environment Variables
The collection uses these variables:
- `baseUrl` - API base URL
- `transferId` - Auto-saved from transfer initiation

## 📋 API Endpoints Overview

### Exchange API (6 endpoints)
1. **Get All Currencies** - Returns all supported currencies grouped by type
2. **Get Currencies by Type** - Filter by mastercard/wallet/recipient
3. **Get Exchange Rate** - Real-time rate between two currencies
4. **Convert Currency** - Convert amount with current rate
5. **Get Conversion Path** - Shows blockchain conversion path

### Transfer API (4 endpoints)
1. **Calculate Transfer** - Get quote without initiating
2. **Initiate Transfer** - Start new transfer
3. **Get Transfer Status** - Check transfer progress
4. **Confirm Transfer** - Confirm payment and process

### Health Check (1 endpoint)
- **Health Check** - Verify API is running

## 🧪 Testing Flow

### Flow 1: Get Exchange Rate
```
1. Get All Currencies
   → See available currencies
   
2. Get Exchange Rate
   → Query: from=USD&to=IDR
   → Get current rate
   
3. Convert Currency
   → Body: {"amount": 100, "from": "USD", "to": "IDR"}
   → See converted amount
```

### Flow 2: Calculate Transfer Quote
```
1. Calculate Transfer
   → Body: {
       "senderCurrency": "USD",
       "recipientCurrency": "IDR",
       "amount": 100,
       "paymentMethod": "MASTERCARD"
     }
   → Get complete quote with fees
```

### Flow 3: Complete Transfer (Mastercard)
```
1. Initiate Transfer
   → Body: {
       "paymentMethod": "MASTERCARD",
       "senderCurrency": "USD",
       "senderAmount": 100,
       "recipientName": "John Doe",
       "recipientCurrency": "IDR",
       "recipientBank": "Bank BNI",
       "recipientAccount": "1234567890",
       "cardDetails": {...}
     }
   → Saves transferId automatically
   
2. Confirm Transfer
   → Uses saved {{transferId}}
   → Body: {"paymentConfirmation": {...}}
   → Processes payment
   
3. Get Transfer Status
   → Uses saved {{transferId}}
   → Track progress
```

### Flow 4: Complete Transfer (Wallet)
```
1. Initiate Transfer
   → Body: {
       "paymentMethod": "WALLET",
       "senderCurrency": "USDT",
       "senderAmount": 100,
       "recipientName": "Jane Smith",
       "recipientCurrency": "PHP",
       "recipientBank": "BDO",
       "recipientAccount": "9876543210"
     }
   → Returns wallet address for payment
   
2. [User sends crypto to wallet address]

3. Confirm Transfer
   → Once payment detected
   
4. Get Transfer Status
   → Track blockchain processing
```

## 📊 Saved Responses

Each endpoint has **pre-saved response examples** showing expected data structure:

### Exchange API Responses
- ✅ All currencies grouped by type (mastercard, wallet, recipient)
- ✅ Exchange rates with timestamp
- ✅ Conversion results with exchange rate
- ✅ Conversion path through blockchain

### Transfer API Responses
- ✅ Transfer calculations with fees breakdown
- ✅ Initiated transfer with transfer ID
- ✅ Transfer status at different stages (pending, processing, completed)
- ✅ Confirmation response with next steps

### Response Examples Include:
1. **Mastercard Payment** - 10 fiat currencies
2. **Wallet Payment** - 9 crypto currencies  
3. **Global Recipients** - 25+ bank payout currencies
4. **Blockchain Path** - mockADA conversion details
5. **Mock Tokens** - Policy IDs for Cardano contracts

## 🔍 Test Scripts

All endpoints include **automated test scripts** that:
- ✅ Verify status code is 200
- ✅ Check response structure
- ✅ Validate data types
- ✅ **Save responses to collection variables**

### Viewing Saved Responses
1. Click on collection name
2. Go to **Variables** tab
3. See saved responses in Current Value column:
   - `allCurrencies`
   - `exchangeRate`
   - `conversionResult`
   - `transferCalculation`
   - `transferInitiated`
   - `transferStatus`
   - `transferConfirmed`

## 📝 Sample Test Cases

### Test Case 1: USD to IDR Transfer (Mastercard)
```
Endpoint: POST /api/transfer/calculate
Body:
{
  "senderCurrency": "USD",
  "recipientCurrency": "IDR",
  "amount": 100,
  "paymentMethod": "MASTERCARD"
}

Expected Response:
{
  "success": true,
  "data": {
    "sender": {"amount": 100, "currency": "USD"},
    "recipient": {"amount": 1562960, "currency": "IDR"},
    "fees": {"percentage": 2.5, "amount": 2.5},
    "blockchain": {
      "senderToken": "mockUSDC",
      "recipientToken": "mockIDRX"
    }
  }
}
```

### Test Case 2: USDT to PHP Transfer (Wallet)
```
Endpoint: POST /api/transfer/calculate
Body:
{
  "senderCurrency": "USDT",
  "recipientCurrency": "PHP",
  "amount": 100,
  "paymentMethod": "WALLET"
}

Expected Response:
{
  "success": true,
  "data": {
    "sender": {"amount": 100, "currency": "USDT"},
    "recipient": {"amount": 5618, "currency": "PHP"},
    "fees": {"percentage": 1.5, "amount": 1.5},
    "blockchain": {
      "senderToken": null,
      "recipientToken": null
    }
  }
}
```

### Test Case 3: Get Real-time Exchange Rate
```
Endpoint: GET /api/exchange/rate?from=USD&to=IDR

Expected Response:
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "IDR",
    "rate": 15629.60,
    "timestamp": "2025-10-09T07:45:00.000Z"
  }
}
```

## 🚀 Running Collection Tests

### Run All Tests
1. Click on collection name
2. Click **Run** button (or three dots → Run collection)
3. Select all endpoints
4. Click **Run TrustBridge API**
5. View test results

### Run Specific Folder
1. Right-click on folder (Exchange API / Transfer API)
2. Click **Run folder**
3. View results

### Monitor Collection (Optional)
1. Set up Postman Monitor
2. Schedule automatic test runs
3. Get email notifications on failures

## 📈 Response Collection Variables

After running requests, these variables are automatically saved:

| Variable | Source Endpoint | Usage |
|----------|----------------|-------|
| `transferId` | POST /api/transfer/initiate | Used in status & confirm endpoints |
| `allCurrencies` | GET /api/exchange/currencies | Reference for available currencies |
| `exchangeRate` | GET /api/exchange/rate | Current rate data |
| `conversionResult` | POST /api/exchange/convert | Conversion calculation |
| `transferCalculation` | POST /api/transfer/calculate | Quote with fees |
| `transferInitiated` | POST /api/transfer/initiate | Transfer details |
| `transferStatus` | GET /api/transfer/status/:id | Current status |
| `transferConfirmed` | POST /api/transfer/confirm/:id | Confirmation result |

## 🐛 Troubleshooting

### Issue: 404 Not Found
**Solution:** Ensure server is running on correct port
```bash
cd backend-trustbridge
npm run dev
```

### Issue: Connection Refused
**Solution:** Check `baseUrl` variable matches your server
```
localhost:3000 (local)
0.0.0.0:3000 (Docker)
api.trustbridge.io (production)
```

### Issue: Validation Errors
**Solution:** Check request body matches schema in saved examples

### Issue: transferId not found
**Solution:** Run "Initiate Transfer" first to save transferId variable

## 💡 Tips

1. **Use Examples** - Each endpoint has saved response examples
2. **Auto-save Variables** - transferId is automatically saved
3. **Test Scripts** - All endpoints validate responses automatically
4. **Environment Setup** - Create separate environments for dev/staging/prod
5. **Collection Runner** - Run all tests with one click
6. **Export Results** - Share test results with team

## 📤 Exporting Test Results

### Export Collection Run
1. Run collection
2. Click **Export Results**
3. Save as JSON or HTML
4. Share with team

### Export Collection Variables
1. Click collection name
2. Variables tab
3. Copy saved response data
4. Use in documentation

## 🔗 Integration Examples

### Use in CI/CD (Newman)
```bash
npm install -g newman
newman run TrustBridge_API.postman_collection.json \
  --env-var "baseUrl=http://localhost:3000"
```

### Generate API Documentation
1. Click collection → View Documentation
2. Click **Publish**
3. Share public link

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Global Remittance Guide](./README_GLOBAL_REMITTANCE.md)
- [Deployment Summary](./DEPLOYMENT_SUMMARY.md)

---

**Collection Version:** 1.0.0  
**Last Updated:** October 9, 2025  
**Total Endpoints:** 11  
**Saved Response Examples:** 15+
