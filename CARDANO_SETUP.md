# Cardano Smart Contract Integration

This backend now supports interaction with Cardano smart contracts using Lucid.

## Setup

### 1. Get a Blockfrost API Key

1. Sign up at [Blockfrost.io](https://blockfrost.io/)
2. Create a new project
3. Select your network (Mainnet, Preprod, or Preview)
4. Copy your API key

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Cardano Blockchain
CARDANO_NETWORK="Preprod"
BLOCKFROST_API_KEY="your-blockfrost-api-key-here"
BLOCKFROST_URL="https://cardano-preprod.blockfrost.io/api/v0"
```

**Networks:**
- `Mainnet`: Production network
- `Preprod`: Pre-production testnet
- `Preview`: Preview testnet

**Blockfrost URLs:**
- Mainnet: `https://cardano-mainnet.blockfrost.io/api/v0`
- Preprod: `https://cardano-preprod.blockfrost.io/api/v0`
- Preview: `https://cardano-preview.blockfrost.io/api/v0`

### 3. Generate Backend Wallet

When you first start the server with valid Cardano configuration, it will automatically generate a backend wallet and save it to `.cardano-wallet.json` in the project root.

**⚠️ IMPORTANT:**
- Back up the `.cardano-wallet.json` file securely
- Add it to `.gitignore` (it's already excluded)
- This wallet represents your backend's identity on Cardano
- Fund this wallet with ADA to pay for transaction fees

### 4. Fund the Backend Wallet

1. Start the server: `npm run dev`
2. Call the endpoint: `GET /api/cardano/backend-info`
3. Copy the `address` from the response
4. Send test ADA to this address from a faucet:
   - Preprod: https://docs.cardano.org/cardano-testnet/tools/faucet/
   - Preview: https://docs.cardano.org/cardano-testnet/tools/faucet/

## API Endpoints

### Get Backend Public Information

Get the backend's public address and public key hash to share with smart contracts.

```bash
GET /api/cardano/backend-info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "addr_test1...",
    "publicKeyHash": "abc123...",
    "balance": {
      "ada": 10.5,
      "lovelace": "10500000",
      "assets": {}
    },
    "isReady": true
  }
}
```

### Lock Funds in Smart Contract

Lock funds in a Plutus smart contract (requires authentication).

```bash
POST /api/cardano/lock-funds
Authorization: Bearer <token>

{
  "scriptAddress": "addr_test1...",
  "amount": "2000000",  // in lovelace (2 ADA)
  "datum": {
    "customField": "value"
  }
}
```

### Unlock Funds from Smart Contract

Unlock funds from a Plutus smart contract (requires authentication).

```bash
POST /api/cardano/unlock-funds
Authorization: Bearer <token>

{
  "scriptAddress": "addr_test1...",
  "scriptCbor": "59089a01000...",  // Script CBOR hex
  "utxos": [...],  // UTxOs to spend
  "redeemer": {
    "action": "withdraw"
  }
}
```

### Get Script UTxOs

Get all UTxOs at a script address.

```bash
GET /api/cardano/script-utxos/:address
```

### Build Transaction for User

Build a transaction for a user to sign on the frontend.

```bash
POST /api/cardano/build-tx
Authorization: Bearer <token>

{
  "userAddress": "addr_test1...",
  "scriptAddress": "addr_test1...",
  "amount": "2000000",
  "datum": {}
}
```

### Submit Signed Transaction

Submit a signed transaction from the user.

```bash
POST /api/cardano/submit-tx

{
  "signedTxCbor": "84a300..."
}
```

### Create Datum with Backend Authorization

Create a datum that includes the backend's public key hash for authorization.

```bash
POST /api/cardano/create-datum
Authorization: Bearer <token>

{
  "data": {
    "userId": "123",
    "amount": "1000000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "datum": {
      "backendPubKeyHash": "abc123...",
      "timestamp": 1234567890,
      "data": {
        "userId": "123",
        "amount": "1000000"
      }
    }
  }
}
```

### Check Transaction Status

Wait for transaction confirmation.

```bash
GET /api/cardano/tx-status/:txHash
```

## Smart Contract Integration Flow

### 1. Share Backend Public Key with Smart Contract

The smart contract needs to know your backend's public key hash to verify transactions:

1. Call `GET /api/cardano/backend-info`
2. Share the `publicKeyHash` with your smart contract during deployment
3. The smart contract can validate that transactions are signed by the backend

### 2. Example: User Deposits to Smart Contract

```javascript
// Frontend: User initiates deposit
const response = await fetch('/api/cardano/build-tx', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userAddress: userWallet.address,
    scriptAddress: 'addr_test1...',  // Your smart contract address
    amount: '5000000',  // 5 ADA
    datum: {
      userId: '123',
      purpose: 'deposit'
    }
  })
});

const { unsignedTransactionCbor } = await response.json();

// User signs transaction with their wallet
const signedTx = await userWallet.signTx(unsignedTransactionCbor);

// Submit signed transaction
await fetch('/api/cardano/submit-tx', {
  method: 'POST',
  body: JSON.stringify({ signedTxCbor: signedTx })
});
```

### 3. Example: Backend Withdraws from Smart Contract

```javascript
// Backend withdraws from contract (authenticated user request)
const response = await fetch('/api/cardano/unlock-funds', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    scriptAddress: 'addr_test1...',
    scriptCbor: '59089a01000...',  // Your smart contract CBOR
    utxos: [/* UTxOs from script */],
    redeemer: {
      action: 'withdraw',
      amount: '5000000'
    }
  })
});
```

## Security Best Practices

1. **Backend Wallet Private Key:**
   - Store `.cardano-wallet.json` securely
   - Never commit it to version control
   - Use encryption at rest in production
   - Consider hardware wallet integration for production

2. **API Authentication:**
   - All fund-moving endpoints require JWT authentication
   - Implement proper user authorization checks
   - Rate limit sensitive endpoints

3. **Smart Contract Validation:**
   - Always validate the smart contract address
   - Verify datum structure before sending
   - Check UTxO values before unlocking

4. **Transaction Monitoring:**
   - Log all transactions for audit trail
   - Monitor backend wallet balance
   - Set up alerts for unusual activity

## Testing

### Using Mock Mode

If you don't configure Blockfrost API key, the service runs in mock mode for testing:

```bash
# No BLOCKFROST_API_KEY in .env
npm run dev
# Service will run in mock mode
```

### Preprod Testing

1. Get Preprod API key from Blockfrost
2. Fund wallet from Preprod faucet
3. Deploy smart contract to Preprod
4. Test full integration flow

## Troubleshooting

### "Backend wallet not initialized"
- Check that `BLOCKFROST_API_KEY` is set correctly
- Verify `CARDANO_NETWORK` matches your Blockfrost project
- Restart the server after updating `.env`

### "Insufficient funds"
- Check backend wallet balance: `GET /api/cardano/backend-info`
- Fund the wallet from testnet faucet
- Wait for confirmation (can take a few minutes)

### "Transaction failed"
- Check transaction details in Blockfrost dashboard
- Verify script address is correct
- Ensure datum/redeemer format matches contract requirements

## Additional Resources

- [Lucid Documentation](https://lucid.spacebudz.io/)
- [Cardano Developer Portal](https://developers.cardano.org/)
- [Blockfrost API Docs](https://docs.blockfrost.io/)
- [Plutus Documentation](https://plutus.readthedocs.io/)
