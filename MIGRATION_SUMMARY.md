# Backend Migration Summary: Cardano → Base Sepolia

## Overview

Successfully migrated TrustBridge backend from Cardano Preprod network to Base Sepolia (EVM).

## What Changed

### ✅ Network Migration
- **From**: Cardano Preprod (UTXO-based)
- **To**: Base Sepolia testnet (EVM-based)
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org

### ✅ Dependencies Updated

**Removed (Cardano)**:
- `@emurgo/cardano-serialization-lib-nodejs`
- `@lucid-evolution/lucid`
- `@meshsdk/core` & `@meshsdk/core-csl`
- `lucid-cardano`

**Added (EVM)**:
- `viem` ^2.21.54 - Modern Ethereum library
- `tsx` ^4.19.2 - TypeScript execution (replaced ts-node)

### ✅ Source Code Structure

Created complete `src/` folder structure with TypeScript files:
```
src/
├── index.ts                      # Entry point
├── app.ts                        # Express app configuration
├── config/                       # Configuration files
├── middleware/
│   ├── auth.ts                  # JWT authentication
│   └── rateLimit.ts             # Rate limiting
├── routes/
│   ├── auth.routes.ts           # Authentication endpoints
│   ├── blockchain.routes.ts     # Blockchain operations (NEW)
│   ├── exchange.routes.ts       # Exchange rates
│   ├── transfer.routes.ts       # Transfer operations
│   └── transaction.routes.ts    # Transaction history
├── services/
│   ├── auth.service.ts          # Authentication logic
│   └── blockchain.service.ts    # Base Sepolia integration (NEW)
├── utils/
│   ├── config.ts                # App configuration
│   ├── database.ts              # MySQL connection
│   ├── redis.ts                 # Redis caching
│   └── encryption.ts            # Encryption utilities
└── repositories/                # Database repositories (TBD)
```

### ✅ Smart Contracts on Base Sepolia

#### Deployed Contracts
1. **RemittanceSwap**: `0x9354839fba186309fd2c32626e424361f57233d2`
   - Optimized for USDC → IDRX swaps
   - Integrated with Uniswap V3

2. **MultiTokenSwap**: `0x2c7f17bc795be548a0b1da28d536d57f78df0543`
   - Supports all token pairs
   - Configurable fees and limits

#### Mock Tokens (with Faucet)
- **USDC**: `0x886664e1707b8e013a4242ee0dbfe753c68bf7d4`
- **IDRX**: `0x67cacfe96ca874ec7a78ee0d6f7044e878ba9c4c`
- **CNHT**: `0x993f00d791509cfab774e3b97dab1f0470ffc9cf`
- **EUROC**: `0x76c9d8f6eb862d4582784d7e2848872f83a64c1b`
- **JPYC**: `0x5246818cdeccf2a5a08267f27ad76dce8239eaec`
- **MXNT**: `0x83d1214238dd4323bd165170cf9761a4718ae1db`

### ✅ API Routes Updated

Changed from `/api/cardano/*` to `/api/blockchain/*`:

#### New Blockchain Endpoints
- `GET /api/blockchain/info` - Network info
- `GET /api/blockchain/backend-address` - Backend wallet address
- `GET /api/blockchain/tokens` - List all token addresses
- `GET /api/blockchain/tokens/:tokenAddress` - Token info
- `GET /api/blockchain/balance/:tokenAddress` - Token balance
- `POST /api/blockchain/estimate-swap` - Estimate swap output
- `POST /api/blockchain/estimate-multi-swap` - Multi-token swap estimate
- `GET /api/blockchain/tx/:txHash` - Transaction details
- `GET /api/blockchain/tx/:txHash/receipt` - Transaction receipt
- `GET /api/blockchain/tx/:txHash/wait` - Wait for confirmation

#### Existing Endpoints (Maintained)
- `/api/auth/*` - Authentication
- `/api/exchange/*` - Exchange rates
- `/api/transfer/*` - Transfers
- `/api/transactions/*` - Transaction history

### ✅ Configuration Files

#### `.env.example`
Updated with Base Sepolia configuration:
- RPC URL, private key
- Smart contract addresses
- Token addresses

#### `base-sepolia-deployment.json`
New file with complete deployment information:
- Contract addresses
- Token addresses
- Uniswap V3 addresses
- Explorer links

## How to Use

### 1. Install Dependencies
```bash
cd Tera-Backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual values:
# - PRIVATE_KEY (for backend wallet)
# - DB credentials
# - JWT secrets
```

### 3. Initialize Database
```bash
# Create database schema (if not already created)
mysql -u root -p < sql/schema.sql

# Or use the init script
npm run db:init
```

### 4. Run Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 5. Test the API
```bash
# Health check
curl http://localhost:3000/health

# Get blockchain info
curl http://localhost:3000/api/blockchain/info

# Get all tokens
curl http://localhost:3000/api/blockchain/tokens
```

### 6. Build for Production
```bash
npm run build
npm start
```

## Blockchain Service Features

The new `BlockchainService` provides:

### Wallet Operations
- Get backend address
- Get ETH balance
- Get token balances

### Token Operations
- Get token info (name, symbol, decimals)
- Get token balance for any address
- Support for all ERC20 tokens

### Swap Operations
- Estimate swap output (with fees)
- Support for RemittanceSwap (USDC→IDRX)
- Support for MultiTokenSwap (any pair)

### Transaction Monitoring
- Get transaction details
- Get transaction receipt
- Wait for confirmations
- Explorer URL generation

## Integration with Viem

Using Viem library for Ethereum interactions:
- Type-safe contract calls
- Built-in ABI parsing
- Efficient RPC calls
- Automatic gas estimation
- Transaction receipt monitoring

## Security Features

- Private key stored in environment variables
- Rate limiting on all endpoints
- JWT authentication
- Request validation
- Error handling

## Next Steps for Full Migration

1. **Database Schema**:
   - Update tables to replace `policy_id` with `contract_address`
   - Update `cardano_tokens` → `blockchain_tokens`
   - Update `cardano_swaps` → `blockchain_swaps`

2. **Repository Layer**:
   - Create blockchain repositories for data access
   - Migrate Cardano repository logic to EVM

3. **WhatsApp Integration**:
   - Update WhatsApp bot to use new blockchain service
   - Test remittance flows

4. **Frontend/Mini Apps**:
   - Update Tera-MiniApps to use Base Sepolia
   - Replace Cardano wallet connectors with EVM wallets
   - Update API endpoints to `/api/blockchain`

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Can connect to database
- [ ] Can connect to Redis
- [ ] Blockchain service connects to Base Sepolia RPC
- [ ] Can fetch token information
- [ ] Can estimate swap outputs
- [ ] Can query transaction status
- [ ] Authentication works
- [ ] All API endpoints respond correctly

## Notes

- All mock tokens have faucet functions for testing
- Contracts are deployed on Base Sepolia testnet
- Use test funds from Base Sepolia faucet for gas
- Contract addresses are already configured in `.env.example`
- Frontend migration is next step

## Support

For issues or questions:
1. Check Base Sepolia explorer for contract status
2. Verify RPC URL is accessible
3. Ensure private key has test ETH for gas
4. Check logs for detailed error messages
