import { Router, Request, Response } from 'express';
import { config } from '../utils/config.js';

const router = Router();

// Simple endpoints that don't call blockchain

/**
 * GET /api/blockchain/info
 * Get blockchain network information (without RPC calls)
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        network: config.blockchain.network,
        chainId: config.blockchain.chainId,
        rpcUrl: config.blockchain.rpcUrl,
        explorerUrl: config.blockchain.explorerUrl,
        isReady: false // Will be true when RPC is working
      }
    });
  } catch (error: any) {
    console.error('Error getting blockchain info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get blockchain info'
    });
  }
});

/**
 * GET /api/blockchain/tokens
 * Get all configured token addresses
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        tokens: {
          usdc: config.contracts.usdc,
          idrx: config.contracts.idrx,
          cnht: config.contracts.cnht,
          euroc: config.contracts.euroc,
          jpyc: config.contracts.jpyc,
          mxnt: config.contracts.mxnt
        },
        contracts: {
          remittanceSwap: config.contracts.remittanceSwap,
          multiTokenSwap: config.contracts.multiTokenSwap
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting tokens:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tokens'
    });
  }
});

export default router;
