import { Router, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { ExchangeService } from '../services/exchange.service';
import { WalletService } from '../services/wallet.service';
import { authenticate, AuthRequest, requireKYC } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();
const transactionService = new TransactionService();
const exchangeService = new ExchangeService();
const walletService = new WalletService();

router.post('/create', 
  authenticate, 
  requireKYC, 
  apiRateLimit, 
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const {
        recipientPhone,
        sourceCurrency,
        targetCurrency,
        sourceAmount,
        recipientBankAccount
      } = req.body;

      if (!recipientPhone || !sourceCurrency || !targetCurrency || !sourceAmount) {
        return res.status(400).json({ 
          error: 'All transaction fields are required' 
        });
      }

      if (sourceAmount <= 0) {
        return res.status(400).json({ 
          error: 'Source amount must be greater than 0' 
        });
      }

      const transaction = await transactionService.createTransaction(
        req.user.id,
        recipientPhone,
        sourceCurrency,
        targetCurrency,
        sourceAmount,
        recipientBankAccount
      );

      res.json({
        message: 'Transaction created successfully',
        transaction: {
          id: transaction.id,
          recipientPhone: transaction.recipientPhone,
          sourceAmount: transaction.sourceAmount,
          targetAmount: transaction.targetAmount,
          exchangeRate: transaction.exchangeRate,
          feeAmount: transaction.feeAmount,
          totalAmount: transaction.totalAmount,
          status: transaction.status,
          createdAt: transaction.createdAt
        }
      });
    } catch (error: any) {
      console.error('Create transaction error:', error);
      res.status(400).json({ error: error.message || 'Transaction creation failed' });
    }
  }
);

router.post('/process/:transactionId', 
  authenticate, 
  requireKYC, 
  async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId } = req.params;

      const transaction = await transactionService.processTransaction(transactionId);

      res.json({
        message: 'Transaction processing started',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          blockchainTxHash: transaction.blockchainTxHash
        }
      });
    } catch (error: any) {
      console.error('Process transaction error:', error);
      res.status(400).json({ error: error.message || 'Transaction processing failed' });
    }
  }
);

router.get('/quote', 
  authenticate, 
  apiRateLimit, 
  async (req: AuthRequest, res: Response) => {
    try {
      const { 
        sourceCurrency, 
        targetCurrency, 
        sourceAmount 
      } = req.query;

      if (!sourceCurrency || !targetCurrency || !sourceAmount) {
        return res.status(400).json({ 
          error: 'Source currency, target currency, and amount are required' 
        });
      }

      const amount = parseFloat(sourceAmount as string);
      if (amount <= 0) {
        return res.status(400).json({ 
          error: 'Amount must be greater than 0' 
        });
      }

      const quote = await exchangeService.calculateTransferAmount(
        amount,
        sourceCurrency as string,
        targetCurrency as string
      );

      res.json({
        quote: {
          sourceAmount: quote.sourceAmount,
          targetAmount: quote.targetAmount,
          exchangeRate: quote.exchangeRate,
          feeAmount: quote.feeAmount,
          totalAmount: quote.totalAmount,
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      console.error('Get quote error:', error);
      res.status(400).json({ error: error.message || 'Failed to get quote' });
    }
  }
);

router.get('/history', 
  authenticate, 
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await transactionService.getUserTransactions(
        req.user.id,
        limit,
        offset
      );

      res.json({
        transactions: transactions.map(tx => ({
          id: tx.id,
          recipientPhone: tx.recipientPhone,
          sourceCurrency: tx.sourceCurrency,
          targetCurrency: tx.targetCurrency,
          sourceAmount: tx.sourceAmount,
          targetAmount: tx.targetAmount,
          exchangeRate: tx.exchangeRate,
          feeAmount: tx.feeAmount,
          totalAmount: tx.totalAmount,
          status: tx.status,
          blockchainTxHash: tx.blockchainTxHash,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt
        })),
        pagination: {
          limit,
          offset,
          total: transactions.length
        }
      });
    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/:transactionId', 
  authenticate, 
  async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId } = req.params;

      const transaction = await transactionService.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.senderId !== req.user?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        transaction: {
          id: transaction.id,
          recipientPhone: transaction.recipientPhone,
          sourceCurrency: transaction.sourceCurrency,
          targetCurrency: transaction.targetCurrency,
          sourceAmount: transaction.sourceAmount,
          targetAmount: transaction.targetAmount,
          exchangeRate: transaction.exchangeRate,
          feeAmount: transaction.feeAmount,
          totalAmount: transaction.totalAmount,
          status: transaction.status,
          blockchainTxHash: transaction.blockchainTxHash,
          recipientBankAccount: transaction.recipientBankAccount,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt
        }
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post('/:transactionId/cancel', 
  authenticate, 
  async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId } = req.params;

      const transaction = await transactionService.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.senderId !== req.user?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const cancelledTransaction = await transactionService.cancelTransaction(transactionId);

      res.json({
        message: 'Transaction cancelled successfully',
        transaction: {
          id: cancelledTransaction.id,
          status: cancelledTransaction.status
        }
      });
    } catch (error: any) {
      console.error('Cancel transaction error:', error);
      res.status(400).json({ error: error.message || 'Transaction cancellation failed' });
    }
  }
);

router.get('/rates/current', 
  apiRateLimit, 
  async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({ 
          error: 'From and to currencies are required' 
        });
      }

      const rate = await exchangeService.getExchangeRate(
        from as string,
        to as string
      );

      res.json({ rate });
    } catch (error: any) {
      console.error('Get current rate error:', error);
      res.status(400).json({ error: error.message || 'Failed to get exchange rate' });
    }
  }
);

router.get('/rates/supported', 
  apiRateLimit, 
  async (req: Request, res: Response) => {
    try {
      const currencies = await exchangeService.getSupportedCurrencies();
      res.json({ currencies });
    } catch (error) {
      console.error('Get supported currencies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;