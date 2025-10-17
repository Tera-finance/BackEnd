import { Router } from 'express';
const router = Router();
/**
 * GET /api/exchange/rates
 * Get exchange rates for fiat currencies
 */
router.get('/rates', async (req, res) => {
    try {
        // TODO: Implement exchange rate fetching from external API
        res.json({
            success: true,
            data: {
                rates: {
                    'USD-IDR': 15700,
                    'USD-CNY': 7.24,
                    'USD-EUR': 0.92,
                    'USD-JPY': 149.50,
                    'USD-MXN': 17.05
                },
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
 * GET /api/exchange/currencies
 * Get supported currencies
 */
router.get('/currencies', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                currencies: [
                    { code: 'USD', symbol: '$', name: 'US Dollar' },
                    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
                    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
                    { code: 'EUR', symbol: '€', name: 'Euro' },
                    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
                    { code: 'MXN', symbol: '$', name: 'Mexican Peso' }
                ]
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
export default router;
