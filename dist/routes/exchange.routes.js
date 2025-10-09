"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exchange_rate_api_service_1 = require("../services/exchange-rate-api.service");
const currencies_config_1 = require("../config/currencies.config");
const router = (0, express_1.Router)();
/**
 * GET /api/exchange/currencies
 * Get all supported currencies categorized by payment method
 */
router.get('/currencies', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                mastercard: currencies_config_1.MASTERCARD_CURRENCIES,
                wallet: currencies_config_1.WALLET_CURRENCIES,
                recipient: currencies_config_1.RECIPIENT_CURRENCIES,
            },
        });
    }
    catch (error) {
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
        const rate = await exchange_rate_api_service_1.exchangeRateService.getExchangeRate(from, to);
        res.json({
            success: true,
            data: {
                from,
                to,
                rate,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
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
        const convertedAmount = await exchange_rate_api_service_1.exchangeRateService.convert(parseFloat(amount), from, to);
        const rate = await exchange_rate_api_service_1.exchangeRateService.getExchangeRate(from, to);
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
    }
    catch (error) {
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
        const details = await exchange_rate_api_service_1.exchangeRateService.getConversionDetails(parseFloat(amount), senderCurrency, recipientCurrency);
        // Calculate fees (1.5% for mastercard, 1% for wallet)
        const feePercentage = paymentMethod === 'MASTERCARD' ? 1.5 : 1.0;
        const feeAmount = (parseFloat(amount) * feePercentage) / 100;
        const totalAmount = parseFloat(amount) + feeAmount;
        // Check if mock token is available
        const mockToken = (0, currencies_config_1.getMockToken)(recipientCurrency);
        const usesMockToken = (0, currencies_config_1.hasMockToken)(recipientCurrency);
        res.json({
            success: true,
            data: {
                sender: {
                    currency: senderCurrency,
                    amount: parseFloat(amount),
                    symbol: (0, currencies_config_1.getCurrencyByCode)(senderCurrency)?.symbol || '',
                },
                recipient: {
                    currency: recipientCurrency,
                    amount: details.finalAmount,
                    symbol: (0, currencies_config_1.getCurrencyByCode)(recipientCurrency)?.symbol || '',
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
    }
    catch (error) {
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
        const prices = await exchange_rate_api_service_1.exchangeRateService.getADAPrices();
        res.json({
            success: true,
            data: {
                prices,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
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
        const price = await exchange_rate_api_service_1.exchangeRateService.getCryptoPrice(symbol);
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                price,
                currency: 'USD',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
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
        exchange_rate_api_service_1.exchangeRateService.clearCache();
        res.json({
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
