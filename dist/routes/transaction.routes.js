import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { TransactionService } from '../services/transaction.service.js';
const router = Router();
/**
 * GET /api/transactions
 * Get user transaction history (combined transfers + transactions)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const transactions = await TransactionService.getCombinedHistory(req.user.id, limit, offset);
        res.json({
            success: true,
            data: {
                transactions,
                count: transactions.length,
                limit,
                offset
            }
        });
    }
    catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get transactions'
        });
    }
});
/**
 * GET /api/transactions/stats
 * Get user transaction statistics
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const stats = await TransactionService.getUserStatistics(req.user.id);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting transaction stats:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get transaction stats'
        });
    }
});
/**
 * GET /api/transactions/swaps
 * Get swap history for authenticated user
 */
router.get('/swaps', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const swaps = await TransactionService.getSwapHistory(req.user.id, limit, offset);
        res.json({
            success: true,
            data: {
                swaps,
                count: swaps.length,
                limit,
                offset
            }
        });
    }
    catch (error) {
        console.error('Error getting swap history:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get swap history'
        });
    }
});
/**
 * GET /api/transactions/hash/:txHash
 * Get transaction by blockchain hash
 */
router.get('/hash/:txHash', authenticate, async (req, res) => {
    try {
        const { txHash } = req.params;
        // Try to find in transactions table
        let transaction = await TransactionService.getTransactionByHash(txHash);
        // If not found, try swaps table
        if (!transaction) {
            const swap = await TransactionService.getSwapByHash(txHash);
            if (swap) {
                return res.json({
                    success: true,
                    data: {
                        type: 'swap',
                        ...swap
                    }
                });
            }
        }
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        res.json({
            success: true,
            data: {
                type: 'transaction',
                ...transaction
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
 * GET /api/transactions/:transactionId
 * Get transaction by ID
 */
router.get('/:transactionId', authenticate, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await TransactionService.getTransactionById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        res.json({
            success: true,
            data: transaction
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
export default router;
