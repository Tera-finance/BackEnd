# Cardano Actions API

This document explains the Cardano blockchain action endpoints in backend-trustbridge.

## Overview

Backend-trustbridge now includes **action endpoints** that perform actual blockchain operations (minting and swapping tokens) directly from the backend, eliminating the need for a separate be-offchain service during development.

## Architecture

```
┌─────────────────────────────┐
│   Frontend (CardanoPay)     │
│   - User Interface          │
│   - Wallet UI               │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Backend (backend-trustbridge)│
│                             │
│  ┌─────────────────────┐   │
│  │  Action Endpoints   │   │
│  │  POST /actions/mint │   │
│  │  POST /actions/swap │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼─────────────┐ │
│  │ cardano-actions.service│ │
│  │ - Loads plutus.json    │ │
│  │ - Builds transactions  │ │
│  │ - Signs & submits      │ │
│  └──────────┬─────────────┘ │
│             │               │
│  ┌──────────▼─────────────┐ │
│  │  cardano.repository    │ │
│  │  - Saves to MySQL      │ │
│  └────────────────────────┘ │
└──────────────┬──────────────┘
               │
               ▼
      ┌────────────────┐
      │ Cardano Preprod│
      │   Blockchain   │
      └────────────────┘
```

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Cardano Configuration
CARDANO_NETWORK=Preprod
BLOCKFROST_API_KEY=your-blockfrost-api-key
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
WALLET_SEED=your 24 word mnemonic phrase here
```

Get your Blockfrost API key from: https://blockfrost.io

### 2. Smart Contracts

Ensure `plutus.json` exists in the parent `Trustbridge-SmartContracts` directory:

```bash
cd ../Trustbridge-SmartContracts
aiken build
```

This generates `plutus.json` with all compiled validators.

### 3. Import Deployed Tokens

Before using action endpoints, import your deployed tokens:

```bash
cd backend-trustbridge
npx ts-node scripts/import-deployment.ts
```

This reads `deployment-info.json` and saves tokens to MySQL.

## API Endpoints

### 1. Mint Tokens (Action)

**POST** `/api/cardano/actions/mint`

Executes a mint transaction on Cardano blockchain.

**Request Body:**
```json
{
  "symbol": "USDC",
  "amount": "1000000000",
  "recipientAddress": "addr_test1..." // optional, defaults to backend wallet
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "txHash": "7bf267cbef09f5f80fb7d9e588f5af0af3307b108312c764f2e5367c5e074f92",
    "policyId": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
    "amount": "1000000000",
    "cardanoscanUrl": "https://preprod.cardanoscan.io/transaction/7bf2..."
  },
  "message": "Successfully minted 1000000000 USDC"
}
```

**What it does:**
1. Looks up token in database by symbol
2. Loads validator from plutus.json
3. Builds mint transaction with redeemer
4. Signs with backend wallet
5. Submits to Cardano blockchain
6. Saves mint record to database
7. Returns transaction hash

### 2. Swap Tokens (Action)

**POST** `/api/cardano/actions/swap`

Executes a swap transaction (burn one token, mint another).

**Request Body:**
```json
{
  "fromSymbol": "USDC",
  "toSymbol": "IDRX",
  "fromAmount": "100000000",
  "exchangeRate": 15800
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "burnTxHash": "8c6af18b5d96d8de...",
    "mintTxHash": "9d7bf29c6e07e9ef...",
    "fromPolicyId": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
    "toPolicyId": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9",
    "fromAmount": "100000000",
    "toAmount": "1580000000",
    "exchangeRate": 15800
  },
  "message": "Successfully swapped 100000000 USDC to 1580000000 IDRX"
}
```

**What it does:**
1. Looks up both tokens in database
2. Loads validators from plutus.json
3. Builds burn transaction for source token
4. Submits burn and waits for confirmation
5. Builds mint transaction for destination token
6. Submits mint transaction
7. Saves swap record to database
8. Returns both transaction hashes

## Record-Only Endpoints (No Blockchain Action)

These endpoints only save transaction records to the database (for when transactions happen elsewhere):

### POST `/api/cardano/mints`

Saves a mint record without performing blockchain action.

**Request Body:**
```json
{
  "policyId": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
  "amount": "100000000",
  "recipientAddress": "addr_test1...",
  "txHash": "7bf267cbef09f5f80fb7d9e588f5af0af3307b108312c764f2e5367c5e074f92"
}
```

### POST `/api/cardano/swaps`

Saves a swap record without performing blockchain action.

**Request Body:**
```json
{
  "fromPolicyId": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
  "toPolicyId": "5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9",
  "fromAmount": "100000000",
  "toAmount": "1580000000",
  "exchangeRate": 15800,
  "senderAddress": "addr_test1...",
  "recipientAddress": "addr_test1...",
  "txHash": "9d7bf29c6e07e9ef...",
  "swapType": "DIRECT"
}
```

## Supported Tokens

Currently supports these mock stablecoins on Cardano Preprod:

| Symbol | Token Name | Decimals | Currency |
|--------|-----------|----------|----------|
| USDC   | mockUSDC  | 6        | USD      |
| CNHT   | mockCNHT  | 6        | CNY      |
| EUROC  | mockEUROC | 6        | EUR      |
| IDRX   | mockIDRX  | 6        | IDR      |
| JPYC   | mockJPYC  | 6        | JPY      |
| MXNT   | mockMXNT  | 6        | MXN      |

## Testing

### 1. Start Backend

```bash
cd backend-trustbridge
npm run dev
```

### 2. Test Mint Action

```bash
curl -X POST http://localhost:3000/api/cardano/actions/mint \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "USDC",
    "amount": "1000000000"
  }'
```

### 3. Test Swap Action

```bash
curl -X POST http://localhost:3000/api/cardano/actions/swap \
  -H "Content-Type: application/json" \
  -d '{
    "fromSymbol": "USDC",
    "toSymbol": "IDRX",
    "fromAmount": "100000000",
    "exchangeRate": 15800
  }'
```

### 4. Verify on Blockchain

Check transaction on Cardano explorer:
```
https://preprod.cardanoscan.io/transaction/{txHash}
```

### 5. Query Records

```bash
# Get all mints
curl http://localhost:3000/api/cardano/mints/4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d

# Get all swaps
curl http://localhost:3000/api/cardano/swaps
```

## Error Handling

### Mock Mode

If `WALLET_SEED` or `BLOCKFROST_API_KEY` is not configured, the service runs in mock mode:

```json
{
  "success": true,
  "data": {
    "txHash": "0xmock_transaction_hash",
    "policyId": "mock_policy_id_usdc",
    ...
  }
}
```

Mock mode allows testing without blockchain connection.

### Common Errors

**1. Token not found**
```json
{
  "success": false,
  "error": "Token USDC not found in database. Please import deployment-info.json first."
}
```
Solution: Run `npx ts-node scripts/import-deployment.ts`

**2. Insufficient funds**
```json
{
  "success": false,
  "error": "Insufficient ADA for transaction fees"
}
```
Solution: Add testnet ADA to your wallet from faucet: https://docs.cardano.org/cardano-testnet/tools/faucet/

**3. Validator not found**
```json
{
  "success": false,
  "error": "Validator usdc.mock_usdc_policy.mint not found in plutus.json"
}
```
Solution: Run `aiken build` in Trustbridge-SmartContracts directory

## Frontend Integration

Use action endpoints from CardanoPay frontend:

```typescript
// Mint tokens
const mintResponse = await fetch('http://localhost:3000/api/cardano/actions/mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'USDC',
    amount: '1000000000'
  })
});

const mintData = await mintResponse.json();
console.log('Mint TX:', mintData.data.cardanoscanUrl);

// Swap tokens
const swapResponse = await fetch('http://localhost:3000/api/cardano/actions/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromSymbol: 'USDC',
    toSymbol: 'IDRX',
    fromAmount: '100000000'
  })
});

const swapData = await swapResponse.json();
console.log('Swap completed:', swapData.message);
```

## Differences from be-offchain

| Feature | be-offchain | backend-trustbridge |
|---------|-------------|---------------------|
| Purpose | Standalone CLI scripts | REST API endpoints |
| Usage | `npm run mint` | `POST /actions/mint` |
| Deployment | Separate service | Integrated in backend |
| Database | No auto-save | Auto-saves all transactions |
| Frontend | No direct integration | Direct API calls |
| Testing | CLI only | Postman/curl/frontend |

## Next Steps

1. ✅ Copy `.env.example` to `.env` and add `WALLET_SEED` and `BLOCKFROST_API_KEY`
2. ✅ Run `npx ts-node scripts/import-deployment.ts` to load tokens
3. ✅ Start backend: `npm run dev`
4. ✅ Test mint action with Postman or curl
5. ✅ Test swap action
6. ✅ Integrate with CardanoPay frontend

## Security Notes

- Backend wallet seed should be kept secure (use environment variables, never commit)
- Use separate wallets for development and production
- Consider implementing authentication/authorization for action endpoints in production
- Rate limiting recommended for public APIs
- Monitor wallet balance for transaction fees
