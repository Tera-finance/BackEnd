import { TransferRepository, Transfer } from '../repositories/transfer.repository.js';
import { CardanoActionsService } from './cardano-actions.service.js';
import { exchangeRateService } from './exchange-rate-api.service.js';
import { getMockToken } from '../config/currencies.config.js';

/**
 * Transfer Processor Service
 *
 * Orchestrates automated blockchain operations for cross-border transfers:
 * 1. Mint mockADA (universal hub token) from any source currency
 * 2. Swap mockADA to recipient's mock token (if available)
 * 3. Update transfer status with blockchain transaction hashes
 *
 * Design: mockADA acts as the hub token for all conversions
 * - All source currencies → mockADA → Recipient mock tokens
 * - Enables unified liquidity and simplified smart contract logic
 */
export class TransferProcessorService {
  private cardanoService: CardanoActionsService;

  constructor() {
    this.cardanoService = new CardanoActionsService();
  }

  /**
   * Main orchestration function - processes transfer through blockchain
   * Runs asynchronously in background after transfer is created
   *
   * OPTIMIZED: Directly mints recipient token, skipping intermediate mockADA swap
   */
  async processTransfer(transferId: string): Promise<void> {
    console.log(`\n🚀 Starting blockchain processing for transfer ${transferId}`);

    try {
      // Get transfer from database
      const transfer = await TransferRepository.findById(transferId);
      if (!transfer) {
        throw new Error(`Transfer ${transferId} not found`);
      }

      // Only process transfers that are pending or paid (waiting for blockchain processing)
      if (transfer.status !== 'pending' && transfer.status !== 'paid') {
        console.log(`⚠️  Transfer ${transferId} already processed (status: ${transfer.status})`);
        return;
      }

      // Check if recipient currency has a mock token
      const recipientMockToken = this.getRecipientMockToken(transfer.recipient_currency);

      if (recipientMockToken) {
        // OPTIMIZED PATH: Directly mint recipient token
        console.log(`🪙 Minting ${recipientMockToken} directly...`);

        // Calculate recipient token amount from source currency
        const recipientAmount = await this.calculateRecipientAmount(
          transfer.sender_amount,
          transfer.sender_currency,
          transfer.recipient_currency
        );

        console.log(`💰 Calculated ${recipientMockToken} amount: ${recipientAmount.toString()} (${Number(recipientAmount) / 1_000_000} ${recipientMockToken})`);

        // Mint recipient token directly
        const mintResult = await this.mintRecipientToken(transfer, recipientMockToken, recipientAmount);

        if (!mintResult.success) {
          throw new Error(`Failed to mint ${recipientMockToken}: ${mintResult.error}`);
        }

        console.log(`✅ Minted ${recipientMockToken}: ${mintResult.txHash}`);
        console.log(`🔗 ${mintResult.cardanoscanUrl}`);

        // Mark transfer as completed
        await TransferRepository.updateStatus(transferId, 'completed', {
          tx_hash: mintResult.txHash!,
          blockchain_tx_url: mintResult.cardanoscanUrl
        });

        console.log(`✅ Transfer ${transferId} completed (direct mint)`);

      } else {
        // No mock token - fallback to mockADA
        console.log(`ℹ️  No mock token for ${transfer.recipient_currency}, minting mockADA...`);

        const mockADAAmount = await this.calculateMockADAAmount(
          transfer.sender_amount,
          transfer.sender_currency
        );

        const mintResult = await this.mintMockADA(transfer, mockADAAmount);

        if (!mintResult.success) {
          throw new Error(`Failed to mint mockADA: ${mintResult.error}`);
        }

        console.log(`✅ Minted mockADA: ${mintResult.txHash}`);
        console.log(`🔗 ${mintResult.cardanoscanUrl}`);

        await TransferRepository.updateStatus(transferId, 'completed', {
          tx_hash: mintResult.txHash!,
          blockchain_tx_url: mintResult.cardanoscanUrl
        });

        console.log(`✅ Transfer ${transferId} completed (mockADA only)`);
      }

    } catch (error: any) {
      console.error(`❌ Transfer ${transferId} processing failed:`, error.message);

      // Mark transfer as failed
      try {
        await TransferRepository.updateStatus(transferId, 'failed');
      } catch (updateError) {
        console.error(`Failed to update transfer status:`, updateError);
      }
    }
  }

  /**
   * Step 1: Mint mockADA from source currency
   * mockADA acts as the universal hub token for all conversions
   */
  private async mintMockADA(
    transfer: Transfer,
    mockADAAmount: bigint
  ): Promise<{
    success: boolean;
    txHash?: string;
    cardanoscanUrl?: string;
    error?: string;
  }> {
    try {
      console.log(`\n🪙 Minting mockADA...`);
      console.log(`   Source: ${transfer.sender_amount} ${transfer.sender_currency}`);
      console.log(`   Amount: ${mockADAAmount.toString()} (${Number(mockADAAmount) / 1_000_000} mockADA)`);

      // Note: CardanoActionsService expects symbol 'ADA' to mint mockADA
      // The smart contract handles minting of mockADA tokens
      const result = await this.cardanoService.mintToken({
        symbol: 'ADA', // This will mint mockADA via the mock_ada_policy
        amount: mockADAAmount.toString(),
      });

      return result;
    } catch (error: any) {
      console.error(`Mint mockADA error:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to mint mockADA'
      };
    }
  }

  /**
   * Step 2: Swap mockADA to recipient's mock token
   * Burns mockADA and mints recipient token (e.g., mockIDRX, mockEUROC)
   */
  private async swapMockADAToRecipient(
    transfer: Transfer,
    mockADAAmount: bigint,
    recipientMockToken: string,
    mintTxHash: string
  ): Promise<{
    success: boolean;
    burnTxHash?: string;
    mintTxHash?: string;
    recipientAmount?: string;
    error?: string;
  }> {
    try {
      console.log(`\n🔄 Swapping mockADA to ${recipientMockToken}...`);

      // Get exchange rate: ADA → Recipient Currency
      const adaAmountDecimal = Number(mockADAAmount) / 1_000_000;
      const recipientAmount = await this.convertFromADA(
        adaAmountDecimal,
        transfer.recipient_currency
      );

      // Convert to token units (6 decimals)
      const recipientAmountBigInt = BigInt(Math.floor(recipientAmount * 1_000_000));

      console.log(`   Rate: 1 ADA = ${(recipientAmount / adaAmountDecimal).toFixed(2)} ${transfer.recipient_currency}`);
      console.log(`   Recipient gets: ${recipientAmountBigInt.toString()} (${recipientAmount.toFixed(2)} ${recipientMockToken})`);

      // Extract base symbol from mock token (e.g., mockIDRX → IDRX)
      const baseSymbol = recipientMockToken.replace('mock', '');

      const swapResult = await this.cardanoService.swapTokens({
        fromSymbol: 'ADA', // mockADA
        toSymbol: baseSymbol, // e.g., IDRX
        fromAmount: mockADAAmount.toString(),
        exchangeRate: recipientAmount / adaAmountDecimal,
        mintTxHash // Pass mint txHash to wait for confirmation
      });

      return {
        success: swapResult.success,
        burnTxHash: swapResult.burnTxHash,
        mintTxHash: swapResult.mintTxHash,
        recipientAmount: recipientAmountBigInt.toString(),
        error: swapResult.error
      };
    } catch (error: any) {
      console.error(`Swap error:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to swap tokens'
      };
    }
  }

  /**
   * Calculate mockADA amount from source currency
   * Converts any currency (USD, EUR, USDT, etc.) to ADA equivalent
   */
  private async calculateMockADAAmount(
    amount: number,
    sourceCurrency: string
  ): Promise<bigint> {
    try {
      // Get conversion rate: Source Currency → ADA
      const adaAmount = await exchangeRateService.convertToADA(amount, sourceCurrency);

      // Convert to token units with 6 decimals
      const mockADAWithDecimals = BigInt(Math.floor(adaAmount * 1_000_000));

      return mockADAWithDecimals;
    } catch (error: any) {
      console.error(`Failed to calculate mockADA amount:`, error.message);

      // Fallback: Assume 1 USD = 1.5 ADA (rough estimate)
      const fallbackRate = 1.5;
      const adaAmount = amount * fallbackRate;
      return BigInt(Math.floor(adaAmount * 1_000_000));
    }
  }

  /**
   * Convert ADA to target fiat currency
   */
  private async convertFromADA(
    adaAmount: number,
    targetCurrency: string
  ): Promise<number> {
    try {
      return await exchangeRateService.convertFromADA(adaAmount, targetCurrency);
    } catch (error: any) {
      console.error(`Failed to convert from ADA:`, error.message);

      // Fallback rates (rough estimates)
      const fallbackRates: Record<string, number> = {
        'USD': 0.67,
        'EUR': 0.62,
        'IDR': 10500,
        'JPY': 98,
        'CNY': 4.85,
        'MXN': 13.5,
      };

      const rate = fallbackRates[targetCurrency] || 1;
      return adaAmount * rate;
    }
  }

  /**
   * Get recipient mock token name if available
   * Returns null if currency doesn't have a mock token
   */
  private getRecipientMockToken(currencyCode: string): string | null {
    return getMockToken(currencyCode);
  }

  /**
   * Calculate recipient token amount directly from source currency
   * Skips intermediate mockADA conversion for faster processing
   */
  private async calculateRecipientAmount(
    sourceAmount: number,
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<bigint> {
    try {
      // Direct conversion: Source Currency → Target Currency
      const targetAmount = await exchangeRateService.convert(sourceAmount, sourceCurrency, targetCurrency);

      // Convert to token units with 6 decimals
      const tokenAmount = BigInt(Math.floor(targetAmount * 1_000_000));

      return tokenAmount;
    } catch (error: any) {
      console.error(`Failed to calculate recipient amount:`, error.message);

      // Fallback: Convert via ADA as intermediate
      const adaAmount = await exchangeRateService.convertToADA(sourceAmount, sourceCurrency);
      const targetAmount = await exchangeRateService.convertFromADA(adaAmount, targetCurrency);
      return BigInt(Math.floor(targetAmount * 1_000_000));
    }
  }

  /**
   * Mint recipient token directly (optimized path)
   * Replaces the old 3-step process: mint mockADA → burn mockADA → mint recipient
   */
  private async mintRecipientToken(
    transfer: Transfer,
    recipientMockToken: string,
    amount: bigint
  ): Promise<{
    success: boolean;
    txHash?: string;
    cardanoscanUrl?: string;
    error?: string;
  }> {
    try {
      console.log(`\n🪙 Minting ${recipientMockToken}...`);
      console.log(`   Source: ${transfer.sender_amount} ${transfer.sender_currency}`);
      console.log(`   Amount: ${amount.toString()} (${Number(amount) / 1_000_000} ${recipientMockToken})`);

      // Extract base symbol from mock token (e.g., mockIDRX → IDRX)
      const baseSymbol = recipientMockToken.replace('mock', '');

      const result = await this.cardanoService.mintToken({
        symbol: baseSymbol,
        amount: amount.toString(),
      });

      return result;
    } catch (error: any) {
      console.error(`Mint ${recipientMockToken} error:`, error.message);
      return {
        success: false,
        error: error.message || `Failed to mint ${recipientMockToken}`
      };
    }
  }
}

// Export singleton instance
export const transferProcessorService = new TransferProcessorService();
