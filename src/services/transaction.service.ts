import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, Transaction, User } from '../utils/database.js';
import { ExchangeService } from './exchange.service.js';
import { TransferRepository } from '../repositories/transfer.repository.js';

export class TransactionService {
  private exchangeService: ExchangeService;

  constructor() {
    this.exchangeService = new ExchangeService();
  }

  async createTransaction(
    senderId: string,
    recipientPhone: string,
    sourceCurrency: string,
    targetCurrency: string,
    sourceAmount: number,
    recipientBankAccount?: string
  ): Promise<Transaction> {
    try {
      const sender = await queryOne<User>(
        'SELECT * FROM users WHERE id = ?',
        [senderId]
      );

      if (!sender) {
        throw new Error('Sender not found');
      }

      if (sender.status !== 'VERIFIED') {
        throw new Error('Sender must be KYC verified');
      }

      // Calculate transfer amounts and fees
      const calculation = await this.exchangeService.calculateTransferAmount(
        sourceAmount,
        sourceCurrency,
        targetCurrency
      );

      const transactionId = uuidv4();
      await query(
        `INSERT INTO transactions 
         (id, sender_id, recipient_phone, source_currency, target_currency, 
          source_amount, target_amount, exchange_rate, fee_amount, total_amount, 
          status, recipient_bank_account) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
        [
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
        ]
      );

      const transaction = await queryOne<Transaction>(
        'SELECT * FROM transactions WHERE id = ?',
        [transactionId]
      );

      if (!transaction) {
        throw new Error('Failed to create transaction');
      }

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    return await queryOne<Transaction>(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );
  }

  async getTransactionsByUser(userId: string, limit = 10): Promise<Transaction[]> {
    return await query<Transaction>(
      'SELECT * FROM transactions WHERE sender_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }

  async updateTransactionStatus(
    transactionId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    blockchainTxHash?: string
  ): Promise<Transaction> {
    const updates: string[] = ['status = ?'];
    const params: any[] = [status];

    if (blockchainTxHash) {
      updates.push('blockchain_tx_hash = ?');
      params.push(blockchainTxHash);
    }

    if (status === 'COMPLETED') {
      updates.push('completed_at = NOW()');
    }

    params.push(transactionId);

    await query(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const transaction = await queryOne<Transaction>(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async completeTransaction(transactionId: string, blockchainTxHash: string): Promise<Transaction> {
    return await this.updateTransactionStatus(transactionId, 'COMPLETED', blockchainTxHash);
  }

  async failTransaction(transactionId: string): Promise<Transaction> {
    return await this.updateTransactionStatus(transactionId, 'FAILED');
  }

  async getTransactionHistory(userId: string, limit = 20): Promise<any[]> {
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

  async getTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    completedTransactions: number;
    totalAmount: number;
  }> {
    // Use transfers table instead of transactions table
    const stats = await queryOne<any>(
      `SELECT
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTransactions,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as totalAmount
       FROM transfers
       WHERE user_id = ?`,
      [userId]
    );

    return {
      totalTransactions: stats?.totalTransactions || 0,
      completedTransactions: stats?.completedTransactions || 0,
      totalAmount: stats?.totalAmount || 0
    };
  }
}
