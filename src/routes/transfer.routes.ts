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

    res.json({
      success: true,
      data: {
        transfers,
        count: transfers.length,
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

    // Generate PDF invoice (ensure all numbers are properly parsed)
    const invoiceBuffer = await InvoiceService.generateInvoice({
      transferId: transfer.id,
      date: transfer.createdAt,
      senderAmount: typeof transfer.senderAmount === 'string' ? parseFloat(transfer.senderAmount) : transfer.senderAmount,
      senderCurrency: transfer.senderCurrency,
      recipientAmount: typeof transfer.recipientExpectedAmount === 'string' ? parseFloat(transfer.recipientExpectedAmount) : transfer.recipientExpectedAmount,
      recipientCurrency: transfer.recipientCurrency,
      recipientName: transfer.recipientName,
      recipientBank: transfer.recipientBank,
      recipientAccount: transfer.recipientAccount,
      exchangeRate: typeof transfer.exchangeRate === 'string' ? parseFloat(transfer.exchangeRate) : transfer.exchangeRate,
      feeAmount: typeof transfer.feeAmount === 'string' ? parseFloat(transfer.feeAmount) : transfer.feeAmount,
      feePercentage: typeof transfer.feePercentage === 'string' ? parseFloat(transfer.feePercentage) : transfer.feePercentage,
      totalAmount: typeof transfer.totalAmount === 'string' ? parseFloat(transfer.totalAmount) : transfer.totalAmount,
      status: transfer.status,
      txHash: transfer.txHash || undefined,
      blockchainTxUrl: transfer.blockchainTxUrl || undefined,
      whatsappNumber: transfer.whatsappNumber
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
