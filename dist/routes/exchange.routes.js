import { Router } from 'express';
import { ExchangeService } from '../services/exchange.service.js';
const router = Router();
/**
 * GET /api/exchange/rates
 * Get exchange rates for all supported currencies
 */
router.get('/rates', async (req, res) => {
    try {
        const baseCurrency = req.query.base || 'USD';
        const rates = await ExchangeService.getAllRates(baseCurrency);
        res.json({
            success: true,
            data: {
                base: baseCurrency,
                rates,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error getting exchange rates:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get exchange rates'
        });
    }
});
/**
 * GET /api/exchange/rate
 * Get exchange rate between two currencies
 */
router.get('/rate', async (req, res) => {
    try {
        const from = req.query.from;
        const to = req.query.to;
        if (!from || !to) {
            return res.status(400).json({
                success: false,
                error: 'Both "from" and "to" currency codes are required'
            });
        }
        const rate = await ExchangeService.fetchExchangeRate(from, to);
        res.json({
            success: true,
            data: {
                from,
                to,
                rate,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error getting exchange rate:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get exchange rate'
        });
    }
});
/**
 * GET /api/exchange/currencies
 * Get supported currencies
 */
router.get('/currencies', async (req, res) => {
    try {
        const currencies = ExchangeService.getSupportedCurrencies();
        res.json({
            success: true,
            data: {
                currencies
            }
        });
    }
    catch (error) {
        console.error('Error getting currencies:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get currencies'
        });
    }
});
/**
 * POST /api/exchange/quote
 * Get a transfer quote with fees
 */
router.post('/quote', async (req, res) => {
    try {
        const { senderCurrency, recipientCurrency, amount } = req.body;
        if (!senderCurrency || !recipientCurrency || !amount) {
            return res.status(400).json({
                success: false,
                error: 'senderCurrency, recipientCurrency, and amount are required'
            });
        }
        const quote = await ExchangeService.getTransferQuote(senderCurrency, recipientCurrency, parseFloat(amount));
        res.json({
            success: true,
            data: {
                sender: {
                    currency: senderCurrency,
                    amount: quote.senderAmount,
                    token: quote.senderToken
                },
                recipient: {
                    currency: recipientCurrency,
                    amount: quote.recipientAmount,
                    token: quote.recipientToken
                },
                exchangeRate: quote.exchangeRate,
                fee: {
                    percentage: 1.5,
                    amount: quote.feeAmount
                },
                total: quote.totalAmount,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error getting quote:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get quote'
        });
    }
});
/**
 * POST /api/exchange/convert
 * Convert amount between currencies
 */
router.post('/convert', async (req, res) => {
    try {
        const { from, to, amount } = req.body;
        if (!from || !to || !amount) {
            return res.status(400).json({
                success: false,
                error: 'from, to, and amount are required'
            });
        }
        const result = await ExchangeService.convertAmount(parseFloat(amount), from, to);
        res.json({
            success: true,
            data: {
                from,
                to,
                inputAmount: parseFloat(amount),
                outputAmount: result.convertedAmount,
                rate: result.rate,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error converting amount:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to convert amount'
        });
    }
});
export default router;
