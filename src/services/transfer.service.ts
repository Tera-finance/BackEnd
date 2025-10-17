import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../utils/database.js';
import { getBlockchainService } from './blockchain.service.js';
import { ExchangeService } from './exchange.service.js';
import { config } from '../utils/config.js';

interface TransferInitiateRequest {
  userId?: string;
  whatsappNumber: string;
  paymentMethod: 'WALLET' | 'MASTERCARD';
  senderCurrency: string;
  senderAmount: number;
  recipientName: string;
  recipientCurrency: string;
  recipientBank: string;
  recipientAccount: string;
  recipientWalletAddress?: string;
  cardDetails?: {
    number: string;
    cvc: string;
    expiry: string;
  };
}

interface Transfer {
  id: string;
  userId?: string;
  whatsappNumber: string;
  status: string;
  paymentMethod: string;
  senderCurrency: string;
  senderAmount: number;
  senderTokenAddress?: string;
  totalAmount: number;
  recipientName: string;
  recipientCurrency: string;
  recipientTokenAddress?: string;
  recipientExpectedAmount: number;
  recipientBank: string;
  recipientAccount: string;
  recipientWalletAddress?: string;
  exchangeRate: number;
  conversionPath?: string;
  feePercentage: number;
  feeAmount: number;
  network: string;
  chainId: number;
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  gasUsed?: number;
  blockchainTxUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  paidAt?: Date;
  completedAt?: Date;
}

export class TransferService {
  /**
   * Get token contract address from currency code
   */
  private static getTokenAddress(currency: string): string {
    const tokenMap: Record<string, string> = {
      'USD': config.contracts.usdc,
      'IDR': config.contracts.idrx,
      'CNY': config.contracts.cnht,
      'EUR': config.contracts.euroc,
      'JPY': config.contracts.jpyc,
      'MXN': config.contracts.mxnt
    };

    return tokenMap[currency] || '';
  }

  /**
   * Initiate a new transfer
   */
  static async initiateTransfer(request: TransferInitiateRequest): Promise<Transfer> {
    // Generate transfer ID
    const transferId = `TXN-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Get exchange rate and calculate amounts
    const quote = await ExchangeService.getTransferQuote(
      request.senderCurrency,
      request.recipientCurrency,
      request.senderAmount,
      1.5 // 1.5% fee
    );

    // Get token addresses
    const senderTokenAddress = this.getTokenAddress(request.senderCurrency);
    const recipientTokenAddress = this.getTokenAddress(request.recipientCurrency);

    // Create transfer record
    const transfer: Partial<Transfer> = {
      id: transferId,
      userId: request.userId,
      whatsappNumber: request.whatsappNumber,
      status: 'pending',
      paymentMethod: request.paymentMethod,
      senderCurrency: request.senderCurrency,
      senderAmount: request.senderAmount,
      senderTokenAddress,
      totalAmount: quote.totalAmount,
      recipientName: request.recipientName,
      recipientCurrency: request.recipientCurrency,
      recipientTokenAddress,
      recipientExpectedAmount: quote.recipientAmount,
      recipientBank: request.recipientBank,
      recipientAccount: request.recipientAccount,
      recipientWalletAddress: request.recipientWalletAddress,
      exchangeRate: quote.exchangeRate,
      conversionPath: `${request.senderCurrency}->${request.recipientCurrency}`,
      feePercentage: 1.5,
      feeAmount: quote.feeAmount,
      network: config.blockchain.network,
      chainId: config.blockchain.chainId
    };

    // Insert into database (convert undefined to null for SQL compatibility)
    await query(
      `INSERT INTO transfers (
        id, user_id, whatsapp_number, status, payment_method,
        sender_currency, sender_amount, sender_token_address, total_amount,
        recipient_name, recipient_currency, recipient_token_address,
        recipient_expected_amount, recipient_bank, recipient_account, recipient_wallet_address,
        exchange_rate, conversion_path, fee_percentage, fee_amount,
        network, chain_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transfer.id,
        transfer.userId || null, // Convert undefined to null
        transfer.whatsappNumber,
        transfer.status,
        transfer.paymentMethod,
        transfer.senderCurrency,
        transfer.senderAmount,
        transfer.senderTokenAddress || null, // Convert undefined to null
        transfer.totalAmount,
        transfer.recipientName,
        transfer.recipientCurrency,
        transfer.recipientTokenAddress || null, // Convert undefined to null
        transfer.recipientExpectedAmount,
        transfer.recipientBank,
        transfer.recipientAccount,
        transfer.recipientWalletAddress || null, // Convert undefined to null
        transfer.exchangeRate,
        transfer.conversionPath,
        transfer.feePercentage,
        transfer.feeAmount,
        transfer.network,
        transfer.chainId
      ]
    );

    console.log(`✅ Transfer ${transferId} created successfully`);

    // If payment method is WALLET, start blockchain processing
    if (request.paymentMethod === 'WALLET') {
      // Process in background (don't await)
      this.processBlockchainTransfer(transferId).catch(error => {
        console.error(`❌ Error processing blockchain transfer ${transferId}:`, error);
      });
    }

    return transfer as Transfer;
  }

  /**
   * Process blockchain transfer (swap tokens)
   */
  private static async processBlockchainTransfer(transferId: string): Promise<void> {
    try {
      console.log(`🔄 Processing blockchain transfer ${transferId}`);

      // Get transfer details
      const transfer = await this.getTransferById(transferId);
      if (!transfer) {
        throw new Error('Transfer not found');
      }

      // Validate token addresses
      if (!transfer.senderTokenAddress || !transfer.recipientTokenAddress) {
        throw new Error('Token addresses not configured');
      }

      if (!config.contracts.multiTokenSwap) {
        throw new Error('MultiTokenSwap contract not configured');
      }

      // Update status to processing
      await this.updateTransferStatus(transferId, 'processing');

      // Get blockchain service
      const blockchainService = getBlockchainService();

      // Check if blockchain service is ready (has wallet)
      if (!blockchainService.isReady()) {
        console.warn(`⚠️  Blockchain service not ready for ${transferId}, simulating...`);
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.updateTransferStatus(transferId, 'completed');
        await query('UPDATE transfers SET completed_at = NOW() WHERE id = ?', [transferId]);
        console.log(`✅ Transfer ${transferId} simulated successfully`);
        return;
      }

      try {
        // Execute token swap on blockchain
        console.log(`🔗 Executing blockchain swap for ${transferId}...`);
        console.log(`   From: ${transfer.senderAmount} ${transfer.senderCurrency} (${transfer.senderTokenAddress})`);
        console.log(`   To: ${transfer.recipientExpectedAmount} ${transfer.recipientCurrency} (${transfer.recipientTokenAddress})`);

        // Get backend wallet address
        const backendAddress = await blockchainService.getBackendAddress();

        // Calculate amounts in token units (assuming 6 decimals for all tokens)
        const decimals = 6;
        const amountIn = BigInt(Math.floor(transfer.senderAmount * Math.pow(10, decimals)));
        const minAmountOut = BigInt(Math.floor(transfer.recipientExpectedAmount * Math.pow(10, decimals) * 0.98)); // 2% slippage

        console.log(`   Amount In: ${amountIn.toString()} (${transfer.senderAmount} * 10^${decimals})`);
        console.log(`   Min Amount Out: ${minAmountOut.toString()} (${transfer.recipientExpectedAmount} * 10^${decimals} * 0.98)`);

        // Step 1: Approve token spending
        console.log(`📝 Step 1: Approving token...`);
        const approvalTxHash = await blockchainService.approveToken(
          transfer.senderTokenAddress,
          config.contracts.multiTokenSwap!,
          amountIn
        );
        console.log(`✅ Token approved: ${approvalTxHash}`);

        // Step 2: Execute swap
        console.log(`🔄 Step 2: Executing swap...`);
        const { txHash, amountOut } = await blockchainService.executeMultiTokenSwap(
          transfer.senderTokenAddress,
          transfer.recipientTokenAddress,
          amountIn,
          transfer.recipientWalletAddress || backendAddress,
          minAmountOut
        );
        console.log(`✅ Swap executed: ${txHash}`);
        console.log(`✅ Amount received: ${amountOut.toString()}`);

        const explorerUrl = `${config.blockchain.explorerUrl}/tx/${txHash}`;

        // Update transfer with transaction details
        await query(
          `UPDATE transfers
           SET tx_hash = ?,
               blockchain_tx_url = ?,
               status = 'completed',
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = ?`,
          [txHash, explorerUrl, transferId]
        );

        // Record swap in evm_swaps table
        await query(
          `INSERT INTO evm_swaps (
            transfer_id, user_id,
            from_token_symbol, from_token_address,
            to_token_symbol, to_token_address,
            from_amount, to_amount, exchange_rate,
            sender_address, recipient_address,
            swap_contract, swap_type,
            tx_hash, network, chain_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transferId,
            transfer.userId || null, // Convert undefined to null
            transfer.senderCurrency,
            transfer.senderTokenAddress,
            transfer.recipientCurrency,
            transfer.recipientTokenAddress,
            transfer.senderAmount,
            transfer.recipientExpectedAmount,
            transfer.exchangeRate,
            backendAddress,
            transfer.recipientWalletAddress || backendAddress,
            config.contracts.multiTokenSwap,
            'MULTI_TOKEN',
            txHash,
            transfer.network,
            transfer.chainId,
            'CONFIRMED'
          ]
        );

        console.log(`✅ Transfer ${transferId} completed with tx: ${txHash}`);
      } catch (blockchainError: any) {
        console.error(`❌ Blockchain execution failed for ${transferId}:`, blockchainError.message);
        throw blockchainError;
      }
    } catch (error: any) {
      console.error(`❌ Error processing transfer ${transferId}:`, error.message);
      await this.updateTransferStatus(transferId, 'failed');
    }
  }

  /**
   * Update transfer status
   */
  static async updateTransferStatus(transferId: string, status: string): Promise<void> {
    await query(
      'UPDATE transfers SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, transferId]
    );
  }

  /**
   * Get transfer by ID
   */
  static async getTransferById(transferId: string): Promise<Transfer | null> {
    const result = await queryOne<Transfer>(
      'SELECT * FROM transfers WHERE id = ?',
      [transferId]
    );
    return result;
  }

  /**
   * Get transfer status
   */
  static async getTransferStatus(transferId: string): Promise<{
    transferId: string;
    status: string;
    senderAmount: number;
    senderCurrency: string;
    recipientAmount: number;
    recipientCurrency: string;
    recipientName: string;
    txHash?: string;
    blockchainTxUrl?: string;
    createdAt: Date;
    completedAt?: Date;
  } | null> {
    const transfer = await this.getTransferById(transferId);
    if (!transfer) {
      return null;
    }

    return {
      transferId: transfer.id,
      status: transfer.status,
      senderAmount: transfer.senderAmount,
      senderCurrency: transfer.senderCurrency,
      recipientAmount: transfer.recipientExpectedAmount,
      recipientCurrency: transfer.recipientCurrency,
      recipientName: transfer.recipientName,
      txHash: transfer.txHash,
      blockchainTxUrl: transfer.blockchainTxUrl,
      createdAt: transfer.createdAt,
      completedAt: transfer.completedAt
    };
  }

  /**
   * Get transfer history for a user
   */
  static async getTransferHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Transfer[]> {
    const results = await query<Transfer>(
      `SELECT * FROM transfers
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return results;
  }

  /**
   * Get transfer history by WhatsApp number
   */
  static async getTransferHistoryByWhatsApp(
    whatsappNumber: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Transfer[]> {
    const results = await query<Transfer>(
      `SELECT * FROM transfers
       WHERE whatsapp_number = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [whatsappNumber, limit, offset]
    );
    return results;
  }

  /**
   * Get pending transfers for a user
   */
  static async getPendingTransfers(userId: string): Promise<Transfer[]> {
    const results = await query<Transfer>(
      `SELECT * FROM transfers
       WHERE user_id = ? AND status IN ('pending', 'processing')
       ORDER BY created_at DESC`,
      [userId]
    );
    return results;
  }
}
