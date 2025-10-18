# Slippage Fix Implementation Guide

## Problem
The "Too little received" error occurred because `minAmountOut` was calculated using exchange rates instead of the actual on-chain quote from the swap contract.

## Solution Implemented

### 1. Updated `blockchain.service.ts`
- Implemented `estimateMultiTokenSwap()` function (line 181-220)
- Now properly calls `getEstimatedOutput()` on the MultiTokenSwap contract
- Returns actual on-chain quote including fees

### 2. Updated `transfer.service.ts`
- Modified `processBlockchainTransfer()` (line 258-271)
- Modified `processMastercardPayment()` (line 430-443)
- Both now:
  1. Get on-chain quote from the contract
  2. Apply 2% slippage tolerance to the actual quote
  3. Use the calculated `minAmountOut` for the swap

## How It Works Now

### Before (WRONG):
```typescript
// Used exchange rate, didn't account for contract fees
const minAmountOut = BigInt(Math.floor(
  transfer.recipientExpectedAmount * Math.pow(10, decimals) * 0.98
));
```

### After (CORRECT):
```typescript
// Step 1: Get actual on-chain quote
const quote = await blockchainService.estimateMultiTokenSwap(
  transfer.senderTokenAddress,
  transfer.recipientTokenAddress,
  amountIn
);

// Step 2: Apply slippage to the ACTUAL quote
const slippageTolerance = 0.02; // 2%
const minAmountOut = BigInt(Math.floor(
  Number(quote.netOut) * (1 - slippageTolerance)
));
```

## Testing the Fix

### Option 1: Test via Backend API
```bash
# Start the backend
cd Tera-Backend
npm run dev

# Create a transfer (this will automatically execute)
curl -X POST http://localhost:3001/api/blockchain/transfer/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "whatsappNumber": "+1234567890",
    "paymentMethod": "MASTERCARD",
    "senderCurrency": "USD",
    "senderAmount": 10,
    "recipientName": "Test User",
    "recipientCurrency": "IDR",
    "recipientBank": "Test Bank",
    "recipientAccount": "123456"
  }'
```

### Option 2: Test Manually with Frontend
1. Make sure your backend is running
2. Open your MiniApps frontend
3. Try to send 10 USDC to IDR
4. The swap should now succeed with proper slippage calculation

## What Changed in the Flow

### Old Flow:
1. Calculate minAmountOut from exchange rate ❌
2. Execute swap
3. Fail with "Too little received"

### New Flow:
1. Call contract's `getEstimatedOutput()` ✅
2. Get actual expected output (after all fees)
3. Apply 2% slippage to actual quote
4. Execute swap with correct minAmountOut
5. Success! ✅

## Slippage Tolerance

The current implementation uses **2% slippage tolerance**. You can adjust this by changing:

```typescript
const slippageTolerance = 0.02; // 2% - increase if swaps still fail
```

Recommended values:
- **1-2%**: Normal market conditions
- **3-5%**: High volatility or low liquidity pools
- **5%+**: Only for testing or very volatile pairs

## Contract Functions Used

### `getEstimatedOutput(tokenIn, tokenOut, amountIn)`
- Returns: `(estimatedOut, fee, netOut)`
- `estimatedOut`: Raw output from Uniswap
- `fee`: Platform fee (0.5%)
- `netOut`: Final output after all fees (this is what we use)

### `swap(tokenIn, tokenOut, amountIn, recipient, minAmountOut)`
- Executes the actual swap
- Reverts if output < minAmountOut

## Troubleshooting

### If swaps still fail with "Too little received":
1. Check the contract quote logs:
   ```
   📊 Getting on-chain quote...
   ✅ Quote received:
      Estimated Out: [value]
      Fee: [value]
      Net Out: [value]  <-- This is what matters
      Min Amount Out (with 2% slippage): [value]
   ```

2. Increase slippage tolerance temporarily:
   ```typescript
   const slippageTolerance = 0.05; // 5%
   ```

3. Check if the pool has enough liquidity:
   - Visit Base Sepolia block explorer
   - Check the Uniswap pool for USDC/IDRX
   - Ensure there's sufficient liquidity

### If quote call fails:
1. Verify contract addresses in `.env`:
   ```
   MULTI_TOKEN_SWAP_ADDRESS=0x...
   USDC_ADDRESS=0x...
   IDRX_ADDRESS=0x...
   ```

2. Ensure tokens are added to the MultiTokenSwap contract:
   ```solidity
   // Owner must call:
   multiTokenSwap.addSupportedToken(usdcAddress);
   multiTokenSwap.addSupportedToken(idrxAddress);
   ```

## Summary

The fix ensures that `minAmountOut` is calculated from the **actual on-chain quote** rather than external exchange rates. This accounts for:
- Contract platform fees (0.5%)
- Uniswap pool fees (0.3%)
- Current pool exchange rates
- Slippage protection

Your swaps should now work correctly! 🎉
