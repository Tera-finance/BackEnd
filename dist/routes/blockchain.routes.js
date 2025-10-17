import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getBlockchainService } from '../services/blockchain.service.js';
import { config } from '../utils/config.js';
const router = Router();
// Lazy getter for blockchain service
const getService = () => getBlockchainService();
// ==================== BLOCKCHAIN INFO ENDPOINTS ====================
/**
 * GET /api/blockchain/info
 * Get blockchain network information
 */
router.get('/info', async (req, res) => {
    try {
        const service = getService();
        const blockNumber = await service.getBlockNumber();
        const gasPrice = await service.getGasPrice();
        res.json({
            success: true,
            data: {
                network: config.blockchain.network,
                chainId: config.blockchain.chainId,
                rpcUrl: config.blockchain.rpcUrl,
                explorerUrl: config.blockchain.explorerUrl,
                blockNumber: blockNumber.toString(),
                gasPrice: gasPrice,
                isReady: service.isReady()
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
        const service = getService();
        const address = await service.getBackendAddress();
        const balance = await service.getBalance();
        res.json({
            success: true,
            data: {
                address,
                balance: {
                    wei: balance.native,
                    eth: balance.formatted
                },
                explorerUrl: service.getAddressExplorerUrl(address)
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
        const service = getService();
        const tokenInfo = await service.getTokenInfo(tokenAddress);
        res.json({
            success: true,
            data: {
                address: tokenAddress,
                ...tokenInfo,
                explorerUrl: service.getAddressExplorerUrl(tokenAddress)
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
        const service = getService();
        const balance = await service.getTokenBalance(tokenAddress, address);
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
        const service = getService();
        const estimate = await service.estimateSwapOutput(amountIn);
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
        const service = getService();
        const estimate = await service.estimateMultiTokenSwap(tokenIn, tokenOut, amountIn);
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
        const service = getService();
        const tx = await service.getTransaction(txHash);
        res.json({
            success: true,
            data: {
                transaction: tx,
                explorerUrl: service.getExplorerUrl(txHash)
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
        const service = getService();
        const receipt = await service.getTransactionReceipt(txHash);
        res.json({
            success: true,
            data: {
                receipt,
                explorerUrl: service.getExplorerUrl(txHash)
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
        const service = getService();
        const receipt = await service.waitForTransaction(txHash, confirmations);
        res.json({
            success: true,
            data: {
                confirmed: receipt.status === 'success',
                receipt,
                explorerUrl: service.getExplorerUrl(txHash)
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
// ==================== USER BALANCE ENDPOINTS ====================
/**
 * GET /api/blockchain/balance
 * Get all token balances for authenticated user
 */
router.get('/balance', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Get user wallet address from database
        const { queryOne } = await import('../utils/database.js');
        const user = await queryOne('SELECT wallet_address FROM users WHERE id = ?', [req.user.id]);
        if (!user || !user.wallet_address) {
            return res.status(400).json({
                success: false,
                error: 'User wallet address not found'
            });
        }
        const service = getService();
        // Get native balance
        const nativeBalance = await service.getBalance(user.wallet_address);
        // Get all token balances
        const tokens = config.contracts;
        const tokenBalances = await Promise.allSettled([
            tokens.usdc ? service.getTokenBalance(tokens.usdc, user.wallet_address) : Promise.resolve(null),
            tokens.idrx ? service.getTokenBalance(tokens.idrx, user.wallet_address) : Promise.resolve(null),
            tokens.cnht ? service.getTokenBalance(tokens.cnht, user.wallet_address) : Promise.resolve(null),
            tokens.euroc ? service.getTokenBalance(tokens.euroc, user.wallet_address) : Promise.resolve(null),
            tokens.jpyc ? service.getTokenBalance(tokens.jpyc, user.wallet_address) : Promise.resolve(null),
            tokens.mxnt ? service.getTokenBalance(tokens.mxnt, user.wallet_address) : Promise.resolve(null)
        ]);
        const balances = {
            address: user.wallet_address,
            native: nativeBalance,
            tokens: {}
        };
        const tokenNames = ['usdc', 'idrx', 'cnht', 'euroc', 'jpyc', 'mxnt'];
        tokenBalances.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                balances.tokens[tokenNames[index]] = result.value;
            }
        });
        res.json({
            success: true,
            data: balances
        });
    }
    catch (error) {
        console.error('Error getting user balances:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get user balances'
        });
    }
});
export default router;
