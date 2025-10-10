import { Router } from 'express';
import { exchangeRateService } from '../services/exchange-rate-api.service.js';
import { 
  MASTERCARD_CURRENCIES, 
  WALLET_CURRENCIES, 
  RECIPIENT_CURRENCIES,
  getCurrencyByCode,
  hasMockToken,
  getMockToken,
} from '../config/currencies.config.js';

const router = Router();

/**
 * GET /api/exchange/currencies
 * Get all supported currencies categorized by payment method
 */
router.get('/currencies', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        mastercard: MASTERCARD_CURRENCIES,
        wallet: WALLET_CURRENCIES,
        recipient: RECIPIENT_CURRENCIES,
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
 * GET /api/exchange/rate
 * Get exchange rate between two currencies
 * Query params: from, to
 */
router.get('/rate', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to',
      });
    }

    const rate = await exchangeRateService.getExchangeRate(
      from as string,
      to as string
    );

    res.json({
      success: true,
      data: {
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
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
 * POST /api/exchange/convert
 * Convert amount between currencies
 * Body: { amount, from, to }
 */
router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, from, to',
      });
    }

    const convertedAmount = await exchangeRateService.convert(
      parseFloat(amount),
      from,
      to
    );

    const rate = await exchangeRateService.getExchangeRate(from, to);

    res.json({
      success: true,
      data: {
        originalAmount: parseFloat(amount),
        originalCurrency: from,
        convertedAmount,
        convertedCurrency: to,
        exchangeRate: rate,
        timestamp: new Date().toISOString(),
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
 * POST /api/exchange/quote
 * Get complete transfer quote with fees and conversion details
 * Body: { senderCurrency, recipientCurrency, amount, paymentMethod }
 */
router.post('/quote', async (req, res) => {
  try {
    const { senderCurrency, recipientCurrency, amount, paymentMethod } = req.body;

    if (!senderCurrency || !recipientCurrency || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Get conversion details
    const details = await exchangeRateService.getConversionDetails(
      parseFloat(amount),
      senderCurrency,
      recipientCurrency
    );

    // Calculate fees (1.5% for mastercard, 1% for wallet)
    const feePercentage = paymentMethod === 'MASTERCARD' ? 1.5 : 1.0;
    const feeAmount = (parseFloat(amount) * feePercentage) / 100;
    const totalAmount = parseFloat(amount) + feeAmount;

    // Check if mock token is available
    const mockToken = getMockToken(recipientCurrency);
    const usesMockToken = hasMockToken(recipientCurrency);

    res.json({
      success: true,
      data: {
        sender: {
          currency: senderCurrency,
          amount: parseFloat(amount),
          symbol: getCurrencyByCode(senderCurrency)?.symbol || '',
        },
        recipient: {
          currency: recipientCurrency,
          amount: details.finalAmount,
          symbol: getCurrencyByCode(recipientCurrency)?.symbol || '',
        },
        conversion: {
          adaAmount: details.adaAmount,
          exchangeRate: details.exchangeRate,
          path: details.path,
        },
        fees: {
          percentage: feePercentage,
          amount: feeAmount,
          totalAmount,
        },
        blockchain: {
          usesMockToken,
          mockToken,
        },
        timestamp: new Date().toISOString(),
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
 * GET /api/exchange/ada-price
 * Get current ADA prices in multiple currencies
 */
router.get('/ada-price', async (req, res) => {
  try {
    const prices = await exchangeRateService.getADAPrices();

    res.json({
      success: true,
      data: {
        prices,
        timestamp: new Date().toISOString(),
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
 * GET /api/exchange/crypto-price/:symbol
 * Get crypto token price (USDT, USDC, etc.)
 */
router.get('/crypto-price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await exchangeRateService.getCryptoPrice(symbol);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        price,
        currency: 'USD',
        timestamp: new Date().toISOString(),
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
 * POST /api/exchange/clear-cache
 * Clear exchange rate cache (admin only)
 */
router.post('/clear-cache', async (req, res) => {
  try {
    exchangeRateService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
