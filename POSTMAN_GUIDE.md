# TrustBridge Base Sepolia API - Postman Guide

## Overview

This guide explains how to use the Postman collection for testing the TrustBridge Base Sepolia API.

## Collection File

**File**: `TrustBridge_BaseSepolia_API.postman_collection.json`

## Importing the Collection

### Method 1: Import File
1. Open Postman
2. Click "Import" button (top left)
3. Select the `TrustBridge_BaseSepolia_API.postman_collection.json` file
4. Click "Import"

### Method 2: Drag and Drop
- Drag the JSON file into Postman window

## Collection Variables

The collection includes these variables for easy configuration:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | API base URL |
| `access_token` | (empty) | JWT access token (auto-set on login) |
| `refresh_token` | (empty) | JWT refresh token (auto-set on login) |
| `user_id` | (empty) | Current user ID (auto-set on login) |

### Updating Variables

**Option 1: Collection Level**
1. Right-click collection name
2. Select "Edit"
3. Go to "Variables" tab
4. Update values
5. Click "Save"

**Option 2: Environment** (Recommended for multiple environments)
1. Create new environment: Development, Staging, Production
2. Add same variables with different values
3. Select environment from dropdown

## API Structure

The collection is organized into 6 main folders:

### 1. Health Check
- **Root Health Check**: `GET /`
- **Health Endpoint**: `GET /health`

**Use**: Verify API is running and check network configuration

### 2. Authentication
- **Login or Register**: `POST /api/auth/login`
  - Auto-saves `access_token`, `refresh_token`, `user_id`
- **Refresh Token**: `POST /api/auth/refresh`
  - Auto-updates tokens
- **Get Current User**: `GET /api/auth/me`
- **Logout**: `POST /api/auth/logout`

**Authentication Flow**:
1. Login with WhatsApp number
2. Tokens are automatically saved
3. All authenticated requests use `{{access_token}}`
4. Refresh when token expires

### 3. Blockchain
Complete Base Sepolia network operations:

#### Network Information
- **Network Info**: `GET /api/blockchain/info`
  - Chain ID, RPC URL, block number, gas price
- **Backend Wallet Address**: `GET /api/blockchain/backend-address`
  - Backend wallet address and ETH balance

#### Token Operations
- **Get All Tokens**: `GET /api/blockchain/tokens`
  - Lists all configured token and contract addresses
- **Get Token Info**: `GET /api/blockchain/tokens/:tokenAddress`
  - Name, symbol, decimals for specific token
- **Get Token Balance**: `GET /api/blockchain/balance/:tokenAddress`
  - Balance for any address (defaults to backend wallet)

#### Swap Estimation
- **Estimate Swap (USDC to IDRX)**: `POST /api/blockchain/estimate-swap`
  - Uses RemittanceSwap contract
  - Input: amount in smallest unit (6 decimals for USDC)
- **Estimate Multi-Token Swap**: `POST /api/blockchain/estimate-multi-swap`
  - Uses MultiTokenSwap contract
  - Supports any token pair

#### Transaction Monitoring
- **Get Transaction**: `GET /api/blockchain/tx/:txHash`
  - Transaction details
- **Get Transaction Receipt**: `GET /api/blockchain/tx/:txHash/receipt`
  - Receipt with logs and events
- **Wait for Confirmation**: `GET /api/blockchain/tx/:txHash/wait`
  - Waits for specified confirmations

### 4. Exchange
- **Get Exchange Rates**: `GET /api/exchange/rates`
- **Get Supported Currencies**: `GET /api/exchange/currencies`

### 5. Transfer
- **Initiate Transfer**: `POST /api/transfer/initiate`
- **Get Transfer Status**: `GET /api/transfer/:transferId`

### 6. Transactions
- **Get Transaction History**: `GET /api/transactions`
- **Get Transaction Details**: `GET /api/transactions/:txHash`

## Example Workflows

### Workflow 1: Complete Authentication Flow

```
1. Login or Register
   POST /api/auth/login
   Body: { "whatsappNumber": "+6281234567890", "countryCode": "ID" }
   → Saves access_token automatically

2. Get Current User
   GET /api/auth/me
   → Uses saved access_token

3. Refresh Token (when expired)
   POST /api/auth/refresh
   Body: { "refreshToken": "{{refresh_token}}" }
   → Updates access_token

4. Logout
   POST /api/auth/logout
   → Clears tokens
```

### Workflow 2: Check Network and Token Info

```
1. Check Network Info
   GET /api/blockchain/info
   → Returns chain ID: 84532, network: base-sepolia

2. Get All Tokens
   GET /api/blockchain/tokens
   → Lists USDC, IDRX, CNHT, EUROC, JPYC, MXNT addresses

3. Get USDC Info
   GET /api/blockchain/tokens/0x886664e1707b8e013a4242ee0dbfe753c68bf7d4
   → Returns: name, symbol, decimals

4. Check USDC Balance
   GET /api/blockchain/balance/0x886664e1707b8e013a4242ee0dbfe753c68bf7d4
   → Returns balance for backend wallet or specified address
```

### Workflow 3: Estimate and Execute Swap

```
1. Estimate Swap
   POST /api/blockchain/estimate-swap
   Body: { "amountIn": "100000000" }  // 100 USDC (6 decimals)
   → Returns: estimatedOut, fee, netOut

2. Check Token Allowance (if needed)
   (Future endpoint)

3. Execute Swap
   (Future endpoint - will submit transaction)

4. Monitor Transaction
   GET /api/blockchain/tx/:txHash/wait?confirmations=1
   → Waits for confirmation
```

### Workflow 4: Get Transaction Status

```
1. Get Transaction Details
   GET /api/blockchain/tx/0x20af465b0a9cd5e7cb236c687ff30dbafafbf2b2e3abe51ba448444382f0b18d
   → Returns transaction data

2. Get Transaction Receipt
   GET /api/blockchain/tx/0x20af465b0a9cd5e7cb236c687ff30dbafafbf2b2e3abe51ba448444382f0b18d/receipt
   → Returns receipt with logs

3. Check User Transaction History
   GET /api/transactions
   → Returns all user transactions
```

## Token Addresses (Base Sepolia)

For easy reference when testing:

```json
{
  "USDC": "0x886664e1707b8e013a4242ee0dbfe753c68bf7d4",
  "IDRX": "0x67cacfe96ca874ec7a78ee0d6f7044e878ba9c4c",
  "CNHT": "0x993f00d791509cfab774e3b97dab1f0470ffc9cf",
  "EUROC": "0x76c9d8f6eb862d4582784d7e2848872f83a64c1b",
  "JPYC": "0x5246818cdeccf2a5a08267f27ad76dce8239eaec",
  "MXNT": "0x83d1214238dd4323bd165170cf9761a4718ae1db"
}
```

**Contracts:**
```json
{
  "RemittanceSwap": "0x9354839fba186309fd2c32626e424361f57233d2",
  "MultiTokenSwap": "0x2c7f17bc795be548a0b1da28d536d57f78df0543"
}
```

## Saved Responses

Each endpoint includes saved example responses showing:
- **Success responses** with actual data structure
- **Status codes** (200, 400, 401, 404, 500)
- **Response headers**
- **Response body** with real example data

### Viewing Saved Responses

1. Select any request
2. Click "Examples" dropdown (near Send button)
3. Select the saved response to view

## Testing Tips

### 1. Start with Health Check
Always verify the API is running first:
```
GET / or GET /health
```

### 2. Use Auto-Authentication
The Login endpoint automatically saves tokens using this script:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.collectionVariables.set('access_token', jsonData.tokens.accessToken);
    pm.collectionVariables.set('refresh_token', jsonData.tokens.refreshToken);
    pm.collectionVariables.set('user_id', jsonData.user.id);
}
```

### 3. Check Variables
View current variable values:
- Click "..." next to collection name
- Select "Edit"
- Go to "Variables" tab

### 4. Use Token Amounts Correctly
Most tokens use 6 decimals:
- 1 USDC = `1000000` (6 zeros)
- 100 USDC = `100000000` (8 digits)
- 0.5 USDC = `500000`

### 5. Monitor Network
Base Sepolia Explorer: https://sepolia.basescan.org
- View transactions
- Check contract addresses
- Verify token balances

## Common Issues

### 401 Unauthorized
**Problem**: Token expired or not set
**Solution**:
1. Login again: `POST /api/auth/login`
2. Or refresh: `POST /api/auth/refresh`

### 500 Internal Server Error
**Problem**: Backend not configured or database issue
**Solution**:
1. Check backend is running: `GET /health`
2. Verify `.env` configuration
3. Check database connection

### Network Errors
**Problem**: Can't connect to API
**Solution**:
1. Verify `base_url` variable
2. Check backend is running: `npm run dev`
3. Try `http://localhost:3000` or `http://127.0.0.1:3000`

## Environment Setup

### Development Environment
```
base_url: http://localhost:3000
```

### Production Environment (when deployed)
```
base_url: https://api-trustbridge.izcy.tech
```

## Next Steps

1. **Import Collection** into Postman
2. **Start Backend**: `npm run dev`
3. **Run Health Check**: Verify API is running
4. **Login**: Get authentication tokens
5. **Test Blockchain Endpoints**: Check network info, tokens
6. **Test Swap Estimation**: Estimate swap outputs

## Support

For issues or questions:
- Check `MIGRATION_SUMMARY.md` for backend setup
- Review Base Sepolia explorer for blockchain status
- Verify contract addresses in `base-sepolia-deployment.json`

## Collection Updates

When API changes:
1. Update collection in Postman
2. Export updated collection
3. Replace `TrustBridge_BaseSepolia_API.postman_collection.json`
4. Share with team
