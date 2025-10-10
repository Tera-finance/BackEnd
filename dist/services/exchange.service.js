import axios from 'axios';
import { config } from '../utils/config.js';
import { redis } from '../utils/redis.js';
export class ExchangeService {
    constructor() {
        this.CACHE_DURATION = 60; // 1 minute cache
    }
    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            const cacheKey = `exchange_rate:${fromCurrency}_${toCurrency}`;
            // Try to get from cache first
            const cachedRate = await redis.get(cacheKey);
            if (cachedRate) {
                return JSON.parse(cachedRate);
            }
            // Fetch from exchange rate API
            const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
            // Cache the result
            await redis.setex(cacheKey, this.CACHE_DURATION, JSON.stringify(rate));
            return rate;
        }
        catch (error) {
            console.error('Get exchange rate error:', error);
            throw new Error('Failed to get exchange rate');
        }
    }
    async fetchExchangeRate(fromCurrency, toCurrency) {
        try {
            // Use free exchange rate API or fallback to mock rates
            if (config.exchange.apiUrl) {
                try {
                    const response = await axios.get(`${config.exchange.apiUrl}/${fromCurrency}`);
                    if (response.data && response.data.rates && response.data.rates[toCurrency]) {
                        return {
                            from: fromCurrency,
                            to: toCurrency,
                            rate: response.data.rates[toCurrency],
                            timestamp: Date.now()
                        };
                    }
                }
                catch (apiError) {
                    console.warn('Exchange rate API failed, using fallback rates:', apiError);
                }
            }
            // Fallback mock rates for development/testing
            const mockRates = {
                'USD_IDR': 15000,
                'USDC_IDR': 15000,
                'USD_USDC': 1,
                'IDR_USD': 1 / 15000,
                'IDR_USDC': 1 / 15000,
                'USDC_USD': 1
            };
            const rateKey = `${fromCurrency}_${toCurrency}`;
            const rate = mockRates[rateKey] || 1;
            return {
                from: fromCurrency,
                to: toCurrency,
                rate: rate,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error('Exchange rate fetch error:', error);
            // Final fallback
            return {
                from: fromCurrency,
                to: toCurrency,
                rate: 1,
                timestamp: Date.now()
            };
        }
    }
    async calculateTransferAmount(sourceAmount, fromCurrency, toCurrency, feePercentage = 0.01 // 1% default fee
    ) {
        try {
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            const feeAmount = sourceAmount * feePercentage;
            const amountAfterFee = sourceAmount - feeAmount;
            const targetAmount = amountAfterFee * rate.rate;
            const totalAmount = sourceAmount + feeAmount;
            return {
                sourceAmount,
                targetAmount,
                exchangeRate: rate.rate,
                feeAmount,
                totalAmount
            };
        }
        catch (error) {
            console.error('Calculate transfer amount error:', error);
            throw new Error('Failed to calculate transfer amount');
        }
    }
    async getSupportedCurrencies() {
        return ['USDC', 'USDT', 'USD', 'IDR'];
    }
    async getHistoricalRates(fromCurrency, toCurrency, days = 7) {
        try {
            // Mock historical data for now
            const rates = [];
            const baseRate = 15000; // Base USDC to IDR rate
            for (let i = days - 1; i >= 0; i--) {
                const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
                rates.push({
                    from: fromCurrency,
                    to: toCurrency,
                    rate: baseRate * (1 + variation),
                    timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
                });
            }
            return rates;
        }
        catch (error) {
            console.error('Get historical rates error:', error);
            throw new Error('Failed to get historical rates');
        }
    }
}
