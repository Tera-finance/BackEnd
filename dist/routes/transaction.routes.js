import { Router } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import { authenticate } from '../middleware/auth.js';
import { apiRateLimit } from '../middleware/rateLimit.js';
const router = Router();
const transactionService = new TransactionService();
// Get transaction history for authenticated user
router.get('/history', authenticate, apiRateLimit, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const limit = parseInt(req.query.limit) || 20;
        const transactions = await transactionService.getTransactionHistory(req.user.id, limit);
        res.json({
            success: true,
            count: transactions.length,
            transactions
        });
    }
    catch (error) {
        console.error('Get transaction history error:', error);
        res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
});
// Get transaction by ID
router.get('/:id', authenticate, apiRateLimit, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const transaction = await transactionService.getTransactionById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        // Ensure user owns this transaction
        if (transaction.sender_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({
            success: true,
            transaction
        });
    }
    catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});
// Get transaction statistics
router.get('/stats/summary', authenticate, apiRateLimit, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const stats = await transactionService.getTransactionStats(req.user.id);
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        console.error('Get transaction stats error:', error);
        res.status(500).json({ error: 'Failed to fetch transaction stats' });
    }
});
export default router;
