import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { blockchainService } from '../services/blockchain.service.js';
import { config } from '../utils/config.js';
const router = Router();
// ==================== BLOCKCHAIN INFO ENDPOINTS ====================
/**
 * GET /api/blockchain/info
 * Get blockchain network information
 */
router.get('/info', async (req, res) => {
    try {
        const blockNumber = await blockchainService.getBlockNumber();
        const gasPrice = await blockchainService.getGasPrice();
        res.json({
            success: true,
            data: {
                network: config.blockchain.network,
                chainId: config.blockchain.chainId,
                rpcUrl: config.blockchain.rpcUrl,
                explorerUrl: config.blockchain.explorerUrl,
                blockNumber: blockNumber.toString(),
                gasPrice: gasPrice,
                isReady: blockchainService.isReady()
            }
        });
    }
    catch (error) {
        console.error('Error getting blockchain info:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get blockchain info'
        });
    }
});
/**
 * GET /api/blockchain/backend-address
 * Get backend wallet address (public info only)
 */
router.get('/backend-address', async (req, res) => {
    try {
        const address = await blockchainService.getBackendAddress();
        const balance = await blockchainService.getBalance();
        res.json({
            success: true,
            data: {
                address,
                balance: {
                    wei: balance.native,
                    eth: balance.formatted
                },
                explorerUrl: blockchainService.getAddressExplorerUrl(address)
            }
        });
    }
    catch (error) {
        console.error('Error getting backend address:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get backend address'
        });
    }
});
// ==================== TOKEN ENDPOINTS ====================
/**
 * GET /api/blockchain/tokens
 * Get all configured token addresses
 */
router.get('/tokens', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get tokens'
        });
    }
});
/**
 * GET /api/blockchain/tokens/:tokenAddress
 * Get token information
 */
router.get('/tokens/:tokenAddress', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const tokenInfo = await blockchainService.getTokenInfo(tokenAddress);
        res.json({
            success: true,
            data: {
                address: tokenAddress,
                ...tokenInfo,
                explorerUrl: blockchainService.getAddressExplorerUrl(tokenAddress)
            }
        });
    }
    catch (error) {
        console.error('Error getting token info:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get token info'
        });
    }
});
/**
 * GET /api/blockchain/balance/:tokenAddress
 * Get token balance for an address
 */
router.get('/balance/:tokenAddress', authenticate, async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const { address } = req.query;
        const balance = await blockchainService.getTokenBalance(tokenAddress, address);
        res.json({
            success: true,
            data: {
                tokenAddress,
                ...balance
            }
        });
    }
    catch (error) {
        console.error('Error getting token balance:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get token balance'
        });
    }
});
// ==================== SWAP ESTIMATION ENDPOINTS ====================
/**
 * POST /api/blockchain/estimate-swap
 * Estimate swap output for USDC to IDRX
 */
router.post('/estimate-swap', async (req, res) => {
    try {
        const { amountIn } = req.body;
        if (!amountIn) {
            return res.status(400).json({
                success: false,
                error: 'amountIn is required'
            });
        }
        const estimate = await blockchainService.estimateSwapOutput(amountIn);
        res.json({
            success: true,
            data: {
                amountIn,
                ...estimate
            }
        });
    }
    catch (error) {
        console.error('Error estimating swap:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to estimate swap'
        });
    }
});
/**
 * POST /api/blockchain/estimate-multi-swap
 * Estimate multi-token swap output
 */
router.post('/estimate-multi-swap', async (req, res) => {
    try {
        const { tokenIn, tokenOut, amountIn } = req.body;
        if (!tokenIn || !tokenOut || !amountIn) {
            return res.status(400).json({
                success: false,
                error: 'tokenIn, tokenOut, and amountIn are required'
            });
        }
        const estimate = await blockchainService.estimateMultiTokenSwap(tokenIn, tokenOut, amountIn);
        res.json({
            success: true,
            data: {
                tokenIn,
                tokenOut,
                amountIn,
                ...estimate
            }
        });
    }
    catch (error) {
        console.error('Error estimating multi-token swap:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to estimate swap'
        });
    }
});
// ==================== TRANSACTION STATUS ENDPOINTS ====================
/**
 * GET /api/blockchain/tx/:txHash
 * Get transaction details
 */
router.get('/tx/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;
        const tx = await blockchainService.getTransaction(txHash);
        res.json({
            success: true,
            data: {
                transaction: tx,
                explorerUrl: blockchainService.getExplorerUrl(txHash)
            }
        });
    }
    catch (error) {
        console.error('Error getting transaction:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get transaction'
        });
    }
});
/**
 * GET /api/blockchain/tx/:txHash/receipt
 * Get transaction receipt
 */
router.get('/tx/:txHash/receipt', async (req, res) => {
    try {
        const { txHash } = req.params;
        const receipt = await blockchainService.getTransactionReceipt(txHash);
        res.json({
            success: true,
            data: {
                receipt,
                explorerUrl: blockchainService.getExplorerUrl(txHash)
            }
        });
    }
    catch (error) {
        console.error('Error getting transaction receipt:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get transaction receipt'
        });
    }
});
/**
 * GET /api/blockchain/tx/:txHash/wait
 * Wait for transaction confirmation
 */
router.get('/tx/:txHash/wait', async (req, res) => {
    try {
        const { txHash } = req.params;
        const confirmations = parseInt(req.query.confirmations) || 1;
        const receipt = await blockchainService.waitForTransaction(txHash, confirmations);
        res.json({
            success: true,
            data: {
                confirmed: receipt.status === 'success',
                receipt,
                explorerUrl: blockchainService.getExplorerUrl(txHash)
            }
        });
    }
    catch (error) {
        console.error('Error waiting for transaction:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to wait for transaction'
        });
    }
});
export default router;
