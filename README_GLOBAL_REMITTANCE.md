# TrustBridge Global Remittance API

## 🌍 Overview

TrustBridge enables global cross-border remittances with blockchain transparency. Users can send money from any supported currency to any bank account worldwide, with the transaction being processed through Cardano blockchain for security and transparency.

## 🔄 How It Works

```
Sender Payment → mockADA (Blockchain) → Recipient Currency → Bank Account
```

### Flow Example
```
User pays $100 USD (Mastercard)
  ↓ Real-time API conversion
149 mockADA (minted on Cardano)
  ↓ On-chain swap
1,566,125 mockIDRX (if supported currency)
  ↓ Off-ramp service
Recipient receives Rp 1,566,125 IDR in bank
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend-trustbridge
npm install
```

This will install:
- `axios` - HTTP client for API calls
- `node-cache` - In-memory caching for exchange rates
- All existing dependencies

### 2. Environment Setup

No additional API keys needed for basic testing! The system uses:
- **CoinGecko API** (Free tier, no key required)
- **ExchangeRate-API** (Free tier, no key required)

Optional: Add to `.env` if you have API keys for higher limits:
```env
COINGECKO_API_KEY=your_key_here  # Optional
EXCHANGERATE_API_KEY=your_key_here  # Optional
```

### 3. Start Server

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

### 4. Test API

```bash
# Get supported currencies
curl http://localhost:3000/api/exchange/currencies

# Get exchange rate
curl "http://localhost:3000/api/exchange/rate?from=USD&to=IDR"

# Calculate transfer
curl -X POST http://localhost:3000/api/transfer/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "senderCurrency": "USD",
    "recipientCurrency": "IDR",
    "amount": 100,
    "paymentMethod": "MASTERCARD"
  }'
```

## 📡 API Endpoints

### Exchange API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/exchange/currencies` | GET | Get all supported currencies |
| `/api/exchange/rate` | GET | Get exchange rate between currencies |
| `/api/exchange/convert` | POST | Convert amount between currencies |
| `/api/exchange/quote` | POST | Get complete transfer quote with fees |
| `/api/exchange/ada-price` | GET | Get ADA prices in multiple currencies |
| `/api/exchange/crypto-price/:symbol` | GET | Get crypto token price |

### Transfer API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transfer/initiate` | POST | Initiate new transfer |
| `/api/transfer/confirm` | POST | Confirm payment and process |
| `/api/transfer/status/:id` | GET | Get transfer status |
| `/api/transfer/calculate` | POST | Calculate without initiating |
| `/api/transfer/history` | GET | Get transfer history |

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🌐 Supported Currencies

### Sender (Mastercard)
🇺🇸 USD • 🇪🇺 EUR • 🇬🇧 GBP • 🇯🇵 JPY • 🇨🇳 CNY • 🇲🇽 MXN • 🇦🇺 AUD • 🇨🇦 CAD • 🇨🇭 CHF • 🇸🇬 SGD

### Sender (Wallet)
₳ ADA • ₮ USDT • USDC • mockUSDC • mockEUROC • mockCNHT • mockJPYC • mockMXNT • mockIDRX

### Recipient (Bank Transfer)
**Asia Pacific:** 🇮🇩 IDR • 🇵🇭 PHP • 🇻🇳 VND • 🇹🇭 THB • 🇲🇾 MYR • 🇮🇳 INR • 🇸🇬 SGD • 🇯🇵 JPY • 🇨🇳 CNY

**Americas:** 🇺🇸 USD • 🇲🇽 MXN • 🇧🇷 BRL • 🇨🇦 CAD • 🇦🇷 ARS

**Europe:** 🇪🇺 EUR • 🇬🇧 GBP • 🇨🇭 CHF • 🇵🇱 PLN

**Africa & Middle East:** 🇿🇦 ZAR • 🇳🇬 NGN • 🇰🇪 KES • 🇦🇪 AED

## 🔗 WhatsApp Bot Integration

### Example: Get Transfer Quote

```javascript
// In your WhatsApp bot handler
const axios = require('axios');

async function getTransferQuote(senderCurrency, recipientCurrency, amount) {
  const response = await axios.post('http://localhost:3000/api/exchange/quote', {
    senderCurrency,
    recipientCurrency,
    amount,
    paymentMethod: 'MASTERCARD'
  });
  
  return response.data.data;
}

// Usage in WhatsApp flow
const quote = await getTransferQuote('USD', 'IDR', 300);

// Send formatted message
await client.sendMessage(phoneNumber, {
  text: `
📋 Transfer Quote

💱 You Send: ${quote.sender.symbol}${quote.sender.amount} ${quote.sender.currency}
💰 They Receive: ${quote.recipient.symbol}${quote.recipient.amount} ${quote.recipient.currency}

📊 Exchange Rate: 1 ${quote.sender.currency} = ${quote.conversion.exchangeRate} ${quote.recipient.currency}
💳 Fee (${quote.fees.percentage}%): ${quote.fees.amount}
📦 Total: ${quote.fees.totalAmount}

⛓️ Via Blockchain: ${quote.blockchain.usesMockToken ? 'Yes' : 'No'}
${quote.blockchain.mockToken ? `🪙 Token: ${quote.blockchain.mockToken}` : ''}

Type "confirm" to proceed.
  `.trim()
});
```

### Example: Initiate Transfer

```javascript
async function initiateTransfer(transferData) {
  const response = await axios.post('http://localhost:3000/api/transfer/initiate', {
    paymentMethod: transferData.paymentMethod,
    senderCurrency: transferData.senderCurrency,
    senderAmount: transferData.amount,
    recipientName: transferData.recipientName,
    recipientCurrency: transferData.recipientCurrency,
    recipientBank: transferData.recipientBank,
    recipientAccount: transferData.recipientAccount,
    cardDetails: transferData.cardDetails // Only for MASTERCARD
  });
  
  return response.data.data;
}
```

## 🌐 Frontend Website Integration

### Example: Currency Converter Component

```javascript
// React component example
import { useState, useEffect } from 'react';
import axios from 'axios';

function CurrencyConverter() {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('IDR');
  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    const convert = async () => {
      const res = await axios.post('http://localhost:3000/api/exchange/convert', {
        amount,
        from,
        to
      });
      setResult(res.data.data);
    };
    
    convert();
  }, [amount, from, to]);
  
  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
      />
      <select value={from} onChange={(e) => setFrom(e.target.value)}>
        {/* Currency options */}
      </select>
      <span>→</span>
      <select value={to} onChange={(e) => setTo(e.target.value)}>
        {/* Currency options */}
      </select>
      
      {result && (
        <div>
          {amount} {from} = {result.convertedAmount.toFixed(2)} {to}
          <br />
          Rate: {result.exchangeRate}
        </div>
      )}
    </div>
  );
}
```

## 📊 Exchange Rate APIs

### Primary: CoinGecko
- **Endpoint:** `https://api.coingecko.com/api/v3`
- **Rate Limit:** 10-50 calls/minute (free tier)
- **Used For:** ADA, USDT, USDC prices
- **Fallback:** Cached rates

### Secondary: ExchangeRate-API
- **Endpoint:** `https://api.exchangerate-api.com/v4/latest`
- **Rate Limit:** 1,500 requests/month (free tier)
- **Used For:** Fiat currency rates
- **Fallback:** Hardcoded rates

### Caching Strategy
- Rates cached for **5 minutes**
- Automatic refresh on cache miss
- Fallback to cached rates if API fails
- Manual cache clear: `POST /api/exchange/clear-cache`

## 🏗️ Architecture

```
┌─────────────────┐
│  WhatsApp Bot   │
│   or Website    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TrustBridge    │
│   Backend API   │
├─────────────────┤
│ • Exchange API  │
│ • Transfer API  │
└────────┬────────┘
         │
         ├──────────┐
         ▼          ▼
┌──────────────┐ ┌────────────────┐
│ Exchange     │ │   Cardano      │
│ Rate APIs    │ │  Blockchain    │
│              │ │                │
│ • CoinGecko  │ │ • Smart        │
│ • ExchangeR  │ │   Contracts    │
└──────────────┘ │ • mockADA      │
                 │ • Token Swaps  │
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  Recipient     │
                 │  Bank Account  │
                 └────────────────┘
```

## 🔐 Security Features

- ✅ CORS enabled with origin whitelist
- ✅ Helmet.js for HTTP headers security
- ✅ Rate limiting (future)
- ✅ Input validation
- ✅ Error handling with sanitized messages
- ✅ HTTPS recommended for production

## 🧪 Testing

### Test Exchange Rates
```bash
# Get USD to IDR rate
curl "http://localhost:3000/api/exchange/rate?from=USD&to=IDR"

# Get ADA prices
curl "http://localhost:3000/api/exchange/ada-price"
```

### Test Transfer Flow
```bash
# 1. Calculate
curl -X POST http://localhost:3000/api/transfer/calculate \
  -H "Content-Type: application/json" \
  -d '{"senderCurrency":"USD","recipientCurrency":"IDR","amount":100,"paymentMethod":"WALLET"}'

# 2. Initiate
curl -X POST http://localhost:3000/api/transfer/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod":"WALLET",
    "senderCurrency":"USDT",
    "senderAmount":100,
    "recipientName":"John Doe",
    "recipientCurrency":"IDR",
    "recipientBank":"BNI",
    "recipientAccount":"1234567890"
  }'
```

## 📝 Next Steps

1. ✅ **Installed** - Exchange rate API service
2. ✅ **Created** - REST API endpoints
3. ✅ **Documented** - API documentation
4. ⏳ **TODO** - Integrate with WhatsApp bot
5. ⏳ **TODO** - Connect to smart contracts
6. ⏳ **TODO** - Add payment gateway (Stripe)
7. ⏳ **TODO** - Add database persistence
8. ⏳ **TODO** - Add authentication & authorization

## 🐛 Troubleshooting

### API Rate Limits
If you hit rate limits, the system automatically uses cached rates. To upgrade:
- CoinGecko: Get API key for 500 calls/minute
- ExchangeRate: Subscribe for unlimited requests

### Cache Issues
Clear cache manually:
```bash
curl -X POST http://localhost:3000/api/exchange/clear-cache
```

### CORS Errors
Update `app.ts` cors configuration:
```typescript
cors({
  origin: ['http://your-frontend-domain.com'],
  credentials: true
})
```

## 📄 License

MIT

---

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
