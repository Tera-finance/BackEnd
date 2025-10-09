"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferRepository = void 0;
const database_1 = require("../utils/database");
const encryption_1 = require("../utils/encryption");
class TransferRepository {
    /**
     * Create a new transfer record
     */
    static async create(data) {
        try {
            let card_number_encrypted = null;
            let card_last4 = null;
            // Encrypt card number if provided (MASTERCARD payment)
            if (data.card_number) {
                card_number_encrypted = encryption_1.EncryptionUtil.encrypt(data.card_number);
                card_last4 = data.card_number.slice(-4);
            }
            await (0, database_1.query)(`INSERT INTO transfers (
          id, user_id, whatsapp_number, status, payment_method,
          sender_currency, sender_amount, total_amount,
          recipient_name, recipient_currency, recipient_expected_amount,
          recipient_bank, recipient_account,
          ada_amount, exchange_rate, conversion_path,
          fee_percentage, fee_amount,
          uses_mock_token, mock_token, policy_id,
          card_number_encrypted, card_last4, payment_link
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                data.id,
                data.user_id || null,
                data.whatsapp_number,
                data.payment_method,
                data.sender_currency,
                data.sender_amount,
                data.total_amount,
                data.recipient_name,
                data.recipient_currency,
                data.recipient_expected_amount,
                data.recipient_bank,
                data.recipient_account,
                data.ada_amount || null,
                data.exchange_rate,
                data.conversion_path || null,
                data.fee_percentage,
                data.fee_amount,
                data.uses_mock_token,
                data.mock_token || null,
                data.policy_id || null,
                card_number_encrypted,
                card_last4,
                data.payment_link || null
            ]);
            const transfer = await this.findById(data.id);
            if (!transfer) {
                throw new Error('Failed to create transfer');
            }
            return transfer;
        }
        catch (error) {
            console.error('Error creating transfer:', error);
            throw error;
        }
    }
    /**
     * Find transfer by ID
     */
    static async findById(id) {
        return await (0, database_1.queryOne)('SELECT * FROM transfers WHERE id = ?', [id]);
    }
    /**
     * Find transfers by WhatsApp number
     */
    static async findByWhatsAppNumber(whatsappNumber, limit = 20) {
        return await (0, database_1.query)('SELECT * FROM transfers WHERE whatsapp_number = ? ORDER BY created_at DESC LIMIT ?', [whatsappNumber, limit]);
    }
    /**
     * Find transfers by user ID
     */
    static async findByUserId(userId, limit = 20) {
        return await (0, database_1.query)('SELECT * FROM transfers WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    }
    /**
     * Update transfer status
     */
    static async updateStatus(id, status, additionalData) {
        const updates = ['status = ?'];
        const params = [status];
        if (status === 'paid') {
            updates.push('paid_at = NOW()');
        }
        if (status === 'completed') {
            updates.push('completed_at = NOW()');
        }
        if (additionalData?.tx_hash) {
            updates.push('tx_hash = ?');
            params.push(additionalData.tx_hash);
        }
        if (additionalData?.blockchain_tx_url) {
            updates.push('blockchain_tx_url = ?');
            params.push(additionalData.blockchain_tx_url);
        }
        params.push(id);
        await (0, database_1.query)(`UPDATE transfers SET ${updates.join(', ')} WHERE id = ?`, params);
        const transfer = await this.findById(id);
        if (!transfer) {
            throw new Error('Transfer not found after update');
        }
        return transfer;
    }
    /**
     * Update transfer with blockchain transaction hash
     */
    static async updateBlockchainTx(id, txHash, blockchainTxUrl) {
        await (0, database_1.query)('UPDATE transfers SET tx_hash = ?, blockchain_tx_url = ? WHERE id = ?', [txHash, blockchainTxUrl || null, id]);
        const transfer = await this.findById(id);
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        return transfer;
    }
    /**
     * Get transfer statistics for a user
     */
    static async getStats(userId) {
        const stats = await (0, database_1.queryOne)(`SELECT
        COUNT(*) as total_transfers,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transfers,
        SUM(CASE WHEN status = 'completed' THEN sender_amount ELSE 0 END) as total_amount_sent,
        SUM(CASE WHEN status IN ('pending', 'paid', 'processing') THEN 1 ELSE 0 END) as pending_transfers
       FROM transfers
       WHERE user_id = ?`, [userId]);
        return {
            total_transfers: stats?.total_transfers || 0,
            completed_transfers: stats?.completed_transfers || 0,
            total_amount_sent: stats?.total_amount_sent || 0,
            pending_transfers: stats?.pending_transfers || 0
        };
    }
    /**
     * Get recent transfers (for admin/monitoring)
     */
    static async getRecent(limit = 50) {
        return await (0, database_1.query)('SELECT * FROM transfers ORDER BY created_at DESC LIMIT ?', [limit]);
    }
    /**
     * Get transfers by status
     */
    static async findByStatus(status, limit = 50) {
        return await (0, database_1.query)('SELECT * FROM transfers WHERE status = ? ORDER BY created_at DESC LIMIT ?', [status, limit]);
    }
    /**
     * Cancel a transfer
     */
    static async cancel(id) {
        return await this.updateStatus(id, 'cancelled');
    }
    /**
     * Mark transfer as paid
     */
    static async markAsPaid(id) {
        return await this.updateStatus(id, 'paid');
    }
    /**
     * Mark transfer as processing
     */
    static async markAsProcessing(id) {
        return await this.updateStatus(id, 'processing');
    }
    /**
     * Complete a transfer
     */
    static async complete(id, txHash, blockchainTxUrl) {
        return await this.updateStatus(id, 'completed', {
            tx_hash: txHash,
            blockchain_tx_url: blockchainTxUrl
        });
    }
    /**
     * Mark transfer as failed
     */
    static async markAsFailed(id) {
        return await this.updateStatus(id, 'failed');
    }
}
exports.TransferRepository = TransferRepository;
