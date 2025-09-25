import axios from 'axios';
import { config } from '../utils/config';
import { redis } from '../utils/redis';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export class ExchangeService {
  private readonly CACHE_DURATION = 60; // 1 minute cache

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    try {
      const cacheKey = `exchange_rate:${fromCurrency}_${toCurrency}`;
      
      // Try to get from cache first
      const cachedRate = await redis.get(cacheKey);
      if (cachedRate) {
        return JSON.parse(cachedRate);
      }

      // Fetch from Indodax API
      const rate = await this.fetchRateFromIndodax(fromCurrency, toCurrency);
      
      // Cache the result
      await redis.setex(cacheKey, this.CACHE_DURATION, JSON.stringify(rate));
      
      return rate;
    } catch (error) {
      console.error('Get exchange rate error:', error);
      throw new Error('Failed to get exchange rate');
    }
  }

  private async fetchRateFromIndodax(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    try {
      // For USDC to IDR conversion
      if (fromCurrency === 'USDC' && toCurrency === 'IDR') {
        const response = await axios.get(`${config.indodax.apiUrl}/ticker/usdcidr`);
        
        if (response.data && response.data.ticker) {
          return {
            from: fromCurrency,
            to: toCurrency,
            rate: parseFloat(response.data.ticker.last),
            timestamp: Date.now()
          };
        }
      }

      // For USD to IDR conversion (fallback)
      if ((fromCurrency === 'USD' || fromCurrency === 'USDC') && toCurrency === 'IDR') {
        const response = await axios.get(`${config.indodax.apiUrl}/ticker/usdidr`);
        
        if (response.data && response.data.ticker) {
          return {
            from: fromCurrency,
            to: toCurrency,
            rate: parseFloat(response.data.ticker.last),
            timestamp: Date.now()
          };
        }
      }

      throw new Error('Unsupported currency pair');
    } catch (error) {
      console.error('Indodax API error:', error);
      
      // Fallback to mock rate for development
      return {
        from: fromCurrency,
        to: toCurrency,
        rate: fromCurrency === 'USDC' && toCurrency === 'IDR' ? 15000 : 1,
        timestamp: Date.now()
      };
    }
  }

  async calculateTransferAmount(
    sourceAmount: number,
    fromCurrency: string,
    toCurrency: string,
    feePercentage: number = 0.01 // 1% default fee
  ): Promise<{
    sourceAmount: number;
    targetAmount: number;
    exchangeRate: number;
    feeAmount: number;
    totalAmount: number;
  }> {
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
    } catch (error) {
      console.error('Calculate transfer amount error:', error);
      throw new Error('Failed to calculate transfer amount');
    }
  }

  async getSupportedCurrencies(): Promise<string[]> {
    return ['USDC', 'USDT', 'USD', 'IDR'];
  }

  async getHistoricalRates(
    fromCurrency: string,
    toCurrency: string,
    days: number = 7
  ): Promise<ExchangeRate[]> {
    try {
      // Mock historical data for now
      const rates: ExchangeRate[] = [];
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
    } catch (error) {
      console.error('Get historical rates error:', error);
      throw new Error('Failed to get historical rates');
    }
  }
}