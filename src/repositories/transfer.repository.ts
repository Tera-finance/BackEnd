import { query, queryOne } from '../utils/database.js';
import { EncryptionUtil } from '../utils/encryption.js';

export interface Transfer {
  id: string;
  user_id?: string;
  whatsapp_number: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'WALLET' | 'MASTERCARD';
  sender_currency: string;
  sender_amount: number;
  total_amount: number;
  recipient_name: string;
  recipient_currency: string;
  recipient_expected_amount: number;
  recipient_bank: string;
  recipient_account: string;
  ada_amount?: number;
  exchange_rate: number;
  conversion_path?: string;
  fee_percentage: number;
  fee_amount: number;
  uses_mock_token: boolean;
  mock_token?: string;
  policy_id?: string;
  tx_hash?: string;
  blockchain_tx_url?: string;
  card_number_encrypted?: string;
  card_last4?: string;
  payment_link?: string;
  created_at: Date;
  updated_at: Date;
  paid_at?: Date;
  completed_at?: Date;
}

export interface CreateTransferRequest {
  id: string;
  user_id?: string;
  whatsapp_number: string;
  payment_method: 'WALLET' | 'MASTERCARD';
  sender_currency: string;
  sender_amount: number;
  total_amount: number;
  recipient_name: string;
  recipient_currency: string;
  recipient_expected_amount: number;
  recipient_bank: string;
  recipient_account: string;
  ada_amount?: number;
  exchange_rate: number;
  conversion_path?: string;
  fee_percentage: number;
  fee_amount: number;
  uses_mock_token: boolean;
  mock_token?: string;
  policy_id?: string;
  card_number?: string;
  payment_link?: string;
}

export class TransferRepository {
  /**
   * Create a new transfer record
   */
  static async create(data: CreateTransferRequest): Promise<Transfer> {
    try {
      let card_number_encrypted = null;
      let card_last4 = null;

      // Encrypt card number if provided (MASTERCARD payment)
      if (data.card_number) {
        card_number_encrypted = EncryptionUtil.encrypt(data.card_number);
        card_last4 = data.card_number.slice(-4);
      }

      await query(
        `INSERT INTO transfers (
          id, user_id, whatsapp_number, status, payment_method,
          sender_currency, sender_amount, total_amount,
          recipient_name, recipient_currency, recipient_expected_amount,
          recipient_bank, recipient_account,
          ada_amount, exchange_rate, conversion_path,
          fee_percentage, fee_amount,
          uses_mock_token, mock_token, policy_id,
          card_number_encrypted, card_last4, payment_link
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );

      const transfer = await this.findById(data.id);
      if (!transfer) {
        throw new Error('Failed to create transfer');
      }

      return transfer;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  }

  /**
   * Find transfer by ID
   */
  static async findById(id: string): Promise<Transfer | null> {
    return await queryOne<Transfer>(
      'SELECT * FROM transfers WHERE id = ?',
      [id]
    );
  }

  /**
   * Find transfers by WhatsApp number
   */
  static async findByWhatsAppNumber(
    whatsappNumber: string,
    limit: number = 20
  ): Promise<Transfer[]> {
    return await query<Transfer>(
      'SELECT * FROM transfers WHERE whatsapp_number = ? ORDER BY created_at DESC LIMIT ?',
      [whatsappNumber, limit]
    );
  }

  /**
   * Find transfers by user ID
   */
  static async findByUserId(
    userId: string,
    limit: number = 20
  ): Promise<Transfer[]> {
    return await query<Transfer>(
      'SELECT * FROM transfers WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }

  /**
   * Update transfer status
   */
  static async updateStatus(
    id: string,
    status: Transfer['status'],
    additionalData?: {
      tx_hash?: string;
      blockchain_tx_url?: string;
    }
  ): Promise<Transfer> {
    const updates: string[] = ['status = ?'];
    const params: any[] = [status];

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

    await query(
      `UPDATE transfers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const transfer = await this.findById(id);
    if (!transfer) {
      throw new Error('Transfer not found after update');
    }

    return transfer;
  }

  /**
   * Update transfer with blockchain transaction hash
   */
  static async updateBlockchainTx(
    id: string,
    txHash: string,
    blockchainTxUrl?: string
  ): Promise<Transfer> {
    await query(
      'UPDATE transfers SET tx_hash = ?, blockchain_tx_url = ? WHERE id = ?',
      [txHash, blockchainTxUrl || null, id]
    );

    const transfer = await this.findById(id);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return transfer;
  }

  /**
   * Get transfer statistics for a user
   */
  static async getStats(userId: string): Promise<{
    total_transfers: number;
    completed_transfers: number;
    total_amount_sent: number;
    pending_transfers: number;
  }> {
    const stats = await queryOne<any>(
      `SELECT
        COUNT(*) as total_transfers,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transfers,
        SUM(CASE WHEN status = 'completed' THEN sender_amount ELSE 0 END) as total_amount_sent,
        SUM(CASE WHEN status IN ('pending', 'paid', 'processing') THEN 1 ELSE 0 END) as pending_transfers
       FROM transfers
       WHERE user_id = ?`,
      [userId]
    );

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
  static async getRecent(limit: number = 50): Promise<Transfer[]> {
    return await query<Transfer>(
      'SELECT * FROM transfers ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
  }

  /**
   * Get transfers by status
   */
  static async findByStatus(
    status: Transfer['status'],
    limit: number = 50
  ): Promise<Transfer[]> {
    return await query<Transfer>(
      'SELECT * FROM transfers WHERE status = ? ORDER BY created_at DESC LIMIT ?',
      [status, limit]
    );
  }

  /**
   * Cancel a transfer
   */
  static async cancel(id: string): Promise<Transfer> {
    return await this.updateStatus(id, 'cancelled');
  }

  /**
   * Mark transfer as paid
   */
  static async markAsPaid(id: string): Promise<Transfer> {
    return await this.updateStatus(id, 'paid');
  }

  /**
   * Mark transfer as processing
   */
  static async markAsProcessing(id: string): Promise<Transfer> {
    return await this.updateStatus(id, 'processing');
  }

  /**
   * Complete a transfer
   */
  static async complete(
    id: string,
    txHash: string,
    blockchainTxUrl?: string
  ): Promise<Transfer> {
    return await this.updateStatus(id, 'completed', {
      tx_hash: txHash,
      blockchain_tx_url: blockchainTxUrl
    });
  }

  /**
   * Mark transfer as failed
   */
  static async markAsFailed(id: string): Promise<Transfer> {
    return await this.updateStatus(id, 'failed');
  }
}
