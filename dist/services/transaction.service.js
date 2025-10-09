"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../utils/database");
const exchange_service_1 = require("./exchange.service");
class TransactionService {
    constructor() {
        this.exchangeService = new exchange_service_1.ExchangeService();
    }
    async createTransaction(senderId, recipientPhone, sourceCurrency, targetCurrency, sourceAmount, recipientBankAccount) {
        try {
            const sender = await (0, database_1.queryOne)('SELECT * FROM users WHERE id = ?', [senderId]);
            if (!sender) {
                throw new Error('Sender not found');
            }
            if (sender.status !== 'VERIFIED') {
                throw new Error('Sender must be KYC verified');
            }
            // Calculate transfer amounts and fees
            const calculation = await this.exchangeService.calculateTransferAmount(sourceAmount, sourceCurrency, targetCurrency);
            const transactionId = (0, uuid_1.v4)();
            await (0, database_1.query)(`INSERT INTO transactions 
         (id, sender_id, recipient_phone, source_currency, target_currency, 
          source_amount, target_amount, exchange_rate, fee_amount, total_amount, 
          status, recipient_bank_account) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`, [
                transactionId,
                senderId,
                recipientPhone,
                sourceCurrency,
                targetCurrency,
                calculation.sourceAmount,
                calculation.targetAmount,
                calculation.exchangeRate,
                calculation.feeAmount,
                calculation.totalAmount,
                recipientBankAccount
            ]);
            const transaction = await (0, database_1.queryOne)('SELECT * FROM transactions WHERE id = ?', [transactionId]);
            if (!transaction) {
                throw new Error('Failed to create transaction');
            }
            return transaction;
        }
        catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }
    async getTransactionById(transactionId) {
        return await (0, database_1.queryOne)('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    }
    async getTransactionsByUser(userId, limit = 10) {
        return await (0, database_1.query)('SELECT * FROM transactions WHERE sender_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    }
    async updateTransactionStatus(transactionId, status, blockchainTxHash) {
        const updates = ['status = ?'];
        const params = [status];
        if (blockchainTxHash) {
            updates.push('blockchain_tx_hash = ?');
            params.push(blockchainTxHash);
        }
        if (status === 'COMPLETED') {
            updates.push('completed_at = NOW()');
        }
        params.push(transactionId);
        await (0, database_1.query)(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, params);
        const transaction = await (0, database_1.queryOne)('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return transaction;
    }
    async completeTransaction(transactionId, blockchainTxHash) {
        return await this.updateTransactionStatus(transactionId, 'COMPLETED', blockchainTxHash);
    }
    async failTransaction(transactionId) {
        return await this.updateTransactionStatus(transactionId, 'FAILED');
    }
    async getTransactionHistory(userId, limit = 20) {
        return await (0, database_1.query)(`SELECT * FROM transactions 
       WHERE sender_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`, [userId, limit]);
    }
    async getTransactionStats(userId) {
        const stats = await (0, database_1.queryOne)(`SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedTransactions,
        SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as totalAmount
       FROM transactions 
       WHERE sender_id = ?`, [userId]);
        return {
            totalTransactions: stats?.totalTransactions || 0,
            completedTransactions: stats?.completedTransactions || 0,
            totalAmount: stats?.totalAmount || 0
        };
    }
}
exports.TransactionService = TransactionService;
