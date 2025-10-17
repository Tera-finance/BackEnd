import { query, queryOne } from '../utils/database.js';
export class TransactionService {
    /**
     * Get transaction history for a user
     */
    static async getTransactionHistory(userId, limit = 20, offset = 0) {
        const results = await query(`SELECT * FROM transactions
       WHERE sender_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        return results;
    }
    /**
     * Get transaction by ID
     */
    static async getTransactionById(transactionId) {
        const result = await queryOne('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        return result;
    }
    /**
     * Get transaction by blockchain hash
     */
    static async getTransactionByHash(txHash) {
        const result = await queryOne('SELECT * FROM transactions WHERE blockchain_tx_hash = ?', [txHash]);
        return result;
    }
    /**
     * Get swap history for a user
     */
    static async getSwapHistory(userId, limit = 20, offset = 0) {
        const results = await query(`SELECT * FROM evm_swaps
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        return results;
    }
    /**
     * Get all recent swaps
     */
    static async getRecentSwaps(limit = 50) {
        const results = await query(`SELECT * FROM evm_swaps
       ORDER BY created_at DESC
       LIMIT ?`, [limit]);
        return results;
    }
    /**
     * Get swap by transaction hash
     */
    static async getSwapByHash(txHash) {
        const result = await queryOne('SELECT * FROM evm_swaps WHERE tx_hash = ?', [txHash]);
        return result;
    }
    /**
     * Get swaps for a specific transfer
     */
    static async getSwapsForTransfer(transferId) {
        const results = await query(`SELECT * FROM evm_swaps
       WHERE transfer_id = ?
       ORDER BY created_at ASC`, [transferId]);
        return results;
    }
    /**
     * Get transaction statistics for a user
     */
    static async getUserStatistics(userId) {
        const result = await queryOne(`SELECT
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedTransactions,
        SUM(CASE WHEN status IN ('PENDING', 'PROCESSING') THEN 1 ELSE 0 END) as pendingTransactions,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failedTransactions,
        SUM(source_amount) as totalVolume,
        SUM(fee_amount) as totalFees
       FROM transactions
       WHERE sender_id = ?`, [userId]);
        return {
            totalTransactions: parseInt(result?.totalTransactions || '0'),
            completedTransactions: parseInt(result?.completedTransactions || '0'),
            pendingTransactions: parseInt(result?.pendingTransactions || '0'),
            failedTransactions: parseInt(result?.failedTransactions || '0'),
            totalVolume: parseFloat(result?.totalVolume || '0'),
            totalFees: parseFloat(result?.totalFees || '0')
        };
    }
    /**
     * Get combined transaction history (transfers + transactions)
     */
    static async getCombinedHistory(userId, limit = 20, offset = 0) {
        // Get transfers
        const transfers = await query(`SELECT
        id,
        'transfer' as type,
        sender_currency as sourceCurrency,
        recipient_currency as targetCurrency,
        sender_amount as sourceAmount,
        recipient_expected_amount as targetAmount,
        exchange_rate as exchangeRate,
        fee_amount as feeAmount,
        total_amount as totalAmount,
        status,
        tx_hash as blockchainTxHash,
        network,
        created_at as createdAt,
        completed_at as completedAt
       FROM transfers
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        // Get transactions
        const transactions = await query(`SELECT
        id,
        'transaction' as type,
        source_currency as sourceCurrency,
        target_currency as targetCurrency,
        source_amount as sourceAmount,
        target_amount as targetAmount,
        exchange_rate as exchangeRate,
        fee_amount as feeAmount,
        total_amount as totalAmount,
        status,
        blockchain_tx_hash as blockchainTxHash,
        network,
        created_at as createdAt,
        completed_at as completedAt
       FROM transactions
       WHERE sender_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        // Combine and sort by date
        const combined = [...transfers, ...transactions]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        return combined;
    }
}
