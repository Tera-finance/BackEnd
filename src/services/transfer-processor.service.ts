import { TransferRepository, Transfer } from '../repositories/transfer.repository';
import { CardanoActionsService } from './cardano-actions.service';
import { exchangeRateService } from './exchange-rate-api.service';
import { getMockToken } from '../config/currencies.config';

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
   */
  async processTransfer(transferId: string): Promise<void> {
    console.log(`\n🚀 Starting blockchain processing for transfer ${transferId}`);

    try {
      // Get transfer from database
      const transfer = await TransferRepository.findById(transferId);
      if (!transfer) {
        throw new Error(`Transfer ${transferId} not found`);
      }

      if (transfer.status !== 'pending') {
        console.log(`⚠️  Transfer ${transferId} already processed (status: ${transfer.status})`);
        return;
      }

      // Step 1: Calculate mockADA amount from source currency
      const mockADAAmount = await this.calculateMockADAAmount(
        transfer.sender_amount,
        transfer.sender_currency
      );

      console.log(`💰 Calculated mockADA amount: ${mockADAAmount.toString()} (${Number(mockADAAmount) / 1_000_000} ADA)`);

      // Step 2: Mint mockADA (hub token)
      const mintResult = await this.mintMockADA(transfer, mockADAAmount);

      if (!mintResult.success) {
        throw new Error(`Failed to mint mockADA: ${mintResult.error}`);
      }

      console.log(`✅ Minted mockADA: ${mintResult.txHash}`);
      console.log(`🔗 ${mintResult.cardanoscanUrl}`);

      // Update transfer with mint info
      await TransferRepository.updateStatus(transferId, 'processing', {
        tx_hash: mintResult.txHash!,
        blockchain_tx_url: mintResult.cardanoscanUrl
      });

      // Update ada_amount in database (need to add this to repository if not exists)
      // For now, it's set during creation based on conversion details

      // Step 3: Check if recipient currency has a mock token
      const recipientMockToken = this.getRecipientMockToken(transfer.recipient_currency);

      if (recipientMockToken) {
        console.log(`🔄 Swapping mockADA to ${recipientMockToken}...`);

        // Swap mockADA → recipient mock token
        const swapResult = await this.swapMockADAToRecipient(
          transfer,
          mockADAAmount,
          recipientMockToken
        );

        if (swapResult && swapResult.success) {
          console.log(`✅ Swap successful!`);
          console.log(`   Burn TX: ${swapResult.burnTxHash}`);
          console.log(`   Mint TX: ${swapResult.mintTxHash}`);

          // Update with swap transaction
          await TransferRepository.updateStatus(transferId, 'completed', {
            tx_hash: swapResult.mintTxHash, // Use mint tx as primary
            blockchain_tx_url: `https://preprod.cardanoscan.io/transaction/${swapResult.mintTxHash}`
          });

          console.log(`✅ Transfer ${transferId} completed with swap`);
        } else {
          // Swap failed, but mint succeeded - mark as processing
          console.error(`❌ Swap failed: ${swapResult?.error}`);
          console.log(`ℹ️  Transfer ${transferId} remains in 'processing' state`);
          // Admin can retry swap manually
          return;
        }
      } else {
        // No mock token for recipient currency - mark complete after mint
        console.log(`ℹ️  No mock token for ${transfer.recipient_currency}, completing after mockADA mint`);

        await TransferRepository.updateStatus(transferId, 'completed');
        console.log(`✅ Transfer ${transferId} completed (mint only)`);
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
    recipientMockToken: string
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
        exchangeRate: recipientAmount / adaAmountDecimal
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
}

// Export singleton instance
export const transferProcessorService = new TransferProcessorService();
