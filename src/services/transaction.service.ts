import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/database';
import { BlockchainService } from './blockchain.service';
import { ExchangeService } from './exchange.service';
import { WalletService } from './wallet.service';
import { Transaction, TransactionStatus } from '@prisma/client';

export class TransactionService {
  private blockchainService: BlockchainService;
  private exchangeService: ExchangeService;
  private walletService: WalletService;

  constructor() {
    this.blockchainService = new BlockchainService();
    this.exchangeService = new ExchangeService();
    this.walletService = new WalletService();
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
      const sender = await prisma.user.findUnique({
        where: { id: senderId }
      });

      if (!sender) {
        throw new Error('Sender not found');
      }

      if (sender.status !== 'VERIFIED') {
        throw new Error('Sender must be KYC verified');
      }

      // Get sender's active wallet
      const wallet = await this.walletService.getActiveWallet(senderId);
      if (!wallet) {
        throw new Error('No active wallet found');
      }

      // Calculate transfer amounts and fees
      const calculation = await this.exchangeService.calculateTransferAmount(
        sourceAmount,
        sourceCurrency,
        targetCurrency
      );

      // Check wallet balance
      const balance = await this.walletService.getWalletBalance(
        wallet.walletAddress,
        sourceCurrency === 'USDC' ? '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' : undefined // Polygon USDC contract
      );

      if (parseFloat(balance) < calculation.totalAmount) {
        throw new Error('Insufficient balance');
      }

      const transaction = await prisma.transaction.create({
        data: {
          id: uuidv4(),
          senderId,
          recipientPhone,
          sourceCurrency,
          targetCurrency,
          sourceAmount: calculation.sourceAmount,
          targetAmount: calculation.targetAmount,
          exchangeRate: calculation.exchangeRate,
          feeAmount: calculation.feeAmount,
          totalAmount: calculation.totalAmount,
          status: 'PENDING',
          recipientBankAccount
        }
      });

      console.log('Transaction created:', transaction.id);
      return transaction;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }

  async processTransaction(transactionId: string): Promise<Transaction> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { sender: true }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'PENDING') {
        throw new Error('Transaction is not pending');
      }

      // Get sender's wallet
      const wallet = await this.walletService.getActiveWallet(transaction.senderId);
      if (!wallet) {
        throw new Error('Sender wallet not found');
      }

      // Update transaction status to PROCESSING
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'PROCESSING' }
      });

      // Initiate blockchain transfer
      const tokenAddress = transaction.sourceCurrency === 'USDC' 
        ? '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' // Polygon USDC
        : '0x0000000000000000000000000000000000000000'; // Native token

      const txHash = await this.blockchainService.initiateTransfer(
        wallet.walletAddress,
        '0x0000000000000000000000000000000000000000', // Contract address
        transaction.sourceAmount.toString(),
        tokenAddress
      );

      // Update transaction with blockchain hash
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { 
          blockchainTxHash: txHash,
          status: 'PROCESSING'
        }
      });

      console.log('Transaction processing:', transactionId, 'Hash:', txHash);
      
      // In a real implementation, you would:
      // 1. Lock tokens in smart contract
      // 2. Notify local partner about the transfer
      // 3. Wait for partner to process IDR transfer
      // 4. Complete transaction when confirmed

      return updatedTransaction;
    } catch (error) {
      console.error('Process transaction error:', error);
      
      // Mark transaction as failed
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' }
      });
      
      throw error;
    }
  }

  async completeTransaction(transactionId: string): Promise<Transaction> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'PROCESSING') {
        throw new Error('Transaction is not being processed');
      }

      // Update transaction status to COMPLETED
      const completedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      console.log('Transaction completed:', transactionId);
      return completedTransaction;
    } catch (error) {
      console.error('Complete transaction error:', error);
      throw error;
    }
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      return await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { sender: true }
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      throw error;
    }
  }

  async getUserTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    try {
      return await prisma.transaction.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      console.error('Get user transactions error:', error);
      throw error;
    }
  }

  async getTransactionsByStatus(status: TransactionStatus): Promise<Transaction[]> {
    try {
      return await prisma.transaction.findMany({
        where: { status },
        include: { sender: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Get transactions by status error:', error);
      throw error;
    }
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    blockchainTxHash?: string
  ): Promise<Transaction> {
    try {
      const updateData: any = { status };
      
      if (blockchainTxHash) {
        updateData.blockchainTxHash = blockchainTxHash;
      }

      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      return await prisma.transaction.update({
        where: { id: transactionId },
        data: updateData
      });
    } catch (error) {
      console.error('Update transaction status error:', error);
      throw error;
    }
  }

  async cancelTransaction(transactionId: string): Promise<Transaction> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'PENDING') {
        throw new Error('Only pending transactions can be cancelled');
      }

      return await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' }
      });
    } catch (error) {
      console.error('Cancel transaction error:', error);
      throw error;
    }
  }
}