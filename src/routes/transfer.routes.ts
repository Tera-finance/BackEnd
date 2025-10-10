import { Router } from 'express';
import { exchangeRateService } from '../services/exchange-rate-api.service';
import {
  hasMockToken,
  getMockToken,
  getPolicyId,
} from '../config/currencies.config';
import { TransferRepository } from '../repositories/transfer.repository';
import { authenticate, AuthRequest } from '../middleware/auth';
import { transferProcessorService } from '../services/transfer-processor.service';

const router = Router();

/**
 * POST /api/transfer/initiate
 * Initiate a new transfer from WhatsApp bot or website
 * Body: Complete transfer details
 */
router.post('/initiate', async (req, res) => {
  try {
    const {
      paymentMethod,
      senderCurrency,
      senderAmount,
      recipientName,
      recipientCurrency,
      recipientBank,
      recipientAccount,
      cardDetails, // Only for MASTERCARD
    } = req.body;

    // Validation
    if (!paymentMethod || !senderCurrency || !senderAmount || 
        !recipientName || !recipientCurrency || !recipientBank || !recipientAccount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    if (paymentMethod === 'MASTERCARD' && !cardDetails) {
      return res.status(400).json({
        success: false,
        error: 'Card details required for Mastercard payments',
      });
    }

    // Get conversion details
    const conversionDetails = await exchangeRateService.getConversionDetails(
      parseFloat(senderAmount),
      senderCurrency,
      recipientCurrency
    );

    // Calculate fees
    const feePercentage = paymentMethod === 'MASTERCARD' ? 1.5 : 1.0;
    const feeAmount = (parseFloat(senderAmount) * feePercentage) / 100;
    const totalAmount = parseFloat(senderAmount) + feeAmount;

    // Determine conversion path
    const mockToken = getMockToken(recipientCurrency);
    const usesMockToken = hasMockToken(recipientCurrency);
    const policyId = mockToken ? getPolicyId(mockToken) : null;

    // Create transfer record (save to database)
    const transferId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get user info from auth header if available
    let userId = null;
    let whatsappNumber = req.body.whatsappNumber || 'unknown';

    // Extract user from auth token if authenticated
    const authReq = req as any;
    if (authReq.user) {
      userId = authReq.user.id;
      whatsappNumber = authReq.user.whatsapp_number || whatsappNumber;
    }

    // Generate payment link for WALLET method
    const paymentLink = paymentMethod === 'WALLET'
      ? `https://payment.trustbridge.io/${transferId}`
      : undefined;

    // Save transfer to database
    const transfer = await TransferRepository.create({
      id: transferId,
      user_id: userId,
      whatsapp_number: whatsappNumber,
      payment_method: paymentMethod,
      sender_currency: senderCurrency,
      sender_amount: parseFloat(senderAmount),
      total_amount: totalAmount,
      recipient_name: recipientName,
      recipient_currency: recipientCurrency,
      recipient_expected_amount: conversionDetails.finalAmount,
      recipient_bank: recipientBank,
      recipient_account: recipientAccount,
      ada_amount: conversionDetails.adaAmount,
      exchange_rate: conversionDetails.exchangeRate,
      conversion_path: JSON.stringify(conversionDetails.path),
      fee_percentage: feePercentage,
      fee_amount: feeAmount,
      uses_mock_token: usesMockToken,
      mock_token: mockToken || undefined,
      policy_id: policyId || undefined,
      card_number: cardDetails?.number || undefined,
      payment_link: paymentLink || undefined
    });

    // Build response data
    const transferData = {
      id: transfer.id,
      status: transfer.status,
      paymentMethod: transfer.payment_method,
      sender: {
        currency: transfer.sender_currency,
        amount: transfer.sender_amount,
        totalAmount: transfer.total_amount,
      },
      recipient: {
        name: transfer.recipient_name,
        currency: transfer.recipient_currency,
        expectedAmount: transfer.recipient_expected_amount,
        bank: transfer.recipient_bank,
        account: transfer.recipient_account,
      },
      conversion: {
        adaAmount: transfer.ada_amount,
        exchangeRate: transfer.exchange_rate,
        path: JSON.parse(transfer.conversion_path || '[]'),
      },
      fees: {
        percentage: transfer.fee_percentage,
        amount: transfer.fee_amount,
      },
      blockchain: {
        usesMockToken: transfer.uses_mock_token,
        mockToken: transfer.mock_token,
        policyId: transfer.policy_id,
        txHash: transfer.tx_hash,
      },
      paymentLink: transfer.payment_link,
      createdAt: transfer.created_at,
    };

    res.json({
      success: true,
      data: transferData,
      message: 'Transfer initiated successfully. Blockchain processing started.',
    });

    // Trigger blockchain processing in background (non-blocking)
    // This will:
    // 1. Mint mockADA (hub token) from source currency
    // 2. Swap mockADA to recipient mock token (if available)
    // 3. Update transfer status with transaction hashes
    setImmediate(async () => {
      try {
        console.log(`\n🔗 Triggering blockchain processing for ${transfer.id}...`);
        await transferProcessorService.processTransfer(transfer.id);
      } catch (error: any) {
        console.error(`Background processing error for ${transfer.id}:`, error.message);
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/transfer/confirm
 * Confirm payment and process blockchain transaction
 * Body: { transferId, paymentProof }
 */
router.post('/confirm', async (req, res) => {
  try {
    const { transferId, paymentProof } = req.body;

    if (!transferId) {
      return res.status(400).json({
        success: false,
        error: 'Transfer ID required',
      });
    }

    // TODO: Retrieve transfer from database
    // const transfer = await transferRepository.findById(transferId);

    // For now, return mock response
    res.json({
      success: true,
      data: {
        transferId,
        status: 'processing',
        message: 'Payment confirmed. Processing blockchain transaction...',
        estimatedTime: '2-5 minutes',
      },
    });

    // TODO: Process blockchain transaction in background
    // 1. Mint mockADA
    // 2. Swap to recipient mock token if available
    // 3. Initiate bank transfer
    // 4. Update transfer status

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transfer/status/:transferId
 * Get transfer status
 */
router.get('/status/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params;

    // Retrieve from database
    const transfer = await TransferRepository.findById(transferId);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found',
      });
    }

    res.json({
      success: true,
      data: {
        transferId: transfer.id,
        status: transfer.status,
        blockchainTx: transfer.blockchain_tx_url || transfer.tx_hash,
        completedAt: transfer.completed_at,
        createdAt: transfer.created_at,
        paidAt: transfer.paid_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/transfer/:transferId/status
 * Update transfer status (for blockchain processing)
 */
router.post('/:transferId/status', async (req, res) => {
  try {
    const { transferId } = req.params;
    const { status, tx_hash, blockchain_tx_url } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'paid', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const transfer = await TransferRepository.updateStatus(
      transferId,
      status,
      { tx_hash, blockchain_tx_url }
    );

    res.json({
      success: true,
      data: {
        transferId: transfer.id,
        status: transfer.status,
        blockchainTx: transfer.blockchain_tx_url || transfer.tx_hash,
        updatedAt: transfer.updated_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transfer/details/:transferId
 * Get complete transfer details including blockchain info
 */
router.get('/details/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params;

    // Retrieve from database
    const transfer = await TransferRepository.findById(transferId);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found',
      });
    }

    // Build detailed response from database record
    const conversionPath = transfer.conversion_path ? JSON.parse(transfer.conversion_path) : [];

    const transferDetails = {
      transferId: transfer.id,
      status: transfer.status,
      paymentMethod: transfer.payment_method,
      sender: {
        currency: transfer.sender_currency,
        amount: transfer.sender_amount,
        totalCharged: transfer.total_amount,
      },
      recipient: {
        name: transfer.recipient_name,
        currency: transfer.recipient_currency,
        amount: transfer.recipient_expected_amount,
        bank: transfer.recipient_bank,
        account: transfer.recipient_account,
      },
      blockchain: {
        path: conversionPath,
        mockADAAmount: transfer.ada_amount,
        hubToken: transfer.mock_token,
        recipientToken: transfer.mock_token,
        policyId: transfer.policy_id,
        txHash: transfer.tx_hash,
        cardanoScanUrl: transfer.blockchain_tx_url,
      },
      fees: {
        percentage: transfer.fee_percentage,
        amount: transfer.fee_amount,
      },
      timeline: [
        {
          status: 'INITIATED',
          timestamp: transfer.created_at,
        },
        ...(transfer.paid_at ? [{
          status: 'PAYMENT_CONFIRMED',
          timestamp: transfer.paid_at,
        }] : []),
        ...(transfer.completed_at ? [{
          status: 'COMPLETED',
          timestamp: transfer.completed_at,
        }] : []),
      ],
      createdAt: transfer.created_at,
      completedAt: transfer.completed_at,
    };

    res.json({
      success: true,
      data: transferDetails,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transfer/history
 * Get user transfer history with blockchain details
 * Query: userId, whatsappNumber, limit, offset, status, paymentMethod
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, whatsappNumber, limit = 20, offset = 0, status, paymentMethod } = req.query;

    let transfers: any[] = [];

    // Retrieve from database
    if (userId) {
      transfers = await TransferRepository.findByUserId(
        userId as string,
        parseInt(limit as string)
      );
    } else if (whatsappNumber) {
      transfers = await TransferRepository.findByWhatsAppNumber(
        whatsappNumber as string,
        parseInt(limit as string)
      );
    } else {
      // Get recent transfers (for admin view)
      transfers = await TransferRepository.getRecent(parseInt(limit as string));
    }

    // Apply filters
    if (status) {
      transfers = transfers.filter(t => t.status === status);
    }

    if (paymentMethod) {
      transfers = transfers.filter(t => t.payment_method === paymentMethod);
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedTransfers = transfers.slice(startIndex, endIndex);

    // Format response
    const formattedTransfers = paginatedTransfers.map(transfer => {
      const conversionPath = transfer.conversion_path ? JSON.parse(transfer.conversion_path) : [];
      return {
        transferId: transfer.id,
        status: transfer.status,
        paymentMethod: transfer.payment_method,
        sender: {
          currency: transfer.sender_currency,
          amount: transfer.sender_amount,
        },
        recipient: {
          name: transfer.recipient_name,
          currency: transfer.recipient_currency,
          amount: transfer.recipient_expected_amount,
          bank: transfer.recipient_bank,
          account: `****${transfer.recipient_account.slice(-4)}`,
        },
        blockchain: {
          path: conversionPath,
          mockADAAmount: transfer.ada_amount,
          hubToken: transfer.mock_token,
          recipientToken: transfer.mock_token,
          txHash: transfer.tx_hash,
          cardanoScanUrl: transfer.blockchain_tx_url,
          policyId: transfer.policy_id,
        },
        fees: {
          percentage: transfer.fee_percentage,
          amount: transfer.fee_amount,
        },
        createdAt: transfer.created_at,
        completedAt: transfer.completed_at,
      };
    });

    res.json({
      success: true,
      data: {
        transfers: formattedTransfers,
        total: transfers.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: endIndex < transfers.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/transfer/calculate
 * Calculate transfer amounts without initiating
 * For WhatsApp bot preview
 */
router.post('/calculate', async (req, res) => {
  try {
    const { senderCurrency, recipientCurrency, amount, paymentMethod } = req.body;

    if (!senderCurrency || !recipientCurrency || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const details = await exchangeRateService.getConversionDetails(
      parseFloat(amount),
      senderCurrency,
      recipientCurrency
    );

    const feePercentage = paymentMethod === 'MASTERCARD' ? 1.5 : 1.0;
    const feeAmount = (parseFloat(amount) * feePercentage) / 100;
    const totalAmount = parseFloat(amount) + feeAmount;

    res.json({
      success: true,
      data: {
        senderAmount: parseFloat(amount),
        senderCurrency,
        recipientAmount: details.finalAmount,
        recipientCurrency,
        exchangeRate: details.exchangeRate,
        adaAmount: details.adaAmount,
        fee: {
          percentage: feePercentage,
          amount: feeAmount,
        },
        totalAmount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
