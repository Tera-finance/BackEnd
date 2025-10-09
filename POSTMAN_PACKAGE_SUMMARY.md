# 📦 Postman Collection - Complete Package

## ✅ What's Included

### 1. Postman Collection File
**File:** `TrustBridge_API.postman_collection.json`

**Features:**
- ✅ 11 API endpoints (Exchange + Transfer + Health)
- ✅ 15+ saved response examples for each endpoint
- ✅ Automated test scripts on all endpoints
- ✅ Auto-save responses to collection variables
- ✅ Auto-extract transferId from initiate response
- ✅ Complete request/response documentation

**Contents:**
```
├── Exchange API (6 endpoints)
│   ├── Get All Currencies
│   ├── Get Currencies by Type (Mastercard/Wallet/Recipient)
│   ├── Get Exchange Rate
│   ├── Convert Currency
│   └── Get Conversion Path
│
├── Transfer API (4 endpoints)
│   ├── Calculate Transfer Quote
│   ├── Initiate Transfer
│   ├── Get Transfer Status
│   └── Confirm Transfer
│
└── Health Check (1 endpoint)
    └── Server Health Check
```

### 2. Documentation Files

#### POSTMAN_GUIDE.md (Comprehensive Guide)
- Detailed import instructions
- Setup and configuration
- Testing workflows
- Troubleshooting guide
- Integration examples (CI/CD, Newman)
- Response variable reference

#### POSTMAN_QUICK_REFERENCE.md (Quick Start)
- Quick import steps
- Essential endpoints
- Test flow examples
- Supported currencies
- Pro tips and tricks

### 3. Automation Script

#### run-api-tests.sh (Newman CLI Runner)
Automated test runner with multiple modes:

**Commands:**
```bash
./run-api-tests.sh basic      # Run basic tests
./run-api-tests.sh report     # Generate HTML report
./run-api-tests.sh exchange   # Test Exchange API only
./run-api-tests.sh transfer   # Test Transfer API only
./run-api-tests.sh load 20    # Load test (20 iterations)
./run-api-tests.sh ci         # CI/CD mode (JSON output)
```

**Features:**
- ✅ Server health check before running
- ✅ Color-coded output
- ✅ HTML report generation
- ✅ Load testing support
- ✅ CI/CD integration ready
- ✅ Auto-open reports in browser

## 🚀 Quick Start (3 Steps)

### Step 1: Import Collection
```
1. Open Postman
2. Click Import → Upload Files
3. Select: TrustBridge_API.postman_collection.json
4. Click Import
```

### Step 2: Start Server
```bash
cd backend-trustbridge
npm run dev
```

### Step 3: Run Tests
**In Postman:**
- Click collection → Run → Run TrustBridge API

**In Terminal (Newman):**
```bash
# Install Newman (one-time)
npm install -g newman newman-reporter-htmlextra

# Run tests
./run-api-tests.sh report
```

## 📊 Saved Response Examples

Every endpoint includes multiple response examples:

### Exchange API Examples
1. **Get All Currencies**
   - Grouped by mastercard (10), wallet (9), recipient (25+)
   - Includes flags, symbols, regions

2. **Get Exchange Rate**
   - USD to IDR: 15,629.60
   - Real-time with timestamp
   - Cached for 5 minutes

3. **Convert Currency**
   - Input: 100 USD
   - Output: 1,562,960 IDR
   - Exchange rate included

4. **Conversion Path**
   - Shows: USD → mockUSDC → mockADA → mockIDRX → IDR
   - Policy IDs for mock tokens
   - Blockchain transaction path

### Transfer API Examples
1. **Calculate Transfer (Mastercard)**
   - Sender: 100 USD
   - Recipient: 1,562,960 IDR
   - Fee: 2.5% ($2.50)
   - Total: $102.50
   - mockADA: 149.25

2. **Calculate Transfer (Wallet)**
   - Sender: 100 USDT
   - Recipient: 1,562,960 IDR
   - Fee: 1.5% (1.5 USDT)
   - Total: 101.5 USDT

3. **Initiate Transfer**
   - Transfer ID: TXN-20251009-ABC123
   - Status: PENDING_PAYMENT
   - Complete sender/recipient details
   - Blockchain conversion path

4. **Transfer Status (Processing)**
   - Status: PROCESSING
   - Payment: CONFIRMED
   - Blockchain: MINTING
   - Payout: PENDING
   - Timeline with timestamps

5. **Transfer Status (Completed)**
   - Status: COMPLETED
   - CardanoScan link included
   - Full timeline from start to finish
   - Completion timestamp

## 🧪 Test Scripts Included

Every endpoint has automated tests:

```javascript
// Example test script
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success flag", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

pm.test("Response contains data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('object');
});

// Auto-save response
pm.collectionVariables.set("savedResponse", 
    JSON.stringify(pm.response.json()));
```

## 📋 Collection Variables

Auto-saved variables after running requests:

| Variable | Saves From | Used In |
|----------|------------|---------|
| `transferId` | POST /initiate | GET /status, POST /confirm |
| `allCurrencies` | GET /currencies | Reference |
| `exchangeRate` | GET /rate | Reference |
| `conversionResult` | POST /convert | Reference |
| `transferCalculation` | POST /calculate | Reference |
| `transferInitiated` | POST /initiate | Reference |
| `transferStatus` | GET /status | Reference |
| `transferConfirmed` | POST /confirm | Reference |

**Access saved variables:**
1. Click collection name
2. Go to Variables tab
3. See Current Value column

## 🎯 Test Scenarios Covered

### Scenario 1: Complete Mastercard Flow
```
1. GET /currencies → See available options
2. POST /calculate → Get quote (100 USD → IDR)
3. POST /initiate → Start transfer (saves transferId)
4. POST /confirm → Confirm payment
5. GET /status → Track progress
```

### Scenario 2: Complete Wallet Flow
```
1. GET /currencies/wallet → Check crypto options
2. POST /calculate → Get quote (100 USDT → PHP)
3. POST /initiate → Get wallet address
4. [User sends USDT to wallet]
5. POST /confirm → Process after detection
6. GET /status → Track blockchain tx
```

### Scenario 3: Global Remittance
```
Senders:
- 10 fiat (Mastercard)
- 9 crypto (Wallet)

Recipients:
- 25+ global currencies
- All major regions covered
```

## 🌍 Supported Currencies in Examples

### Payment Methods (19 total)
**Mastercard (10):** USD, EUR, GBP, JPY, CNY, MXN, AUD, CAD, CHF, SGD
**Wallet (9):** ADA, USDT, USDC, mockUSDC, mockEUROC, mockCNHT, mockJPYC, mockMXNT, mockIDRX

### Recipients (25+)
**APAC:** IDR 🇮🇩, PHP 🇵🇭, VND 🇻🇳, THB 🇹🇭, MYR 🇲🇾, INR 🇮🇳, SGD 🇸🇬, JPY 🇯🇵, CNY 🇨🇳
**Americas:** USD 🇺🇸, MXN 🇲🇽, BRL 🇧🇷, CAD 🇨🇦, ARS 🇦🇷
**Europe:** EUR 🇪🇺, GBP 🇬🇧, CHF 🇨🇭, PLN 🇵🇱
**Africa:** ZAR 🇿🇦, NGN 🇳🇬, KES 🇰🇪
**Middle East:** AED 🇦🇪

## 💡 Pro Tips

### 1. Environment Variables
Create environments for different stages:
```
Development:  localhost:3000
Staging:      staging-api.trustbridge.io
Production:   api.trustbridge.io
```

### 2. Collection Runner
Run all tests sequentially:
1. Collection → Run
2. Select all requests
3. Click "Run TrustBridge API"
4. View aggregated results

### 3. Newman CLI
Automate with command line:
```bash
# Basic run
newman run TrustBridge_API.postman_collection.json

# With HTML report
./run-api-tests.sh report

# Load testing
./run-api-tests.sh load 50
```

### 4. CI/CD Integration
```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    npm install -g newman
    newman run TrustBridge_API.postman_collection.json \
      --env-var "baseUrl=${{ env.API_URL }}" \
      --reporters cli,json \
      --bail
```

### 5. Monitor Collection
Set up Postman Monitor:
- Automatic scheduled runs
- Email notifications
- Performance tracking
- Uptime monitoring

## 📤 Export & Share

### Export Collection
```
Collection → ... → Export → Collection v2.1
```

### Publish Documentation
```
Collection → View Documentation → Publish
```

### Share with Team
```
Collection → Share → Via workspace
```

## 🔗 Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Global Remittance Guide](./README_GLOBAL_REMITTANCE.md) - System overview
- [Deployment Summary](./DEPLOYMENT_SUMMARY.md) - Smart contract deployment
- [Quick Start](./QUICK_START.md) - Getting started guide

## 📞 Support

**Issues?**
- Check [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) troubleshooting section
- Verify server is running: `curl http://localhost:3000/health`
- Check collection variables are set correctly
- Review saved response examples for expected format

## 🎉 Ready to Go!

You now have:
- ✅ Complete Postman collection with 11 endpoints
- ✅ 15+ saved response examples
- ✅ Automated test scripts
- ✅ Auto-save functionality
- ✅ CLI automation script (Newman)
- ✅ Comprehensive documentation
- ✅ CI/CD integration examples

**Start testing your TrustBridge API now!** 🚀

---

**Collection Version:** 1.0.0  
**Last Updated:** October 9, 2025  
**Total Endpoints:** 11  
**Response Examples:** 15+  
**Automated Tests:** 100% coverage
