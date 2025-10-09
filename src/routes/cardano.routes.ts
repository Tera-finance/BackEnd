import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as cardanoRepo from '../repositories/cardano.repository';

const router = Router();

// Lazy load Cardano services to avoid import errors in dev mode
let cardanoWalletService: any;
let cardanoContractService: any;
let cardanoActionsService: any;

async function getCardanoServices() {
  try {
    if (!cardanoWalletService) {
      const walletModule = await import('../services/cardano-wallet.service');
      cardanoWalletService = walletModule.cardanoWalletService;
    }
    if (!cardanoContractService) {
      const contractModule = await import('../services/cardano-contract.service');
      cardanoContractService = contractModule.cardanoContractService;
    }
    if (!cardanoActionsService) {
      const actionsModule = await import('../services/cardano-actions.service');
      cardanoActionsService = actionsModule.cardanoActionsService;
    }
    return { cardanoWalletService, cardanoContractService, cardanoActionsService };
  } catch (error) {
    console.error('Error loading Cardano services:', error);
    throw new Error('Cardano services unavailable in current environment');
  }
}

/**
 * GET /api/cardano/backend-info
 * Get backend wallet information (public data only)
 */
router.get('/backend-info', async (req: Request, res: Response) => {
  try {
    const { cardanoWalletService, cardanoContractService } = await getCardanoServices();
    const address = await cardanoContractService.getBackendAddress();
    const pubKeyHash = await cardanoContractService.getBackendPublicKeyHash();
    const balance = await cardanoWalletService.getBalance();

    res.json({
      success: true,
      data: {
        address,
        publicKeyHash: pubKeyHash,
        balance: {
          ada: Number(balance.lovelace) / 1_000_000,
          lovelace: balance.lovelace.toString(),
          assets: balance.assets
        },
        isReady: cardanoWalletService.isReady()
      }
    });
  } catch (error: any) {
    console.error('Error getting backend info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get backend info'
    });
  }
});

/**
 * POST /api/cardano/lock-funds
 * Lock funds in a smart contract
 * Requires authentication
 */
router.post('/lock-funds', authenticate, async (req: Request, res: Response) => {
  try {
    const { cardanoContractService } = await getCardanoServices();
    const { scriptAddress, amount, datum } = req.body;

    if (!scriptAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Script address and amount are required'
      });
    }

    const amountLovelace = BigInt(amount);
    const txHash = await cardanoContractService.lockFundsInContract(
      scriptAddress,
      amountLovelace,
      datum || {}
    );

    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        scriptAddress,
        amount: amount.toString()
      }
    });
  } catch (error: any) {
    console.error('Error locking funds:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to lock funds'
    });
  }
});

/**
 * POST /api/cardano/unlock-funds
 * Unlock funds from a smart contract
 * Requires authentication
 */
router.post('/unlock-funds', authenticate, async (req: Request, res: Response) => {
  try {
    const { cardanoContractService } = await getCardanoServices();
    const { scriptAddress, scriptCbor, utxos, redeemer } = req.body;

    if (!scriptAddress || !scriptCbor || !utxos) {
      return res.status(400).json({
        success: false,
        error: 'Script address, script CBOR, and UTxOs are required'
      });
    }

    const txHash = await cardanoContractService.unlockFundsFromContract(
      scriptAddress,
      scriptCbor,
      utxos,
      redeemer || {}
    );

    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        scriptAddress
      }
    });
  } catch (error: any) {
    console.error('Error unlocking funds:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unlock funds'
    });
  }
});

/**
 * GET /api/cardano/script-utxos/:address
 * Get UTxOs at a script address
 */
router.get('/script-utxos/:address', async (req: Request, res: Response) => {
  try {
    const { cardanoContractService } = await getCardanoServices();
    const { address } = req.params;

    const utxos = await cardanoContractService.getScriptUtxos(address);

    res.json({
      success: true,
      data: {
        address,
        utxos,
        count: utxos.length
      }
    });
  } catch (error: any) {
    console.error('Error getting script UTxOs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get script UTxOs'
    });
  }
});

/**
 * POST /api/cardano/build-tx
 * Build a transaction for user to sign
 * Requires authentication
 */
router.post('/build-tx', authenticate, async (req: Request, res: Response) => {
  try {
    const { cardanoContractService } = await getCardanoServices();
    const { userAddress, scriptAddress, amount, datum } = req.body;

    if (!userAddress || !scriptAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'User address, script address, and amount are required'
      });
    }

    const amountLovelace = BigInt(amount);
    const unsignedTxCbor = await cardanoContractService.buildTransactionForUser(
      userAddress,
      scriptAddress,
      amountLovelace,
      datum || {}
    );

    res.json({
      success: true,
      data: {
        unsignedTransactionCbor: unsignedTxCbor,
        scriptAddress,
        amount: amount.toString()
      }
    });
  } catch (error: any) {
    console.error('Error building transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to build transaction'
    });
  }
});

/**
 * POST /api/cardano/submit-tx
 * Submit a signed transaction
 */
router.post('/submit-tx', async (req: Request, res: Response) => {
  try {
    const { cardanoContractService } = await getCardanoServices();
    const { signedTxCbor } = req.body;

    if (!signedTxCbor) {
      return res.status(400).json({
        success: false,
        error: 'Signed transaction CBOR is required'
      });
    }

    const txHash = await cardanoContractService.submitSignedTransaction(signedTxCbor);

    res.json({
      success: true,
      data: {
        transactionHash: txHash
      }
    });
  } catch (error: any) {
    console.error('Error submitting transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit transaction'
    });
  }
});

/**
 * POST /api/cardano/create-datum
 * Create a datum with backend authorization
 * Requires authentication
 */
router.post('/create-datum', authenticate, async (req: Request, res: Response) => {
  try {
    const { cardanoContractService } = await getCardanoServices();
    const { data } = req.body;

    const datum = await cardanoContractService.createDatumWithBackendAuth(data || {});

    res.json({
      success: true,
      data: {
        datum
      }
    });
  } catch (error: any) {
    console.error('Error creating datum:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create datum'
    });
  }
});

/**
 * GET /api/cardano/tx-status/:txHash
 * Check transaction confirmation status
 */
router.get('/tx-status/:txHash', async (req: Request, res: Response) => {
  try {
    const { cardanoContractService } = await getCardanoServices();
    const { txHash } = req.params;

    const confirmed = await cardanoContractService.awaitTransactionConfirmation(txHash, 30000);

    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        confirmed
      }
    });
  } catch (error: any) {
    console.error('Error checking transaction status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check transaction status'
    });
  }
});

// ==================== TOKEN MANAGEMENT ENDPOINTS ====================

/**
 * GET /api/cardano/tokens
 * Get all deployed tokens from the database
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const tokens = await cardanoRepo.getAllActiveTokens();
    
    res.json({
      success: true,
      data: {
        tokens,
        count: tokens.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tokens'
    });
  }
});

/**
 * GET /api/cardano/tokens/:policyId
 * Get token details by policy ID
 */
router.get('/tokens/:policyId', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const token = await cardanoRepo.getTokenByPolicyId(policyId);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // Get statistics
    const stats = await cardanoRepo.getTokenStats(policyId);

    res.json({
      success: true,
      data: {
        token,
        stats
      }
    });
  } catch (error: any) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token'
    });
  }
});

/**
 * GET /api/cardano/tokens/symbol/:symbol
 * Get token by symbol (USDC, EUROC, etc.)
 */
router.get('/tokens/symbol/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const token = await cardanoRepo.getTokenBySymbol(symbol.toUpperCase());
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    res.json({
      success: true,
      data: { token }
    });
  } catch (error: any) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token'
    });
  }
});

/**
 * GET /api/cardano/mints/:policyId
 * Get mint history for a token
 */
router.get('/mints/:policyId', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const mints = await cardanoRepo.getMintHistory(policyId, limit);

    res.json({
      success: true,
      data: {
        policyId,
        mints,
        count: mints.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching mints:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch mint history'
    });
  }
});

/**
 * POST /api/cardano/mints
 * Save a new mint transaction
 * Called from be-offchain after minting tokens
 */
router.post('/mints', async (req: Request, res: Response) => {
  try {
    const { policyId, amount, recipientAddress, txHash, redeemerData } = req.body;

    if (!policyId || !amount || !recipientAddress || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: policyId, amount, recipientAddress, txHash'
      });
    }

    const mint = await cardanoRepo.saveMintTransaction({
      policyId,
      amount: BigInt(amount),
      recipientAddress,
      txHash,
      redeemerData
    });

    res.status(201).json({
      success: true,
      data: { mint },
      message: 'Mint transaction saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving mint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save mint transaction'
    });
  }
});

/**
 * GET /api/cardano/swaps
 * Get swap history
 */
router.get('/swaps', async (req: Request, res: Response) => {
  try {
    const fromPolicyId = req.query.from as string;
    const toPolicyId = req.query.to as string;
    const limit = parseInt(req.query.limit as string) || 10;

    const swaps = fromPolicyId || toPolicyId
      ? await cardanoRepo.getSwapHistoryByTokens(fromPolicyId, toPolicyId, limit)
      : await cardanoRepo.getSwapHistory(limit);

    res.json({
      success: true,
      data: {
        swaps,
        count: swaps.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching swaps:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch swap history'
    });
  }
});

/**
 * POST /api/cardano/swaps
 * Save a new swap transaction
 * Called from be-offchain after swapping tokens
 */
router.post('/swaps', async (req: Request, res: Response) => {
  try {
    const {
      fromPolicyId,
      toPolicyId,
      fromAmount,
      toAmount,
      exchangeRate,
      senderAddress,
      recipientAddress,
      txHash,
      swapType,
      hubPolicyId
    } = req.body;

    if (!fromPolicyId || !toPolicyId || !fromAmount || !toAmount || !exchangeRate || 
        !senderAddress || !recipientAddress || !txHash || !swapType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromPolicyId, toPolicyId, fromAmount, toAmount, exchangeRate, senderAddress, recipientAddress, txHash, swapType'
      });
    }

    const swap = await cardanoRepo.saveSwapTransaction({
      fromPolicyId,
      toPolicyId,
      fromAmount: BigInt(fromAmount),
      toAmount: BigInt(toAmount),
      exchangeRate: parseFloat(exchangeRate),
      senderAddress,
      recipientAddress,
      txHash,
      swapType: swapType as 'DIRECT' | 'VIA_HUB',
      hubPolicyId
    });

    res.status(201).json({
      success: true,
      data: { swap },
      message: 'Swap transaction saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving swap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save swap transaction'
    });
  }
});

/**
 * POST /api/cardano/actions/mint
 * Execute mint action on Cardano blockchain
 * This will actually mint tokens using smart contracts
 */
router.post('/actions/mint', async (req: Request, res: Response) => {
  try {
    const { symbol, amount, recipientAddress } = req.body;

    if (!symbol || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, amount'
      });
    }

    const { cardanoActionsService } = await getCardanoServices();
    
    console.log(`🪙 Initiating mint: ${amount} ${symbol}`);
    const result = await cardanoActionsService.mintToken({
      symbol,
      amount,
      recipientAddress
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Mint action failed'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        txHash: result.txHash,
        policyId: result.policyId,
        amount: result.amount,
        cardanoscanUrl: result.cardanoscanUrl
      },
      message: `Successfully minted ${amount} ${symbol}`
    });
  } catch (error: any) {
    console.error('Error in mint action:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Mint action failed'
    });
  }
});

/**
 * POST /api/cardano/actions/swap
 * Execute swap action on Cardano blockchain
 * This will burn one token and mint another
 */
router.post('/actions/swap', async (req: Request, res: Response) => {
  try {
    const { fromSymbol, toSymbol, fromAmount, exchangeRate } = req.body;

    if (!fromSymbol || !toSymbol || !fromAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromSymbol, toSymbol, fromAmount'
      });
    }

    const { cardanoActionsService } = await getCardanoServices();
    
    console.log(`🔄 Initiating swap: ${fromAmount} ${fromSymbol} → ${toSymbol}`);
    const result = await cardanoActionsService.swapTokens({
      fromSymbol,
      toSymbol,
      fromAmount,
      exchangeRate
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Swap action failed'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        burnTxHash: result.burnTxHash,
        mintTxHash: result.mintTxHash,
        fromPolicyId: result.fromPolicyId,
        toPolicyId: result.toPolicyId,
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        exchangeRate: result.exchangeRate
      },
      message: `Successfully swapped ${fromAmount} ${fromSymbol} to ${result.toAmount} ${toSymbol}`
    });
  } catch (error: any) {
    console.error('Error in swap action:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Swap action failed'
    });
  }
});

export default router;
