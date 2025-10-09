import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Lazy load Cardano services to avoid import errors in dev mode
let cardanoWalletService: any;
let cardanoContractService: any;

async function getCardanoServices() {
  if (!cardanoWalletService) {
    const walletModule = await import('../services/cardano-wallet.service');
    cardanoWalletService = walletModule.cardanoWalletService;
  }
  if (!cardanoContractService) {
    const contractModule = await import('../services/cardano-contract.service');
    cardanoContractService = contractModule.cardanoContractService;
  }
  return { cardanoWalletService, cardanoContractService };
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

export default router;
