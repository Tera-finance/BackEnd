# Option B Implementation: Backend-Trustbridge with Blockchain Actions

## What Changed

You asked for **Option B** - integrating Cardano blockchain operations directly into backend-trustbridge, eliminating the need for a separate be-offchain service during development.

## New Architecture

```
┌──────────────────┐
│   Frontend       │
│  (CardanoPay)    │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────┐
│   Backend (backend-trustbridge)    │
│                                    │
│   ┌────────────────────────────┐  │
│   │   Action Endpoints         │  │
│   │   POST /actions/mint       │  │ ← NEW: Mint tokens on blockchain
│   │   POST /actions/swap       │  │ ← NEW: Swap tokens on blockchain
│   └──────────┬─────────────────┘  │
│              │                     │
│   ┌──────────▼──────────────────┐ │
│   │ cardano-actions.service.ts │ │ ← NEW: Handles blockchain ops
│   │ - Loads plutus.json        │ │
│   │ - Builds transactions      │ │
│   │ - Signs & submits to chain │ │
│   │ - Saves to database        │ │
│   └────────────────────────────┘ │
│                                   │
│   ┌────────────────────────────┐ │
│   │   Record Endpoints         │ │
│   │   POST /mints              │ │ ← Save mint records only
│   │   POST /swaps              │ │ ← Save swap records only
│   │   GET  /tokens             │ │
│   │   GET  /mints/:policyId    │ │
│   │   GET  /swaps              │ │
│   └────────────────────────────┘ │
│                                   │
│   ┌────────────────────────────┐ │
│   │  cardano.repository.ts     │ │
│   │  MySQL CRUD operations     │ │
│   └────────────────────────────┘ │
└───────────────┬───────────────────┘
                │
                ▼
      ┌──────────────────┐
      │ Cardano Blockchain│
      │    (Preprod)      │
      └──────────────────┘
```

## Files Created/Modified

### New Files

1. **`src/services/cardano-actions.service.ts`** (316 lines)
   - Handles actual blockchain operations
   - Loads validators from `plutus.json`
   - Builds and submits mint/swap transactions
   - Auto-saves records to database
   - Supports mock mode for testing

2. **`CARDANO_ACTIONS.md`** (Documentation)
   - Complete API reference
   - Setup instructions
   - Testing examples
   - Frontend integration guide
   - Error handling

3. **`OPTION_B_IMPLEMENTATION.md`** (This file)
   - Summary of changes
   - Architecture overview

### Modified Files

1. **`src/utils/config.ts`**
   - Added `walletSeed` to cardano config

2. **`.env.example`**
   - Added `WALLET_SEED` variable

3. **`src/routes/cardano.routes.ts`**
   - Added `POST /api/cardano/actions/mint` - Execute mint on blockchain
   - Added `POST /api/cardano/actions/swap` - Execute swap on blockchain
   - Lazy loads cardano-actions service

### Unchanged Files

- All existing endpoints still work (GET endpoints, POST save endpoints)
- Database repository unchanged
- MySQL schema unchanged
- Existing services (wallet, contract) unchanged

## Two Types of Endpoints

### 1. Action Endpoints (NEW) - Execute on Blockchain

**`POST /api/cardano/actions/mint`**
- Actually mints tokens on Cardano
- Builds transaction with smart contract
- Signs and submits to blockchain
- Auto-saves to database
- Returns transaction hash

**`POST /api/cardano/actions/swap`**
- Burns source token
- Mints destination token
- Handles exchange rate calculation
- Auto-saves to database
- Returns both transaction hashes

### 2. Record Endpoints (Existing) - Save to Database Only

**`POST /api/cardano/mints`**
- Only saves mint record
- Used when mint happens externally (e.g., from be-offchain)
- No blockchain interaction

**`POST /api/cardano/swaps`**
- Only saves swap record
- Used when swap happens externally
- No blockchain interaction

## Configuration Required

### 1. Environment Variables

Add to `.env`:

```bash
# Cardano Blockchain
WALLET_SEED=your 24 word mnemonic phrase from deployment
BLOCKFROST_API_KEY=your-blockfrost-preprod-api-key
CARDANO_NETWORK=Preprod
```

### 2. Smart Contracts

Ensure `plutus.json` exists:

```bash
cd ../Trustbridge-SmartContracts
aiken build
```

### 3. Import Tokens

Load deployed tokens to database:

```bash
cd backend-trustbridge
npx ts-node scripts/import-deployment.ts
```

## How to Use

### From Frontend (CardanoPay)

```typescript
// Mint tokens
const response = await fetch('http://localhost:3000/api/cardano/actions/mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'USDC',
    amount: '1000000000'  // 1000 USDC (6 decimals)
  })
});

const data = await response.json();
console.log('TX:', data.data.cardanoscanUrl);
```

### From Postman/cURL

```bash
# Mint USDC
curl -X POST http://localhost:3000/api/cardano/actions/mint \
  -H "Content-Type: application/json" \
  -d '{"symbol":"USDC","amount":"1000000000"}'

# Swap USDC to IDRX
curl -X POST http://localhost:3000/api/cardano/actions/swap \
  -H "Content-Type: application/json" \
  -d '{
    "fromSymbol":"USDC",
    "toSymbol":"IDRX",
    "fromAmount":"100000000"
  }'
```

## Mock Mode

If `WALLET_SEED` or `BLOCKFROST_API_KEY` is not configured:

- Service runs in **mock mode**
- Returns fake transaction hashes
- No blockchain interaction
- Allows testing without setup

To enable real blockchain ops, configure environment variables.

## Supported Tokens

All tokens from `deployment-info.json`:

| Symbol | Full Name  | Decimals |
|--------|-----------|----------|
| USDC   | mockUSDC  | 6        |
| CNHT   | mockCNHT  | 6        |
| EUROC  | mockEUROC | 6        |
| IDRX   | mockIDRX  | 6        |
| JPYC   | mockJPYC  | 6        |
| MXNT   | mockMXNT  | 6        |

## Workflow

### Before (with be-offchain)

```
1. Run be-offchain: npm run mint
2. Get transaction hash
3. Manually call backend: POST /api/cardano/mints
4. Save record
```

### Now (Option B)

```
1. Call backend: POST /api/cardano/actions/mint
2. Backend mints + saves automatically
3. Done! ✅
```

## Key Features

✅ **Integrated** - All blockchain operations in one service
✅ **Auto-save** - Transactions automatically saved to MySQL
✅ **REST API** - Easy integration with frontend
✅ **Mock Mode** - Test without blockchain connection
✅ **Error Handling** - Proper error messages and status codes
✅ **Documentation** - Complete API docs and examples
✅ **Type Safe** - Full TypeScript support

## Testing Checklist

- [ ] Add `WALLET_SEED` to `.env`
- [ ] Add `BLOCKFROST_API_KEY` to `.env`
- [ ] Run `npx ts-node scripts/import-deployment.ts`
- [ ] Start backend: `npm run dev`
- [ ] Test mint: `POST /api/cardano/actions/mint`
- [ ] Test swap: `POST /api/cardano/actions/swap`
- [ ] Check database records
- [ ] Verify on CardanoScan

## Differences from be-offchain

| Feature | be-offchain | backend-trustbridge |
|---------|-------------|---------------------|
| **Type** | CLI scripts | REST API |
| **Mint** | `npm run mint` | `POST /actions/mint` |
| **Swap** | `npm run swap usdc-to-idrx` | `POST /actions/swap` |
| **Database** | Manual save | Auto-save |
| **Frontend** | No integration | Direct API calls |
| **Deployment** | Separate service | Integrated |

## When to Use Which?

### Use Action Endpoints (`/actions/*`) when:
- ✅ You want backend to handle minting/swapping
- ✅ Frontend needs simple API calls
- ✅ You want automatic database recording
- ✅ Single service deployment

### Use be-offchain when:
- ✅ You need CLI for manual operations
- ✅ Deploying contracts for first time
- ✅ Testing smart contracts locally
- ✅ Advanced blockchain operations

### Use Record Endpoints (`POST /mints`, `POST /swaps`) when:
- ✅ Transactions happen in be-offchain
- ✅ You only need to save records
- ✅ External systems perform mints/swaps

## Benefits of Option B

1. **Simplified Deployment**
   - One service instead of two (backend + be-offchain)
   - Single codebase to maintain

2. **Better Frontend Integration**
   - Direct API calls
   - No need for separate be-offchain deployment
   - Consistent REST API patterns

3. **Automatic Record Keeping**
   - All transactions saved to MySQL
   - Query history anytime
   - Complete audit trail

4. **Development Friendly**
   - Mock mode for testing
   - No blockchain needed for dev
   - Faster iteration

5. **Production Ready**
   - Proper error handling
   - Status codes
   - Input validation
   - Type safety

## Next Steps

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your WALLET_SEED and BLOCKFROST_API_KEY
   ```

2. **Import Tokens**
   ```bash
   npx ts-node scripts/import-deployment.ts
   ```

3. **Start Backend**
   ```bash
   npm run dev
   ```

4. **Test Endpoints**
   - Use Postman collection
   - Or test with curl commands from `CARDANO_ACTIONS.md`

5. **Integrate Frontend**
   - Update CardanoPay to call action endpoints
   - Replace any be-offchain CLI calls with API calls

## Documentation

- **API Reference**: `CARDANO_ACTIONS.md`
- **Setup Guide**: This file
- **Postman Collection**: `TrustBridge_API.postman_collection.json`
- **Database Schema**: `sql/mysql-schema.sql`

## Support

If you encounter issues:

1. Check logs: Backend outputs detailed transaction info
2. Verify environment variables are set
3. Ensure tokens are imported to database
4. Check CardanoScan for transaction status
5. Try mock mode first (no env vars needed)

## Summary

You now have **Option B** fully implemented! 🎉

- ✅ Mint tokens from backend API
- ✅ Swap tokens from backend API
- ✅ Auto-save all transactions
- ✅ Frontend-ready REST API
- ✅ Mock mode for testing
- ✅ Complete documentation

No need for separate be-offchain service during development. Just configure your `.env`, import tokens, and start making API calls!
