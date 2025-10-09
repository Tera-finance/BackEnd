# Cardano Token Deployment Import

## Overview

When you deploy tokens using `be-offchain`, you need to import the deployment information into the backend database so the API can access token data.

## Workflow

### 1. Deploy Tokens (on local machine)

```bash
cd be-offchain
npm run deploy
```

This creates `deployment-info.json` with all deployed token addresses and policy IDs.

### 2. Copy Deployment Info to Backend

**Manual copy (when deploying to VPS):**

```bash
# Copy the JSON file from be-offchain to backend-trustbridge
cp ../be-offchain/deployment-info.json ./deployment-info.json
```

Or simply **copy the JSON content** and paste it into `backend-trustbridge/deployment-info.json`

### 3. Import to Database

```bash
cd backend-trustbridge
npx ts-node scripts/import-deployment.ts
```

This will:
- Read `deployment-info.json` from the backend directory
- Save all tokens to MySQL database
- Display import results

### 4. Verify Import

Check tokens in database:

```bash
mysql -u trustbridge -ptrustbridge123 trustbridge -e "SELECT * FROM cardano_tokens;"
```

Or use the API:

```bash
curl http://localhost:3000/api/cardano/tokens
```

## When You Redeploy

1. **Deploy new tokens** in `be-offchain`
2. **Copy the new `deployment-info.json`** to `backend-trustbridge/`
3. **Run import script** again: `npx ts-node scripts/import-deployment.ts`

The script will skip tokens that already exist in the database.

## API Endpoints for Deployed Tokens

### Get All Tokens
```bash
GET /api/cardano/tokens
```

### Get Token by Policy ID
```bash
GET /api/cardano/tokens/:policyId
```

### Get Token by Symbol
```bash
GET /api/cardano/tokens/symbol/:symbol
# Example: /api/cardano/tokens/symbol/USDC
```

### Get Mint History
```bash
GET /api/cardano/mints/:policyId?limit=10
```

### Get Swap History
```bash
GET /api/cardano/swaps?limit=10
GET /api/cardano/swaps?from=<policyId>&to=<policyId>
```

## Example: Current Deployment

```json
{
  "timestamp": "2025-10-09T08:07:33.276Z",
  "network": "Preprod",
  "walletAddress": "addr_test1qpa0...",
  "tokens": [
    {
      "name": "mockUSDC",
      "policyId": "4cbb15ff52c7459cd734c79c1a9fae87cab77b2a49f9a83907c8125d",
      "txHash": "c15350addd316d9007ca98ff2533c2c16acb8fb74b812a01183146ab83a3b60a"
    },
    // ... other tokens
  ]
}
```

## VPS Deployment Notes

- `be-offchain` stays on your **local machine** (for deployment only)
- `backend-trustbridge` goes to **VPS** (production API)
- **Manually copy** `deployment-info.json` from local to VPS
- Run import script on VPS to update database

## Files

- `deployment-info.json` - Token deployment data (copy from be-offchain)
- `scripts/import-deployment.ts` - Import script
- `src/repositories/cardano.repository.ts` - Database operations
- `src/routes/cardano.routes.ts` - API endpoints
