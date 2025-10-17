import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { TransferService } from '../services/transfer.service.js';
import { InvoiceService } from '../services/invoice.service.js';

const router = Router();

/**
 * POST /api/transfer/initiate
 * Initiate a new transfer
 */
router.post('/initiate', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      whatsappNumber,
      paymentMethod,
      senderCurrency,
      senderAmount,
      recipientName,
      recipientCurrency,
      recipientBank,
      recipientAccount,
      recipientWalletAddress,
      cardDetails
    } = req.body;

    // Validation
    if (!whatsappNumber || !paymentMethod || !senderCurrency || !senderAmount ||
        !recipientName || !recipientCurrency || !recipientBank || !recipientAccount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (!['WALLET', 'MASTERCARD'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Payment method must be WALLET or MASTERCARD'
      });
    }

    // Initiate transfer
    const transfer = await TransferService.initiateTransfer({
      userId: req.user?.id,
      whatsappNumber,
      paymentMethod,
      senderCurrency,
      senderAmount: parseFloat(senderAmount),
      recipientName,
      recipientCurrency,
      recipientBank,
      recipientAccount,
      recipientWalletAddress,
      cardDetails
    });

    res.json({
      success: true,
      message: 'Transfer initiated successfully',
      data: {
        transferId: transfer.id,
        status: transfer.status,
        senderAmount: transfer.senderAmount,
        senderCurrency: transfer.senderCurrency,
        recipientAmount: transfer.recipientExpectedAmount,
        recipientCurrency: transfer.recipientCurrency,
        exchangeRate: transfer.exchangeRate,
        fee: transfer.feeAmount,
        total: transfer.totalAmount,
        createdAt: transfer.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error initiating transfer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate transfer'
    });
  }
});

/**
 * GET /api/transfer/status/:transferId
 * Get transfer status
 */
router.get('/status/:transferId', authenticate, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    const status = await TransferService.getTransferStatus(transferId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Error getting transfer status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transfer status'
    });
  }
});

/**
 * GET /api/transfer/history
 * Get transfer history for authenticated user
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    console.log('📋 Fetching transfer history for user:', {
      userId: req.user.id,
      whatsappNumber: req.user.whatsappNumber
    });

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Always use whatsappNumber since it's more reliable
    console.log(`📞 Using whatsappNumber: ${req.user.whatsappNumber}, limit: ${limit}, offset: ${offset}`);
    const transfers = await TransferService.getTransferHistoryByWhatsApp(
      req.user.whatsappNumber,
      limit,
      offset
    );

    console.log(`✅ Found ${transfers.length} transfers`);

    // Transform snake_case database fields to camelCase for frontend
    const transformedTransfers = transfers.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      whatsappNumber: t.whatsapp_number,
      status: t.status,
      paymentMethod: t.payment_method,
      senderCurrency: t.sender_currency,
      senderAmount: t.sender_amount,
      recipientName: t.recipient_name,
      recipientCurrency: t.recipient_currency,
      recipientExpectedAmount: t.recipient_expected_amount,
      recipientBank: t.recipient_bank,
      recipientAccount: t.recipient_account,
      exchangeRate: t.exchange_rate,
      feePercentage: t.fee_percentage,
      feeAmount: t.fee_amount,
      totalAmount: t.total_amount,
      txHash: t.tx_hash,
      blockchainTxUrl: t.blockchain_tx_url,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      completedAt: t.completed_at
    }));

    res.json({
      success: true,
      data: {
        transfers: transformedTransfers,
        count: transformedTransfers.length,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('❌ Error getting transfer history:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transfer history'
    });
  }
});

/**
 * GET /api/transfer/pending
 * Get pending transfers for authenticated user
 */
router.get('/pending', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Use whatsappNumber to get pending transfers if no userId
    const transfers = req.user.id
      ? await TransferService.getPendingTransfers(req.user.id)
      : await TransferService.getPendingTransfersByWhatsApp(req.user.whatsappNumber);

    res.json({
      success: true,
      data: {
        transfers,
        count: transfers.length
      }
    });
  } catch (error: any) {
    console.error('Error getting pending transfers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending transfers'
    });
  }
});

/**
 * GET /api/transfer/invoice/:transferId
 * Download PDF invoice for a transfer
 */
router.get('/invoice/:transferId', authenticate, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    const transfer = await TransferService.getTransferById(transferId);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    // Only generate invoice for completed or processing transfers
    if (!['completed', 'processing', 'paid'].includes(transfer.status)) {
      return res.status(400).json({
        success: false,
        error: 'Invoice can only be generated for completed or processing transfers'
      });
    }

    // Database returns snake_case fields, need to map to camelCase
    const dbTransfer = transfer as any;

    // Generate PDF invoice (ensure all numbers are properly parsed from string DECIMAL values)
    const invoiceBuffer = await InvoiceService.generateInvoice({
      transferId: dbTransfer.id,
      date: dbTransfer.created_at,
      senderAmount: dbTransfer.sender_amount,
      senderCurrency: dbTransfer.sender_currency,
      recipientAmount: dbTransfer.recipient_expected_amount,
      recipientCurrency: dbTransfer.recipient_currency,
      recipientName: dbTransfer.recipient_name,
      recipientBank: dbTransfer.recipient_bank,
      recipientAccount: dbTransfer.recipient_account,
      exchangeRate: dbTransfer.exchange_rate,
      feeAmount: dbTransfer.fee_amount,
      feePercentage: dbTransfer.fee_percentage,
      totalAmount: dbTransfer.total_amount,
      status: dbTransfer.status,
      txHash: dbTransfer.tx_hash || undefined,
      blockchainTxUrl: dbTransfer.blockchain_tx_url || undefined,
      whatsappNumber: dbTransfer.whatsapp_number
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="TrustBridge-Invoice-${transferId}.pdf"`);
    res.setHeader('Content-Length', invoiceBuffer.length);

    // Send PDF buffer
    res.send(invoiceBuffer);
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice'
    });
  }
});

/**
 * GET /api/transfer/:transferId
 * Get transfer details by ID
 */
router.get('/:transferId', authenticate, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    const transfer = await TransferService.getTransferById(transferId);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error: any) {
    console.error('Error getting transfer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transfer'
    });
  }
});

export default router;
