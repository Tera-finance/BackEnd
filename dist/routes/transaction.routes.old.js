"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_service_1 = require("../services/transaction.service");
const exchange_service_1 = require("../services/exchange.service");
// WalletService removed - using Cardano wallet service instead
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
const transactionService = new transaction_service_1.TransactionService();
const exchangeService = new exchange_service_1.ExchangeService();
const walletService = new WalletService();
router.post('/create', auth_1.authenticate, auth_1.requireKYC, rateLimit_1.apiRateLimit, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { recipientPhone, sourceCurrency, targetCurrency, sourceAmount, recipientBankAccount } = req.body;
        if (!recipientPhone || !sourceCurrency || !targetCurrency || !sourceAmount) {
            return res.status(400).json({
                error: 'All transaction fields are required'
            });
        }
        if (sourceAmount <= 0) {
            return res.status(400).json({
                error: 'Source amount must be greater than 0'
            });
        }
        const transaction = await transactionService.createTransaction(req.user.id, recipientPhone, sourceCurrency, targetCurrency, sourceAmount, recipientBankAccount);
        res.json({
            message: 'Transaction created successfully',
            transaction: {
                id: transaction.id,
                recipientPhone: transaction.recipient_phone,
                sourceAmount: transaction.source_amount,
                targetAmount: transaction.target_amount,
                exchangeRate: transaction.exchange_rate,
                feeAmount: transaction.fee_amount,
                totalAmount: transaction.total_amount,
                status: transaction.status,
                createdAt: transaction.created_at
            }
        });
    }
    catch (error) {
        console.error('Create transaction error:', error);
        res.status(400).json({ error: error.message || 'Transaction creation failed' });
    }
});
router.post('/process/:transactionId', auth_1.authenticate, auth_1.requireKYC, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await transactionService.processTransaction(transactionId);
        res.json({
            message: 'Transaction processing started',
            transaction: {
                id: transaction.id,
                status: transaction.status,
                blockchainTxHash: transaction.blockchain_tx_hash
            }
        });
    }
    catch (error) {
        console.error('Process transaction error:', error);
        res.status(400).json({ error: error.message || 'Transaction processing failed' });
    }
});
router.get('/quote', auth_1.authenticate, rateLimit_1.apiRateLimit, async (req, res) => {
    try {
        const { sourceCurrency, targetCurrency, sourceAmount } = req.query;
        if (!sourceCurrency || !targetCurrency || !sourceAmount) {
            return res.status(400).json({
                error: 'Source currency, target currency, and amount are required'
            });
        }
        const amount = parseFloat(sourceAmount);
        if (amount <= 0) {
            return res.status(400).json({
                error: 'Amount must be greater than 0'
            });
        }
        const quote = await exchangeService.calculateTransferAmount(amount, sourceCurrency, targetCurrency);
        res.json({
            quote: {
                sourceAmount: quote.sourceAmount,
                targetAmount: quote.targetAmount,
                exchangeRate: quote.exchangeRate,
                feeAmount: quote.feeAmount,
                totalAmount: quote.totalAmount,
                timestamp: Date.now()
            }
        });
    }
    catch (error) {
        console.error('Get quote error:', error);
        res.status(400).json({ error: error.message || 'Failed to get quote' });
    }
});
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        const transactions = await transactionService.getUserTransactions(req.user.id, limit, offset);
        res.json({
            transactions: transactions.map(tx => ({
                id: tx.id,
                recipientPhone: tx.recipient_phone,
                sourceCurrency: tx.source_currency,
                targetCurrency: tx.target_currency,
                sourceAmount: tx.source_amount,
                targetAmount: tx.target_amount,
                exchangeRate: tx.exchange_rate,
                feeAmount: tx.fee_amount,
                totalAmount: tx.total_amount,
                status: tx.status,
                blockchainTxHash: tx.blockchain_tx_hash,
                createdAt: tx.created_at,
                completedAt: tx.completed_at
            })),
            pagination: {
                limit,
                offset,
                total: transactions.length
            }
        });
    }
    catch (error) {
        console.error('Get transaction history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:transactionId', auth_1.authenticate, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await transactionService.getTransaction(transactionId);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        if (transaction.sender_id !== req.user?.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({
            transaction: {
                id: transaction.id,
                recipientPhone: transaction.recipient_phone,
                sourceCurrency: transaction.source_currency,
                targetCurrency: transaction.target_currency,
                sourceAmount: transaction.source_amount,
                targetAmount: transaction.target_amount,
                exchangeRate: transaction.exchange_rate,
                feeAmount: transaction.fee_amount,
                totalAmount: transaction.total_amount,
                status: transaction.status,
                blockchainTxHash: transaction.blockchain_tx_hash,
                recipientBankAccount: transaction.recipient_bank_account,
                createdAt: transaction.created_at,
                completedAt: transaction.completed_at
            }
        });
    }
    catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:transactionId/cancel', auth_1.authenticate, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await transactionService.getTransaction(transactionId);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        if (transaction.sender_id !== req.user?.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const cancelledTransaction = await transactionService.cancelTransaction(transactionId);
        res.json({
            message: 'Transaction cancelled successfully',
            transaction: {
                id: cancelledTransaction.id,
                status: cancelledTransaction.status
            }
        });
    }
    catch (error) {
        console.error('Cancel transaction error:', error);
        res.status(400).json({ error: error.message || 'Transaction cancellation failed' });
    }
});
router.get('/rates/current', rateLimit_1.apiRateLimit, async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({
                error: 'From and to currencies are required'
            });
        }
        const rate = await exchangeService.getExchangeRate(from, to);
        res.json({ rate });
    }
    catch (error) {
        console.error('Get current rate error:', error);
        res.status(400).json({ error: error.message || 'Failed to get exchange rate' });
    }
});
router.get('/rates/supported', rateLimit_1.apiRateLimit, async (req, res) => {
    try {
        const currencies = await exchangeService.getSupportedCurrencies();
        res.json({ currencies });
    }
    catch (error) {
        console.error('Get supported currencies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
