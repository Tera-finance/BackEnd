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
        console.error(`❌ Error stack:`, error.stack);
      });
    } else if (request.paymentMethod === 'MASTERCARD') {
      // For Mastercard, simulate payment processing in background
      this.processMastercardPayment(transferId).catch(error => {
        console.error(`❌ Error processing Mastercard payment ${transferId}:`, error);
        console.error(`❌ Error stack:`, error.stack);
      });
    }

    return transfer as Transfer;
  }

  /**
   * Process blockchain transfer (swap tokens)
   */
  private static async processBlockchainTransfer(transferId: string): Promise<void> {
    console.log(`🔄 [START] Processing blockchain transfer ${transferId}`);

    try {
      console.log(`📋 Fetching transfer details for ${transferId}...`);

      // Get transfer details
      const transfer = await this.getTransferById(transferId);
      if (!transfer) {
        console.error(`❌ Transfer ${transferId} not found in database`);
        throw new Error('Transfer not found');
      }

      console.log(`✅ Found transfer: ${JSON.stringify({
        id: transfer.id,
        status: transfer.status,
        senderCurrency: transfer.senderCurrency,
        recipientCurrency: transfer.recipientCurrency,
        senderTokenAddress: transfer.senderTokenAddress,
        recipientTokenAddress: transfer.recipientTokenAddress
      })}`);


      // Update status to processing
      await this.updateTransferStatus(transferId, 'processing');

      // Check if token addresses are configured
      const hasTokenAddresses = transfer.senderTokenAddress && transfer.recipientTokenAddress;
      const hasSwapContract = config.contracts.multiTokenSwap;

      // Get blockchain service and check if ready
      let blockchainService;
      let isBlockchainReady = false;

      try {
        blockchainService = getBlockchainService();
        isBlockchainReady = blockchainService?.isReady() || false;
      } catch (error) {
        console.warn(`⚠️  Failed to initialize blockchain service:`, error);
        isBlockchainReady = false;
      }

      // If not ready for real blockchain execution, simulate
      if (!hasTokenAddresses || !hasSwapContract || !isBlockchainReady) {
        const reason = !hasTokenAddresses
          ? 'Token addresses not configured'
          : !hasSwapContract
          ? 'Swap contract not configured'
          : 'Blockchain service not ready';

        console.warn(`⚠️  ${reason} for ${transferId}, simulating...`);

        // Simulate processing delay (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mark as completed
        await this.updateTransferStatus(transferId, 'completed');
        await query('UPDATE transfers SET completed_at = NOW() WHERE id = ?', [transferId]);

        console.log(`✅ Transfer ${transferId} completed (simulated)`);
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

        console.log(`   Amount In: ${amountIn.toString()} (${transfer.senderAmount} * 10^${decimals})`);

        // Get on-chain quote to determine actual expected output
        console.log(`📊 Getting on-chain quote...`);
        const quote = await blockchainService.estimateMultiTokenSwap(
          transfer.senderTokenAddress,
          transfer.recipientTokenAddress,
          amountIn
        );

        // Apply slippage tolerance to the actual quote (2% slippage)
        const slippageTolerance = 0.02; // 2%
        const minAmountOut = BigInt(Math.floor(Number(quote.netOut) * (1 - slippageTolerance)));

        console.log(`   Expected Out (from contract): ${quote.netOut.toString()}`);
        console.log(`   Min Amount Out (with 2% slippage): ${minAmountOut.toString()}`);

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
   * Process Mastercard payment (mint tokens and swap)
   */
  private static async processMastercardPayment(transferId: string): Promise<void> {
    console.log(`💳 [START] Processing Mastercard payment ${transferId}`);

    try {
      console.log(`📋 Fetching transfer details for ${transferId}...`);

      // Get transfer details
      const transfer = await this.getTransferById(transferId);
      if (!transfer) {
        console.error(`❌ Transfer ${transferId} not found in database`);
        throw new Error('Transfer not found');
      }

      console.log(`✅ Found transfer: ${JSON.stringify({
        id: transfer.id,
        status: transfer.status,
        paymentMethod: transfer.paymentMethod,
        senderAmount: transfer.senderAmount,
        senderCurrency: transfer.senderCurrency,
        recipientCurrency: transfer.recipientCurrency
      })}`);

      // Update status to processing
      await this.updateTransferStatus(transferId, 'processing');

      // Check if token addresses are configured
      const hasTokenAddresses = transfer.senderTokenAddress && transfer.recipientTokenAddress;
      const hasSwapContract = config.contracts.multiTokenSwap;

      // Get blockchain service and check if ready
      let blockchainService;
      let isBlockchainReady = false;

      try {
        blockchainService = getBlockchainService();
        isBlockchainReady = blockchainService?.isReady() || false;
      } catch (error) {
        console.warn(`⚠️  Failed to initialize blockchain service:`, error);
        isBlockchainReady = false;
      }

      // If not ready for real blockchain execution, simulate
      if (!hasTokenAddresses || !hasSwapContract || !isBlockchainReady) {
        const reason = !hasTokenAddresses
          ? 'Token addresses not configured'
          : !hasSwapContract
          ? 'Swap contract not configured'
          : 'Blockchain service not ready';

        console.warn(`⚠️  ${reason} for ${transferId}, simulating...`);

        // Simulate processing delay (3-5 seconds)
        const processingTime = 3000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, processingTime));

        // Mark as paid
        await this.updateTransferStatus(transferId, 'paid');
        await query('UPDATE transfers SET paid_at = NOW(), completed_at = NOW() WHERE id = ?', [transferId]);

        console.log(`✅ Mastercard payment ${transferId} completed (simulated)`);
        return;
      }

      try {
        // Mastercard flow: Mint source token → Swap to destination token
        console.log(`💳 Executing Mastercard flow for ${transferId}...`);

        // Get backend wallet address
        const backendAddress = await blockchainService.getBackendAddress();

        // Calculate amounts in token units (assuming 6 decimals for all tokens)
        const decimals = 6;
        const amountToMint = BigInt(Math.floor(transfer.senderAmount * Math.pow(10, decimals)));

        console.log(`   Amount to Mint: ${amountToMint.toString()} (${transfer.senderAmount} ${transfer.senderCurrency})`);

        // Get on-chain quote to determine actual expected output
        console.log(`📊 Getting on-chain quote...`);
        const quote = await blockchainService.estimateMultiTokenSwap(
          transfer.senderTokenAddress,
          transfer.recipientTokenAddress,
          amountToMint
        );

        // Apply slippage tolerance to the actual quote (2% slippage)
        const slippageTolerance = 0.02; // 2%
        const minAmountOut = BigInt(Math.floor(Number(quote.netOut) * (1 - slippageTolerance)));

        console.log(`   Expected Out (from contract): ${quote.netOut.toString()}`);
        console.log(`   Min Amount Out (with 2% slippage): ${minAmountOut.toString()}`);

        // Step 1: Mint source token (e.g., USDC)
        console.log(`🪙 Step 1: Minting ${transfer.senderCurrency}...`);
        const mintTxHash = await blockchainService.mintToken(
          transfer.senderTokenAddress,
          backendAddress,
          amountToMint
        );
        console.log(`✅ Tokens minted: ${mintTxHash}`);

        // Step 2: Approve token spending
        console.log(`📝 Step 2: Approving token...`);
        const approvalTxHash = await blockchainService.approveToken(
          transfer.senderTokenAddress,
          config.contracts.multiTokenSwap!,
          amountToMint
        );
        console.log(`✅ Token approved: ${approvalTxHash}`);

        // Step 3: Execute swap
        console.log(`🔄 Step 3: Executing swap...`);
        const { txHash, amountOut } = await blockchainService.executeMultiTokenSwap(
          transfer.senderTokenAddress,
          transfer.recipientTokenAddress,
          amountToMint,
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
               paid_at = NOW(),
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
            transfer.userId || null,
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

        console.log(`✅ Mastercard payment ${transferId} completed with tx: ${txHash}`);
      } catch (blockchainError: any) {
        console.error(`❌ Blockchain execution failed for ${transferId}:`, blockchainError.message);
        throw blockchainError;
      }
    } catch (error: any) {
      console.error(`❌ Error processing Mastercard payment ${transferId}:`, error.message);
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
    // Use string interpolation for LIMIT/OFFSET to avoid MySQL parameter issues
    const sql = `SELECT * FROM transfers
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}`;

    const results = await query<Transfer>(sql, [userId]);
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
    console.log(`📞 Querying transfers by WhatsApp:`, {
      whatsappNumber,
      limit,
      offset,
      types: {
        whatsappNumber: typeof whatsappNumber,
        limit: typeof limit,
        offset: typeof offset
      }
    });

    try {
      // Build query with string interpolation for LIMIT/OFFSET to avoid MySQL parameter issues
      const sql = `SELECT * FROM transfers
         WHERE whatsapp_number = ?
         ORDER BY created_at DESC
         LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}`;

      console.log(`🔍 SQL Query:`, sql);
      console.log(`🔍 Parameters:`, [whatsappNumber]);

      const results = await query<Transfer>(sql, [whatsappNumber]);
      console.log(`✅ Query successful, found ${results.length} transfers`);
      return results;
    } catch (error) {
      console.error(`❌ Query failed:`, error);
      throw error;
    }
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

  /**
   * Get pending transfers by WhatsApp number
   */
  static async getPendingTransfersByWhatsApp(whatsappNumber: string): Promise<Transfer[]> {
    const results = await query<Transfer>(
      `SELECT * FROM transfers
       WHERE whatsapp_number = ? AND status IN ('pending', 'processing')
       ORDER BY created_at DESC`,
      [whatsappNumber]
    );
    return results;
  }

  /**
   * Create wallet transfer record (after user has signed transaction)
   */
  static async createWalletTransfer(params: {
    userId?: string;
    whatsappNumber: string;
    senderCurrency: string;
    senderAmount: number;
    recipientName: string;
    recipientCurrency: string;
    recipientBank: string;
    recipientAccount: string;
    txHash: string;
    tokenInAddress: string;
    tokenOutAddress: string;
  }): Promise<Transfer> {
    // Generate transfer ID
    const transferId = `TXN-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Get exchange rate and calculate amounts
    const quote = await ExchangeService.getTransferQuote(
      params.senderCurrency,
      params.recipientCurrency,
      params.senderAmount,
      1.5 // 1.5% fee
    );

    const explorerUrl = `${config.blockchain.explorerUrl}/tx/${params.txHash}`;

    // Create transfer record with WALLET payment method and txHash
    const transfer: Partial<Transfer> = {
      id: transferId,
      userId: params.userId,
      whatsappNumber: params.whatsappNumber,
      status: 'processing', // Start as processing since tx is already submitted
      paymentMethod: 'WALLET',
      senderCurrency: params.senderCurrency,
      senderAmount: params.senderAmount,
      senderTokenAddress: params.tokenInAddress,
      totalAmount: quote.totalAmount,
      recipientName: params.recipientName,
      recipientCurrency: params.recipientCurrency,
      recipientTokenAddress: params.tokenOutAddress,
      recipientExpectedAmount: quote.recipientAmount,
      recipientBank: params.recipientBank,
      recipientAccount: params.recipientAccount,
      exchangeRate: quote.exchangeRate,
      conversionPath: `${params.senderCurrency}->${params.recipientCurrency}`,
      feePercentage: 1.5,
      feeAmount: quote.feeAmount,
      network: config.blockchain.network,
      chainId: config.blockchain.chainId,
      txHash: params.txHash,
      blockchainTxUrl: explorerUrl
    };

    // Insert into database
    await query(
      `INSERT INTO transfers (
        id, user_id, whatsapp_number, status, payment_method,
        sender_currency, sender_amount, sender_token_address, total_amount,
        recipient_name, recipient_currency, recipient_token_address,
        recipient_expected_amount, recipient_bank, recipient_account,
        exchange_rate, conversion_path, fee_percentage, fee_amount,
        network, chain_id, tx_hash, blockchain_tx_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transfer.id,
        transfer.userId || null,
        transfer.whatsappNumber,
        transfer.status,
        transfer.paymentMethod,
        transfer.senderCurrency,
        transfer.senderAmount,
        transfer.senderTokenAddress || null,
        transfer.totalAmount,
        transfer.recipientName,
        transfer.recipientCurrency,
        transfer.recipientTokenAddress || null,
        transfer.recipientExpectedAmount,
        transfer.recipientBank,
        transfer.recipientAccount,
        transfer.exchangeRate,
        transfer.conversionPath,
        transfer.feePercentage,
        transfer.feeAmount,
        transfer.network,
        transfer.chainId,
        transfer.txHash,
        transfer.blockchainTxUrl
      ]
    );

    console.log(`✅ Wallet transfer ${transferId} created with tx: ${params.txHash}`);

    // Start monitoring the transaction in background
    this.monitorWalletTransaction(transferId, params.txHash).catch(error => {
      console.error(`❌ Error monitoring wallet transaction ${transferId}:`, error);
    });

    return transfer as Transfer;
  }

  /**
   * Monitor wallet transaction and update status when confirmed
   */
  private static async monitorWalletTransaction(transferId: string, txHash: string): Promise<void> {
    console.log(`🔍 Monitoring wallet transaction ${transferId}: ${txHash}`);

    try {
      const blockchainService = getBlockchainService();

      // Wait for transaction confirmation
      const receipt = await blockchainService.waitForTransaction(txHash, 1);

      if (receipt.status === 'success') {
        console.log(`✅ Wallet transaction ${transferId} confirmed in block ${receipt.blockNumber}`);

        // Update transfer status to completed
        await this.updateTransferStatus(transferId, 'completed');
        await query('UPDATE transfers SET completed_at = NOW(), block_number = ? WHERE id = ?',
          [receipt.blockNumber?.toString() || null, transferId]);
      } else {
        console.log(`❌ Wallet transaction ${transferId} failed`);
        await this.updateTransferStatus(transferId, 'failed');
      }
    } catch (error: any) {
      console.error(`❌ Error monitoring wallet transaction ${transferId}:`, error.message);
      // Don't mark as failed immediately - transaction might still be pending
    }
  }
}
