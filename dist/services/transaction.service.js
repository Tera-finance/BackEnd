import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../utils/database.js';
import { ExchangeService } from './exchange.service.js';
import { TransferRepository } from '../repositories/transfer.repository.js';
export class TransactionService {
    constructor() {
        this.exchangeService = new ExchangeService();
    }
    async createTransaction(senderId, recipientPhone, sourceCurrency, targetCurrency, sourceAmount, recipientBankAccount) {
        try {
            const sender = await queryOne('SELECT * FROM users WHERE id = ?', [senderId]);
            if (!sender) {
                throw new Error('Sender not found');
            }
            if (sender.status !== 'VERIFIED') {
                throw new Error('Sender must be KYC verified');
            }
            // Calculate transfer amounts and fees
            const calculation = await this.exchangeService.calculateTransferAmount(sourceAmount, sourceCurrency, targetCurrency);
            const transactionId = uuidv4();
            await query(`INSERT INTO transactions 
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
            const transaction = await queryOne('SELECT * FROM transactions WHERE id = ?', [transactionId]);
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
        return await queryOne('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    }
    async getTransactionsByUser(userId, limit = 10) {
        return await query('SELECT * FROM transactions WHERE sender_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
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
        await query(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, params);
        const transaction = await queryOne('SELECT * FROM transactions WHERE id = ?', [transactionId]);
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
        // Use TransferRepository to get transfers (new system)
        const transfers = await TransferRepository.findByUserId(userId, limit);
        // Map Transfer objects to a format similar to Transaction
        return transfers.map(transfer => ({
            id: transfer.id,
            sender_id: transfer.user_id,
            recipient_name: transfer.recipient_name,
            source_currency: transfer.sender_currency,
            target_currency: transfer.recipient_currency,
            source_amount: transfer.sender_amount,
            target_amount: transfer.recipient_expected_amount,
            exchange_rate: transfer.exchange_rate,
            fee_amount: transfer.fee_amount,
            total_amount: transfer.total_amount,
            status: transfer.status.toUpperCase(),
            payment_method: transfer.payment_method,
            blockchain_tx_hash: transfer.tx_hash,
            blockchain_tx_url: transfer.blockchain_tx_url,
            created_at: transfer.created_at,
            completed_at: transfer.completed_at
        }));
    }
    async getTransactionStats(userId) {
        // Use transfers table instead of transactions table
        const stats = await queryOne(`SELECT
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTransactions,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as totalAmount
       FROM transfers
       WHERE user_id = ?`, [userId]);
        return {
            totalTransactions: stats?.totalTransactions || 0,
            completedTransactions: stats?.completedTransactions || 0,
            totalAmount: stats?.totalAmount || 0
        };
    }
}
