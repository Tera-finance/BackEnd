import { Router } from 'express';
import { exchangeRateService } from '../services/exchange-rate-api.service';
import { 
  hasMockToken, 
  getMockToken,
  getPolicyId,
} from '../config/currencies.config';

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

    const transferData = {
      id: transferId,
      status: 'pending',
      paymentMethod,
      sender: {
        currency: senderCurrency,
        amount: parseFloat(senderAmount),
        totalAmount,
      },
      recipient: {
        name: recipientName,
        currency: recipientCurrency,
        expectedAmount: conversionDetails.finalAmount,
        bank: recipientBank,
        account: recipientAccount,
      },
      conversion: {
        adaAmount: conversionDetails.adaAmount,
        exchangeRate: conversionDetails.exchangeRate,
        path: conversionDetails.path,
      },
      fees: {
        percentage: feePercentage,
        amount: feeAmount,
      },
      blockchain: {
        usesMockToken,
        mockToken,
        policyId,
        txHash: null, // Will be updated after blockchain transaction
      },
      createdAt: new Date().toISOString(),
    };

    // TODO: Save to database
    // await transferRepository.create(transferData);

    res.json({
      success: true,
      data: transferData,
      message: 'Transfer initiated successfully. Awaiting payment confirmation.',
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

    // TODO: Retrieve from database
    // const transfer = await transferRepository.findById(transferId);

    // Mock response
    res.json({
      success: true,
      data: {
        transferId,
        status: 'completed',
        blockchainTx: 'https://preprod.cardanoscan.io/transaction/abc123',
        completedAt: new Date().toISOString(),
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

    // TODO: Retrieve from database
    // const transfer = await transferRepository.findById(transferId);

    // Mock detailed response
    const transferDetails = {
      transferId,
      status: 'completed',
      paymentMethod: 'MASTERCARD',
      sender: {
        currency: 'USD',
        amount: 100,
        symbol: '$',
        totalCharged: 101.5,
      },
      recipient: {
        name: 'John Doe',
        currency: 'IDR',
        amount: 1562960,
        symbol: 'Rp',
        bank: 'Bank BNI',
        account: '1234567890',
      },
      blockchain: {
        path: ['USD', 'mockADA', 'mockIDRX', 'IDR'],
        mockADAAmount: 149.25,
        hubToken: 'mockADA',
        recipientToken: 'mockIDRX',
        policyIds: {
          mockADA: '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93',
          mockIDRX: '5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9',
        },
        transactions: [
          {
            step: 1,
            action: 'Mint mockADA',
            amount: '149.25 mockADA',
            txHash: '8c6af18b5d96d8de5cd5acb6e3e3b90ddea5eb90d9d69f4084e1ee85ec12acf0',
            cardanoScanUrl: 'https://preprod.cardanoscan.io/transaction/8c6af18b5d96d8de5cd5acb6e3e3b90ddea5eb90d9d69f4084e1ee85ec12acf0',
            timestamp: '2025-10-09T07:45:30.000Z',
          },
          {
            step: 2,
            action: 'Swap mockADA to mockIDRX',
            from: '149.25 mockADA',
            to: '1,562,960 mockIDRX',
            txHash: 'c6e9e0d32f73f7eb6cc26dd1e0b73e58da2a6d8c2ebfb7a11285b2db7b31e5ff',
            cardanoScanUrl: 'https://preprod.cardanoscan.io/transaction/c6e9e0d32f73f7eb6cc26dd1e0b73e58da2a6d8c2ebfb7a11285b2db7b31e5ff',
            timestamp: '2025-10-09T07:46:00.000Z',
          },
        ],
      },
      fees: {
        percentage: 1.5,
        amount: 1.5,
      },
      timeline: [
        {
          status: 'INITIATED',
          timestamp: '2025-10-09T07:45:00.000Z',
        },
        {
          status: 'PAYMENT_CONFIRMED',
          timestamp: '2025-10-09T07:45:30.000Z',
        },
        {
          status: 'MINTED_MOCKADA',
          timestamp: '2025-10-09T07:45:35.000Z',
        },
        {
          status: 'SWAPPED_TO_RECIPIENT_TOKEN',
          timestamp: '2025-10-09T07:46:00.000Z',
        },
        {
          status: 'BANK_PAYOUT_INITIATED',
          timestamp: '2025-10-09T07:46:30.000Z',
        },
        {
          status: 'COMPLETED',
          timestamp: '2025-10-09T07:50:00.000Z',
        },
      ],
      createdAt: '2025-10-09T07:45:00.000Z',
      completedAt: '2025-10-09T07:50:00.000Z',
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
 * Query: userId, limit, offset, status, paymentMethod
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 10, offset = 0, status, paymentMethod } = req.query;

    // TODO: Retrieve from database with filters
    // const transfers = await transferRepository.findByUserId(userId, { limit, offset, status, paymentMethod });

    // Mock response with sample data
    const mockTransfers = [
      {
        transferId: 'TXN-20251009-ABC123',
        status: 'completed',
        paymentMethod: 'MASTERCARD',
        sender: {
          currency: 'USD',
          amount: 100,
          symbol: '$',
        },
        recipient: {
          name: 'John Doe',
          currency: 'IDR',
          amount: 1562960,
          symbol: 'Rp',
          bank: 'Bank BNI',
          account: '****7890',
        },
        blockchain: {
          path: ['USD', 'mockADA', 'mockIDRX', 'IDR'],
          mockADAAmount: 149.25,
          hubToken: 'mockADA',
          recipientToken: 'mockIDRX',
          txHash: '8c6af18b5d96d8de5cd5acb6e3e3b90ddea5eb90d9d69f4084e1ee85ec12acf0',
          cardanoScanUrl: 'https://preprod.cardanoscan.io/transaction/8c6af18b5d96d8de5cd5acb6e3e3b90ddea5eb90d9d69f4084e1ee85ec12acf0',
          policyIds: {
            mockADA: '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93',
            mockIDRX: '5c9a67cc3c085c4ad001492d1e460f5aea9cc2b8847c23e1683c26d9',
          },
        },
        fees: {
          percentage: 1.5,
          amount: 1.5,
        },
        createdAt: '2025-10-08T10:30:00.000Z',
        completedAt: '2025-10-08T10:35:00.000Z',
      },
      {
        transferId: 'TXN-20251008-XYZ789',
        status: 'completed',
        paymentMethod: 'WALLET',
        sender: {
          currency: 'USDT',
          amount: 200,
          symbol: '₮',
        },
        recipient: {
          name: 'Jane Smith',
          currency: 'PHP',
          amount: 11236,
          symbol: '₱',
          bank: 'BDO',
          account: '****3210',
        },
        blockchain: {
          path: ['USDT', 'mockADA', 'PHP'],
          mockADAAmount: 298.50,
          hubToken: 'mockADA',
          recipientToken: null,
          txHash: 'e77edefe96e30e1c48d2f77d6caef5dda57dd9b5be0bbc2d7c2a6926e0a7e0bb',
          cardanoScanUrl: 'https://preprod.cardanoscan.io/transaction/e77edefe96e30e1c48d2f77d6caef5dda57dd9b5be0bbc2d7c2a6926e0a7e0bb',
          policyIds: {
            mockADA: '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93',
          },
        },
        fees: {
          percentage: 1.0,
          amount: 2.0,
        },
        createdAt: '2025-10-08T08:15:00.000Z',
        completedAt: '2025-10-08T08:20:00.000Z',
      },
      {
        transferId: 'TXN-20251007-DEF456',
        status: 'processing',
        paymentMethod: 'MASTERCARD',
        sender: {
          currency: 'EUR',
          amount: 150,
          symbol: '€',
        },
        recipient: {
          name: 'Alice Johnson',
          currency: 'JPY',
          amount: 24217,
          symbol: '¥',
          bank: 'MUFG Bank',
          account: '****5678',
        },
        blockchain: {
          path: ['EUR', 'mockADA', 'mockJPYC', 'JPY'],
          mockADAAmount: 243.28,
          hubToken: 'mockADA',
          recipientToken: 'mockJPYC',
          txHash: null,
          cardanoScanUrl: null,
          policyIds: {
            mockADA: '1c05bdd719318cef47811522e134bfeba87fce3f73b4892c62561c93',
            mockJPYC: '7725300e8d414e0fccad0a562e3a9c585970e84e7e92d422111e1e29',
          },
        },
        fees: {
          percentage: 1.5,
          amount: 2.25,
        },
        createdAt: '2025-10-07T14:45:00.000Z',
        completedAt: null,
      },
    ];

    // Apply filters
    let filteredTransfers = mockTransfers;
    if (status) {
      filteredTransfers = filteredTransfers.filter(t => t.status === status);
    }
    if (paymentMethod) {
      filteredTransfers = filteredTransfers.filter(t => t.paymentMethod === paymentMethod);
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        transfers: paginatedTransfers,
        total: filteredTransfers.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: endIndex < filteredTransfers.length,
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
